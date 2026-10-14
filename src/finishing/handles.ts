import { BufferAttribute, CatmullRomCurve3, TubeGeometry, Vector3, type Mesh } from 'three'
import type { HandleRecipe } from '../store/persistence'
import { PROFILE_SAMPLES, outerRadiusAt, type Profile } from '../pottery/profile'
import { HANDLE_DOUBLE, HANDLE_EAR, HANDLE_TALL } from '../shop/items'

// Alças pré-moldadas: malhas separadas (tubos) presas na parede da peça.
// A forma vem de pontos-chave no plano da alça (para fora da parede × altura), ligados
// por uma curva suave; as pontas entram um pouquinho na parede. Como o raio da parede é
// lido do perfil, a alça acompanha a peça se ela for remodelada.

export type HandleShape = HandleRecipe['shape']

export const HANDLE_SHAPES: HandleShape[] = ['ring', 'ear', 'double', 'tall']

/** Item da lojinha que libera cada alça (null = gratuita) */
export const HANDLE_ITEM: Record<HandleShape, string | null> = {
  ring: null,
  ear: HANDLE_EAR,
  double: HANDLE_DOUBLE,
  tall: HANDLE_TALL,
}

/** No máximo duas alças por peça (a dupla conta como uma, com dois tubos) */
export const MAX_HANDLES = 2
/** Faixas do canvas de pintura das alças (uma por tubo) */
export const MAX_TUBES = 4

const TUBULAR = 40
const RADIAL = 10
/** As pontas entram na parede para a junção não aparecer */
const EMBED = -0.03
/** Margem nas pontas de cada faixa do canvas (o pincel não vaza para o tubo vizinho) */
const ROW_MARGIN = 0.04

export const THICK_MIN = 0.03
export const THICK_MAX = 0.09
export const OPEN_MIN = 0.1
export const OPEN_MAX = 0.65

/** Tamanho inicial de cada formato: altura (fração da peça), abertura e espessura (× escala) */
const DEFAULTS: Record<HandleShape, { height: number; opening: number; thickness: number }> = {
  ring: { height: 0.28, opening: 0.24, thickness: 0.045 },
  ear: { height: 0.55, opening: 0.3, thickness: 0.05 },
  double: { height: 0.34, opening: 0.2, thickness: 0.04 },
  tall: { height: 0.55, opening: 0.3, thickness: 0.05 },
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))

function maxRadius(p: Profile) {
  let r = 0
  for (let i = 0; i < PROFILE_SAMPLES; i++) r = Math.max(r, p.radii[i])
  return r
}

/** Escala das alças: acompanha o tamanho da peça */
function pieceScale(p: Profile) {
  return clamp(Math.max(p.height, maxRadius(p) * 2) / 2, 0.6, 1.6)
}

/** Mantém a alça dentro da peça e as medidas nos limites */
export function clampHandle(h: HandleRecipe): HandleRecipe {
  const height = clamp(h.height, 0.15, 0.85)
  const half = height / 2
  return {
    ...h,
    u: ((h.u % 1) + 1) % 1,
    height,
    v: clamp(h.v, 0.06 + half, 1 - half),
    opening: clamp(h.opening, OPEN_MIN, OPEN_MAX),
    thickness: clamp(h.thickness, THICK_MIN, THICK_MAX),
  }
}

/** Alça nova no ponto tocado (ângulo em radianos no espaço da peça, altura local) */
export function newHandle(shape: HandleShape, p: Profile, angle: number, y: number, joint: number): HandleRecipe {
  const d = DEFAULTS[shape]
  const k = pieceScale(p)
  return clampHandle({
    shape,
    u: angle / (Math.PI * 2),
    v: y / p.height,
    height: d.height,
    opening: d.opening * k,
    thickness: d.thickness * k,
    joint,
  })
}

