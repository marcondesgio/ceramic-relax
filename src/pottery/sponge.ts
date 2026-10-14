import { Vector3, type Object3D } from 'three'
import { useGameStore } from '../store/useGameStore'
import { playEffect } from '../audio/sounds'

// Esponja e balde de água ao lado do torno: estado de cada quadro, fora do React.

/** Banquinho com o balde, à direita do torno (fora do círculo livre do torno) */
export const BUCKET_POS = new Vector3(2.15, 0, 0.45)
export const STOOL_H = 0.55

export interface Drop {
  /** ângulo em volta da peça e altura, no espaço da peça (gira junto com o torno) */
  angle: number
  y: number
  speed: number
  life: number
}

export const MAX_DROPS = 28

export const spongeRuntime = {
  /** água na esponja: 1 = cheia (acabou de molhar no balde), 0 = espremida */
  load: 0,
  /** tempo desde a última molhada no balde (animação de mergulho) */
  dipT: 99,
  /** ponteiro na tela */
  pointer: { x: 0, y: 0, inside: false, pressed: false, touch: false },
  /** onde a esponja encosta na peça (mundo) e a altura/ângulo no espaço da peça */
  hit: false,
  point: new Vector3(),
  normal: new Vector3(0, 0, 1),
  localY: 0,
  angle: 0,
  /** 0 a 1: esponja sendo apertada (visual) */
  squeeze: 0,
  drops: [] as Drop[],
  /** malha do balde (para o clique no balde) */
  bucket: null as Object3D | null,
}

/** Mergulha a esponja no balde: cheia de água e pronta para usar */
export function dipSponge() {
  spongeRuntime.load = 1
  spongeRuntime.dipT = 0
  useGameStore.getState().setSponge('wet')
  playEffect('pour', { rate: 1.25, volume: 0.9 })
}

/**
 * Botão da esponja e tecla E: pega a esponja (já molhada); se ela secou, molha de novo;
 * se ainda tem água, guarda.
 */
export function toggleSponge() {
  const { sponge, setSponge } = useGameStore.getState()
  if (sponge === 'wet') setSponge('off')
  else dipSponge()
}
