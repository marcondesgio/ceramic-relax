import { BASE_COLORS, PALETTE } from '../paint/palette'
import { BASE_STAMPS, STAMPS, type StampId } from '../paint/stamps'
import type { HoleRecipe } from '../store/persistence'
import { itemFor } from './catalog'

// O que cada compra libera. Gratuitos: as 12 cores, os 6 primeiros carimbos,
// o ripador horizontal, o furo redondo e a argola (ver finishing/handles.ts).

export type HoleShape = HoleRecipe['shape']
export const HOLE_SHAPES: HoleShape[] = ['round', 'star', 'heart', 'drop']

/** Item que libera o ripador vertical */
export const FLUTE_ITEM = 'tool-flute'

/** Índices da paleta liberados (as 12 de base + as cores extras compradas) */
export function unlockedColors(purchases: string[]) {
  return PALETTE.map((_, i) => i).filter((i) => {
    if (i < BASE_COLORS) return true
    const item = itemFor('colors', PALETTE[i].id)
    return !!item && purchases.includes(item.id)
  })
}

export function unlockedStamps(purchases: string[]): StampId[] {
  return STAMPS.filter((id, i) => {
    if (i < BASE_STAMPS) return true
    const item = itemFor('stamps', id)
    return !!item && purchases.includes(item.id)
  })
}

export function holeUnlocked(shape: HoleShape, purchases: string[]) {
  if (shape === 'round') return true
  const item = itemFor('tools', shape)
  return !!item && purchases.includes(item.id)
}

export function fluteUnlocked(purchases: string[]) {
  return purchases.includes(FLUTE_ITEM)
}
