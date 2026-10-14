import { Vector4 } from 'three'
import type { HoleRecipe } from '../store/persistence'
import type { Profile } from './profile'

// Furos da espátula: recortados no shader pela posição na peça (ângulo × altura), e não
// pelo UV, para o mesmo furo atravessar a parede de fora e a de dentro. Formatos por
// funções de distância (redondo, estrela, coração, gota), com uma bordinha mais escura.

export const MAX_HOLES = 12

/** x = ângulo (rad), y = altura (local), z = raio (mundo), w = formato (0 redondo, 1 estrela, 2 coração, 3 gota) */
export const holeUniforms = {
  holeData: { value: Array.from({ length: MAX_HOLES }, () => new Vector4()) },
  holeCount: { value: 0 },
}

const SHAPE_ID: Record<HoleRecipe['shape'], number> = { round: 0, star: 1, heart: 2, drop: 3 }

/** Atualiza os furos no shader (chamar quando os furos ou a altura da peça mudarem) */
export function syncHoles(holes: HoleRecipe[], p: Profile) {
  const n = Math.min(MAX_HOLES, holes.length)
  for (let i = 0; i < n; i++) {
    const h = holes[i]
    holeUniforms.holeData.value[i].set(h.u * Math.PI * 2, h.v * p.height, h.size, SHAPE_ID[h.shape])
  }
  holeUniforms.holeCount.value = n
}

export const HOLES_VERTEX = /* glsl */ `
varying vec3 vPiecePos;
`

export const HOLES_FRAGMENT = /* glsl */ `
uniform vec4 holeData[${MAX_HOLES}];
uniform int holeCount;
varying vec3 vPiecePos;

float holeStar(vec2 p) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= 1.0;
  vec2 ba = 0.45 * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, 1.0);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float holeHeart(vec2 p) {
  p = p * 0.62 + vec2(0.0, 0.55);
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return (length(p - vec2(0.25, 0.75)) - 0.35355) / 0.62;
  return sqrt(min(dot(p - vec2(0.0, 1.0), p - vec2(0.0, 1.0)), dot(p - 0.5 * max(p.x + p.y, 0.0), p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y) / 0.62;
}
float holeDrop(vec2 p) {
  p.y += 0.45;
  p.x = abs(p.x);
  float r1 = 0.55, r2 = 0.04, h = 1.3;
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);
  float k = dot(p, vec2(-b, a));
  if (k < 0.0) return length(p) - r1;
  if (k > a * h) return length(p - vec2(0.0, h)) - r2;
  return dot(p, vec2(a, b)) - r1;
}
/** Distância (mundo) até a borda do furo mais perto; negativa = dentro do furo */
float holeDistance(vec3 pos) {
  float d = 1e3;
  float ang = atan(pos.x, pos.z);
  float r = length(pos.xz);
  for (int i = 0; i < ${MAX_HOLES}; i++) {
    if (i >= holeCount) break;
    vec4 h = holeData[i];
    float da = ang - h.x;
    da = atan(sin(da), cos(da));
    vec2 q = vec2(da * r, pos.y - h.y) / h.z;
    float s;
    if (h.w < 0.5) s = length(q) - 1.0;
    else if (h.w < 1.5) s = holeStar(q);
    else if (h.w < 2.5) s = holeHeart(q);
    else s = holeDrop(q);
    d = min(d, s * h.z);
  }
  return d;
}
`

/** Começo do fragment shader: descarta o que está dentro de um furo e marca a borda */
export const HOLES_DISCARD = /* glsl */ `
float holeEdge = 0.0;
if (holeCount > 0) {
  float hd = holeDistance(vPiecePos);
  if (hd < 0.0) discard;
  holeEdge = 1.0 - smoothstep(0.0, 0.025, hd);
}
`
