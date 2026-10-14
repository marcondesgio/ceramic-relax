import type { Material } from 'three'
import { HOLES_DISCARD, HOLES_FRAGMENT, HOLES_VERTEX, holeUniforms } from './holes'

// Trechos de shader da hidratação. Duas informações por vértice, escritas pelo
// HydrationController a partir da altura de cada ponto da peça:
//   aDry   — secura: 0 úmida (padrão), 1 seca, negativo = água demais
//   aCrack — fissuras: 0 lisa, 1 bem fissurada (ao vivo no torno; a receita no forno)

/**
 * Escala da fissura: células em U (volta) e V, e um multiplicador da largura da linha.
 * No rolinho da alça (fino na tela, cada tubo é 1/4 do V) as células são poucas e as linhas mais grossas.
 */
export interface CrackScale {
  cells: string
  width: string
}
export const PIECE_CRACK: CrackScale = { cells: 'vec2(22.0, 13.0)', width: '1.0' }
export const HANDLE_CRACK: CrackScale = { cells: 'vec2(3.0, 22.0)', width: '2.2' }

/** Bordas de células (Voronoi) no UV do torno: linhas finas e irregulares, sem costura em U */
export const CRACK_GLSL = /* glsl */ `
vec2 crackHash(vec2 p, float seed) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))) + seed * 17.23;
  return fract(sin(p) * 43758.5453);
}
// amount: 0 a 1 (quantas bordas viram fissura e quão largas); width: espessura base;
// cells: células em U (inteiro: fecha a volta sem costura) e em V
float crackLines(vec2 uv, float amount, float seed, float width, vec2 cells) {
  float CELLS_U = cells.x;
  vec2 p = vec2(uv.x * CELLS_U, uv.y * cells.y);
  // ondula as bordas para não parecerem polígonos (em x, com período que fecha a volta)
  p += 0.28 * vec2(sin(p.y * 1.9 + seed), sin(p.x * 6.2831853 / CELLS_U * 5.0 + seed * 0.7));
  // suavização da borda (células por pixel): calculada antes do "return", porque derivadas
  // precisam rodar em todos os pixels vizinhos. Nunca zero: smoothstep com bordas iguais dá NaN.
  float aa = max(length(fwidth(p)) * 0.9, 0.002);
  // sem fissura (quase toda a peça, quase sempre): sai cedo, bom para o celular
  if (amount < 0.01) return 0.0;
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float f1 = 9.0;
  float f2 = 9.0;
  float pick = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 cell = ip + g;
      cell.x = mod(cell.x, CELLS_U);
      vec2 o = crackHash(cell, seed);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; pick = o.x; }
      else if (d < f2) { f2 = d; }
    }
  }
  float edge = sqrt(f2) - sqrt(f1);
  float w = width * (0.6 + 0.8 * amount);
  float line = 1.0 - smoothstep(w, w + aa, edge);
  // com pouca secagem, só algumas bordas viram fissura
  float keep = smoothstep(pick - 0.15, pick + 0.15, amount * 1.25);
  return line * keep;
}
`

const VERTEX_DECL = /* glsl */ `
attribute float aDry;
attribute float aCrack;
varying float vDry;
varying float vCrack;
`

const FRAGMENT_DECL = /* glsl */ `
varying float vDry;
varying float vCrack;
${CRACK_GLSL}
`

/**
 * Argila crua no torno: úmida é mais escura com brilho suave; secando fica clara e opaca;
 * seca mostra fissuras finas; com água demais fica bem brilhante.
 */
export function applyClayHydration(material: Material, scale = PIECE_CRACK, holes = false) {
  material.defines = { ...(material.defines ?? {}), USE_UV: '', CRACK_CELLS: scale.cells, CRACK_WIDTH: scale.width }
  material.onBeforeCompile = (shader) => {
    if (holes) withHoles(shader)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_DECL}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDry = aDry;\nvCrack = aCrack;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_DECL}`)
      .replace(
        '#include <map_fragment>',
        /* glsl */ `#include <map_fragment>
        float clayDry = smoothstep(0.0, 1.0, clamp(vDry, 0.0, 1.0));
        float claySoak = clamp(-vDry / 0.5, 0.0, 1.0);
        float clayCrack = crackLines(vUv, vCrack, 0.0, 0.035 * CRACK_WIDTH, CRACK_CELLS);
        diffuseColor.rgb *= mix(vec3(0.9), vec3(1.13, 1.09, 1.04), clayDry);
        diffuseColor.rgb *= 1.0 - 0.08 * claySoak;
        diffuseColor.rgb *= 1.0 - 0.32 * clayCrack;
        ${holes ? 'diffuseColor.rgb *= 1.0 - 0.35 * holeEdge;' : ''}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.42, 0.92, clayDry) - 0.2 * claySoak;
        roughnessFactor = mix(roughnessFactor, 1.0, clayCrack);`,
      )
  }
  material.customProgramCacheKey = () => `clay-hydration-${scale.cells}-${holes}`
  material.needsUpdate = true
}

/**
 * Furos da espátula (só na parede da peça, não nas alças): posição da peça para o shader,
 * descarte dentro do furo e a variável holeEdge (bordinha) para escurecer a cor.
 */
export function withHoles(shader: { uniforms: Record<string, unknown>; vertexShader: string; fragmentShader: string }) {
  shader.uniforms.holeData = holeUniforms.holeData
  shader.uniforms.holeCount = holeUniforms.holeCount
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${HOLES_VERTEX}`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPiecePos = position;')
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${HOLES_FRAGMENT}`)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${HOLES_DISCARD}`)
}

/** Para o esmalte: mesmas declarações (o craquelado e o ouro ficam em paint/glazeMaterial) */
export const GLAZE_VERTEX_DECL = VERTEX_DECL
export const GLAZE_FRAGMENT_DECL = FRAGMENT_DECL
