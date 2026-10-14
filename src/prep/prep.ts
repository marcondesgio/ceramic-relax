// Fase 0 — preparo da argila: regras puras (sem React, sem three).
// A quantidade é medida em relação à bola padrão do torno (1 = bola de sempre).

export type PrepStep = 'cut' | 'throw' | 'roll' | 'ready'

/** Mínimo: parede suficiente para a peça. Máximo: cabe no torno e mantém o desempenho. */
export const AMOUNT_MIN = 0.5
export const AMOUNT_MAX = 2
export const AMOUNT_DEFAULT = 1

/** Referências visuais do fio de corte */
export const AMOUNT_REFS = [
  { id: 'S', amount: 0.65 }, // xícara, potinho
  { id: 'M', amount: 1 }, // caneca, tigela
  { id: 'L', amount: 1.6 }, // vaso alto
] as const
export type AmountRef = (typeof AMOUNT_REFS)[number]['id']

export function clampAmount(a: number) {
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, a))
}

/** Referência mais próxima da quantidade escolhida */
export function nearestRef(amount: number): AmountRef {
  let best: (typeof AMOUNT_REFS)[number] = AMOUNT_REFS[0]
  for (const r of AMOUNT_REFS) if (Math.abs(r.amount - amount) < Math.abs(best.amount - amount)) best = r
  return best.id
}

/** Bolhas no começo dos arremessos; cada arremesso solta parte delas (cerca de 6 arremessos) */
export const BUBBLES_START = 12

/** Quantas bolhas um arremesso solta: mais no começo, pelo menos uma */
export function bubblesReleased(remaining: number, strength: number) {
  if (remaining <= 0) return 0
  return Math.min(remaining, Math.max(1, Math.round(remaining * (0.18 + 0.12 * strength))))
}

/** Dobras para a massa ficar lisa */
export const FOLDS_NEEDED = 2

/** Cada bolha que sobrou vira algumas marquinhas na peça */
export const MARKS_PER_BUBBLE = 2

/** Marquinhas artesanais deixadas pelas bolhas (null = argila lisinha) */
export interface ClayMarks {
  count: number
  seed: number
}

export function marksFromBubbles(bubbles: number): ClayMarks | null {
  if (bubbles <= 0) return null
  return { count: bubbles * MARKS_PER_BUBBLE, seed: Math.floor(Math.random() * 1e9) }
}