/** Pontos-chave (para fora da parede, altura) da alça */
function keyPoints(h: HandleRecipe, H: number): [number, number][] {
  const S = h.height * H
  const c = h.v * H
  const O = h.opening
  const top = c + S / 2
  const bot = c - S / 2
  switch (h.shape) {
    case 'ring':
      // argola de xícara: quase um círculo
      return [
        [EMBED, top],
        [O * 0.62, top + S * 0.06],
        [O, c],
        [O * 0.62, bot - S * 0.06],
        [EMBED, bot],
      ]
    case 'tall':
      // alça alta de jarra: sobe acima da junção de cima antes de descer
      return [
        [EMBED, top],
        [O * 0.35, top + S * 0.32],
        [O * 0.9, top + S * 0.18],
        [O, c - S * 0.05],
        [O * 0.6, bot + S * 0.08],
        [EMBED, bot],
      ]
    default:
      // orelha (caneca) e dupla (ânfora): formato de D
      return [
        [EMBED, top],
        [O * 0.7, top + S * 0.02],
        [O, top - S * 0.28],
        [O, bot + S * 0.28],
        [O * 0.7, bot - S * 0.02],
        [EMBED, bot],
      ]
  }
}

/** Ângulos dos tubos da alça (a dupla tem um de cada lado) */
export function tubeAngles(h: HandleRecipe) {
  const a = h.u * Math.PI * 2
  return h.shape === 'double' ? [a, a + Math.PI] : [a]
}

/** Curva da alça no espaço da peça (x = r·sen θ, z = r·cos θ, como o torno) */
export function handleCurve(h: HandleRecipe, p: Profile, angle: number) {
  const sx = Math.sin(angle)
  const sz = Math.cos(angle)
  const pts = keyPoints(h, p.height).map(([out, y]) => {
    const r = outerRadiusAt(p, clamp(y, 0, p.height)) + out
    return new Vector3(sx * r, y, sz * r)
  })
  return new CatmullRomCurve3(pts, false, 'centripetal')
}

/**
 * Tubo da alça. UV para a pintura: U = volta do tubo (repete), V = faixa `row` do canvas
 * ao longo do comprimento. Fissura da junção (aCrack) só perto das pontas.
 * Retorna também o comprimento de pintura (unidades de mundo que cabem no canvas inteiro em V).
 */
export function buildTube(curve: CatmullRomCurve3, thickness: number, row: number, joint: number) {
  const geo = new TubeGeometry(curve, TUBULAR, thickness, RADIAL, false)
  const uv = geo.attributes.uv.array as Float32Array
  const count = geo.attributes.position.count
  const dry = new Float32Array(count)
  const crack = new Float32Array(count)
  for (let i = 0; i <= TUBULAR; i++) {
    const t = i / TUBULAR
    const v = 1 - (row + ROW_MARGIN + (1 - 2 * ROW_MARGIN) * t) / MAX_TUBES
    const end = Math.min(t, 1 - t)
    const c = joint > 0 ? joint * (1 - Math.min(1, end / 0.28)) : 0
    for (let j = 0; j <= RADIAL; j++) {
      const idx = i * (RADIAL + 1) + j
      uv[idx * 2] = j / RADIAL
      uv[idx * 2 + 1] = v
      crack[idx] = c
    }
  }
  geo.attributes.uv.needsUpdate = true
  geo.setAttribute('aDry', new BufferAttribute(dry, 1))
  geo.setAttribute('aCrack', new BufferAttribute(crack, 1))
  const length = curve.getLength()
  return { geometry: geo, paintLength: (length * MAX_TUBES) / (1 - 2 * ROW_MARGIN) }
}

/** Onde ficam os 3 pontos de controle (espaço da peça) */
export function knobPoints(h: HandleRecipe, p: Profile) {
  const angle = tubeAngles(h)[0]
  const curve = handleCurve(h, p, angle)
  const out = new Vector3(Math.sin(angle), 0, Math.cos(angle))
  return {
    // altura: na junção de cima
    height: curve.getPoint(0.1),
    // abertura: no ponto mais afastado da parede
    opening: curve.getPoint(0.5).addScaledVector(out, h.thickness + 0.02),
    // espessura: na parte de baixo, um pouco para fora do rolinho
    thickness: curve.getPoint(0.78).addScaledVector(out, h.thickness + 0.04),
    out,
  }
}

/** Quanto as alças passam da parede (para caber na porta do forno e na foto) */
export function handlesReach(handles: HandleRecipe[]) {
  let reach = 0
  for (const h of handles) reach = Math.max(reach, h.opening + h.thickness)
  return reach
}

/** Malhas das alças na cena (para a pintura e as prévias do forno) */
export const handlesRuntime = {
  meshes: [] as Mesh[],
  /** pontos de controle da alça selecionada: altura, abertura, espessura */
  knobs: [] as Mesh[],
  /** quanto as alças passam da parede (o forno e a foto enquadram a peça com elas) */
  reach: 0,
}
