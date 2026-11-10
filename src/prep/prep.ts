// Fase 0 — preparo da argila: regras puras (sem React, sem three).
// A quantidade é medida em relação à bola padrão do torno (1 = bola de sempre).

export type PrepStep = 'cut' | 'throw' | 'roll' | 'ready'

/**
 * Mínimo: parede suficiente para a peça. Máximo: a bola ainda cabe na cabeça do torno
 * (raio abaixo de R_MAX) e mantém o desempenho. Faixa larga para a diferença aparecer:
 * do menor ao maior o volume muda 7,4× e o tamanho da bola quase dobra.
 */
export const AMOUNT_MIN = 0.35
export const AMOUNT_MAX = 2.6
export const AMOUNT_DEFAULT = 1

/** Referências visuais do fio de corte */
export const AMOUNT_REFS = [
  { id: 'S', amount: 0.55 }, // xícara, potinho
  { id: 'M', amount: 1 }, // caneca, tigela
  { id: 'L', amount: 2.1 }, // vaso alto
] as const
export type AmountRef = (typeof AMOUNT_REFS)[number]['id']

export function clampAmount(a: number) {
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, a))
}

/**
 * Escala da massa para uma quantidade: a mesma em todo o jogo (porção cortada, massa dos
 * arremessos, placa do rolo, bola pronta e bola no torno). A quantidade é volume, então o
 * tamanho cresce pela raiz cúbica.
 */
export function amountScale(amount: number) {
  return Math.cbrt(clampAmount(amount))
}

/** Referência mais próxima da quantidade escolhida */
export function nearestRef(amount: number): AmountRef {
  let best: (typeof AMOUNT_REFS)[number] = AMOUNT_REFS[0]
  for (const r of AMOUNT_REFS) if (Math.abs(r.amount - amount) < Math.abs(best.amount - amount)) best = r
  return best.id
}

/** Gerador pseudoaleatório com semente (mulberry32): a mesma semente desenha a mesma massa */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31)
}

/** Arremessos para tirar todas as bolhas: sorteados a cada peça */
export const THROWS_MIN = 3
export const THROWS_MAX = 10
/** Bolhas desenhadas no máximo (a massa nasce com algumas a mais que os arremessos) */
export const BUBBLES_MAX = 16

/** Sorteio do preparo de uma peça: quantos arremessos, quantas bolhas e a semente da forma */
export function rollPrep(seed = newSeed()) {
  const rand = seededRandom(seed)
  const throwsNeeded = THROWS_MIN + Math.floor(rand() * (THROWS_MAX - THROWS_MIN + 1))
  const bubbles = Math.min(BUBBLES_MAX, throwsNeeded + 2 + Math.floor(rand() * 5))
  return { seed, throwsNeeded, bubbles }
}

/**
 * Quantas bolhas um arremesso solta: a média que falta, mais com arremesso forte, mas sempre
 * deixando pelo menos uma para cada arremesso que ainda falta (o total sorteado se cumpre).
 */
export function bubblesReleased(remaining: number, throwsLeft: number, strength: number) {
  if (remaining <= 0) return 0
  if (throwsLeft <= 1) return remaining
  const avg = remaining / throwsLeft
  const most = Math.max(1, remaining - (throwsLeft - 1))
  return Math.min(most, Math.max(1, Math.round(avg * (0.7 + 0.6 * strength))))
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
