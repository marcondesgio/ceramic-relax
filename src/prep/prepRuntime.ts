import type { PrepStep } from './prep'
import { AMOUNT_MAX, BUBBLES_START } from './prep'

// Medidas da bancada (espaço local: centro do tampo da mesinha, y = 0 no tampo)
// e o estado de cada quadro do preparo, fora do React.

/** Bloco de argila do corte: deitado ao longo de x */
export const BLOCK_LEN = 1.6
export const BLOCK_X0 = -BLOCK_LEN / 2
export const BLOCK_H = 0.38
export const BLOCK_D = 0.46

/** Massa dos arremessos (raio da bola com quantidade 1) e quanto ela sobe ao puxar */
export const LUMP_R = 0.3
export const LIFT_MAX = 0.9

/**
 * Placa do rolo (quantidade 1; o grupo inteiro escala com a quantidade).
 * O volume se conserva: mais fina → mais comprida. Cada dobra dobra a espessura.
 */
export const SLAB_W = 0.62
export const SLAB_T0 = 0.26 // espessura da massa recém-arremessada
export const SLAB_T1 = 0.08 // espessura quando está bem achatada
const SLAB_L1 = 0.84 // comprimento quando está bem achatada
export const SLAB_VOLUME = SLAB_W * SLAB_L1 * SLAB_T1
export const PIN_R = 0.055

/** Durações (s); com "reduzir animações" ficam bem curtas */
export const CUT_TIME = 0.8
export const CUT_DOWN = 0.35
export const FOLD_TIME = 0.55
export const MORPH_TIME = 0.35
export const READY_TIME = 0.5

/** Escala visual da massa conforme a quantidade (o volume cresce com o cubo) */
export function amountScale(amount: number) {
  return Math.cbrt(amount)
}

/** Posição x do fio para uma quantidade */
export function wireXFor(amount: number) {
  return BLOCK_X0 + (amount / AMOUNT_MAX) * BLOCK_LEN
}

/** Espessura e comprimento da placa: `roll` 0 a 1 no ciclo atual, `folds` já feitas */
export function slabSize(roll: number, folds: number) {
  const start = folds === 0 ? SLAB_T0 : SLAB_T1 * 2
  const t = start + (SLAB_T1 - start) * roll
  return { t, l: SLAB_VOLUME / (SLAB_W * t) }
}

export const ease = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

export const prepRuntime = {
  /** etapa que o quadro já preparou (troca de etapa reinicia as animações) */
  step: null as PrepStep | null,
  /** 0 a 1: troca de forma entre etapas (bloco → massa → placa) */
  morph: 1,

  // corte
  wireX: wireXFor(1),
  /** tempo desde "Cortar" (−1 = sem corte em andamento) */
  cutT: -1,

  // arremessos
  dragging: false,
  /** 0 a 1: o quanto o jogador puxou a massa para cima */
  lift: 0,
  lumpY: 0,
  lumpVy: 0,
  falling: false,
  throwStrength: 0,
  squash: 1,
  squashV: 0,
  /** bolha (índice) → tempo desde que estourou */
  pops: new Map<number, number>(),
  /** tempo desde que a última bolha saiu (passa sozinho para o rolo) */
  doneT: 0,

  // rolo e dobras
  roll: 0,
  pinZ: 0,
  pinAngle: 0,
  /** tempo da dobra em andamento (−1 = nenhuma) */
  foldT: -1,
  /** deslocamento da placa depois da dobra (volta ao centro aos poucos) */
  slabShift: 0,
  /** 0 a 1: rolo em movimento (som da argila) */
  rubbing: 0,

  // pronto
  readyT: 0,

  /** pedidos da interface, atendidos no próximo quadro */
  request: null as 'cut' | 'fold' | null,
}

/** Começa uma etapa do zero */
export function enterStep(step: PrepStep, amount: number, folds: number) {
  const r = prepRuntime
  r.step = step
  r.morph = step === 'cut' ? 1 : 0
  r.request = null
  if (step === 'cut') {
    r.wireX = wireXFor(amount)
    r.cutT = -1
  }
  if (step === 'throw') {
    r.dragging = false
    r.lift = 0
    r.lumpY = 0
    r.lumpVy = 0
    r.falling = false
    r.squash = 1
    r.squashV = 0
    r.pops.clear()
    r.doneT = 0
  }
  if (step === 'roll') {
    r.roll = 0
    r.foldT = -1
    r.slabShift = 0
    r.pinZ = slabSize(0, folds).l / 2
    r.pinAngle = 0
  }
  if (step === 'ready') r.readyT = 0
}

/** Quantas bolhas aparecem desenhadas (as que estouraram somem com animação) */
export const BUBBLE_COUNT = BUBBLES_START
