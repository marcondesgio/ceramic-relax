import type { Finish } from '../store/useGameStore'
import type { HandleRecipe, HoleRecipe } from '../store/persistence'
import { PROFILE_SAMPLES, type Profile } from '../pottery/profile'
import { getSurface, type SurfaceId } from '../paint/paintSurface'
import { PALETTE } from '../paint/palette'
import type { StampId } from '../paint/stamps'
import type { OrderWants, PieceType } from './animals'

// Como o jogo "lê" a peça pronta, sem mostrar números ao jogador:
// tipo (proporção + boca + alças), cor principal (a que cobre mais área), estampa e acabamento.

export interface PieceTraits {
  type: PieceType
  /** índice da paleta, ou null se quase nada foi pintado (cor de biscoito) */
  color: number | null
  bands: boolean
  stamps: StampId[]
  finish: Finish
  /** acabamento: formatos de alça e de furo usados, e se tem ripado vertical */
  handles: HandleRecipe['shape'][]
  holes: HoleRecipe['shape'][]
  fluting: boolean
}

export type ReactionLevel = 'none' | 'some' | 'all'

/** Proporção altura ÷ largura, boca e alças → prato, tigela, caneca, potinho, vaso, vaso alto */
export function pieceType(p: Profile, handles: HandleRecipe[]): PieceType {
  let rMax = 0
  for (let i = 0; i < PROFILE_SAMPLES; i++) rMax = Math.max(rMax, p.radii[i])
  const ratio = p.height / (2 * rMax)
  // boca aberta e larga (perto do raio máximo): forma de tigela/prato
  const open = p.mouthDepth > 0.05 && p.radii[PROFILE_SAMPLES - 1] > rMax * 0.75
  if (ratio < 0.32) return 'plate'
  if (handles.some((h) => h.shape === 'ring' || h.shape === 'ear') && ratio < 2) return 'mug'
  if (ratio < 0.75 && open) return 'bowl'
  if (ratio < 1.35) return ratio < 0.6 ? 'bowl' : 'pot'
  if (ratio < 2.3) return 'vase'
  return 'tallVase'
}

const PALETTE_RGB = PALETTE.map((c) => {
  const n = parseInt(c.hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
})

const SAMPLE = 48
let sampler: CanvasRenderingContext2D | null = null

/** Conta a área de cada cor da paleta num canvas de pintura (reduzido para ficar leve) */
function countColors(id: SurfaceId, counts: number[]) {
  sampler ??= (() => {
    const c = document.createElement('canvas')
    c.width = SAMPLE
    c.height = SAMPLE
    return c.getContext('2d', { willReadFrequently: true })!
  })()
  sampler.clearRect(0, 0, SAMPLE, SAMPLE)
  sampler.drawImage(getSurface(id).canvas, 0, 0, SAMPLE, SAMPLE)
  const data = sampler.getImageData(0, 0, SAMPLE, SAMPLE).data
  let painted = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    painted++
    let best = 0
    let bestD = Infinity
    PALETTE_RGB.forEach(([r, g, b], k) => {
      const d = (data[i] - r) ** 2 + (data[i + 1] - g) ** 2 + (data[i + 2] - b) ** 2
      if (d < bestD) {
        bestD = d
        best = k
      }
    })
    counts[best]++
  }
  return painted
}

/** Cor que cobre mais área (fora da peça + alças). Pouca tinta = sem cor (biscoito). */
export function mainColor(): number | null {
  const counts = PALETTE.map(() => 0)
  const painted = countColors('outer', counts) + countColors('handle', counts) * 0.15
  if (painted < SAMPLE * SAMPLE * 0.12) return null
  let best = 0
  counts.forEach((c, k) => {
    if (c > counts[best]) best = k
  })
  return best
}

export function readTraits(
  p: Profile,
  handles: HandleRecipe[],
  paint: { stampsUsed?: StampId[]; bandsUsed?: boolean },
  finish: Finish,
  holes: HoleRecipe[] = [],
  fluting = false,
): PieceTraits {
  return {
    type: pieceType(p, handles),
    color: mainColor(),
    bands: !!paint.bandsUsed,
    stamps: paint.stampsUsed ?? [],
    finish,
    handles: handles.map((h) => h.shape),
    holes: holes.map((h) => h.shape),
    fluting,
  }
}

/** Quantos traços pedidos batem: nenhum, alguns ou todos (a recompensa nunca muda) */
export function reactionLevel(wants: OrderWants, t: PieceTraits): ReactionLevel {
  const checks: boolean[] = []
  if (wants.types) checks.push(wants.types.includes(t.type))
  if (wants.colors) checks.push(t.color !== null && wants.colors.includes(t.color))
  if (wants.pattern) {
    if (wants.pattern === 'bands') checks.push(t.bands)
    else if (wants.pattern === 'none') checks.push(!t.bands && t.stamps.length === 0)
    else checks.push(t.stamps.includes(wants.pattern))
  }
  if (wants.finish) checks.push(t.finish === wants.finish)
  if (wants.handle) checks.push(t.handles.includes(wants.handle))
  if (wants.holes) checks.push(t.holes.includes(wants.holes))
  if (wants.fluting) checks.push(t.fluting)
  const hits = checks.filter(Boolean).length
  if (hits === 0) return 'none'
  return hits === checks.length ? 'all' : 'some'
}
