import type { Finish } from '../store/useGameStore'
import type { StampId } from '../paint/stamps'

// Vila dos bichinhos: o elenco de lançamento e o que cada um costuma pedir.
// Os textos ficam em i18n (village.animals.<id>); aqui só o que o jogo precisa ler.

export type AnimalId = 'capi' | 'soneca' | 'tuco' | 'mica' | 'tata' | 'rosinha' | 'guara'

export const ANIMALS: AnimalId[] = ['capi', 'soneca', 'tuco', 'mica', 'tata', 'rosinha', 'guara']

/** Primeira sessão: ordem fixa para apresentar os personagens */
export const FIRST_VISITS: AnimalId[] = ['capi', 'tata', 'tuco']

/** Tipos de peça que o jogo sabe ler (ver traits.ts) */
export type PieceType = 'plate' | 'bowl' | 'mug' | 'pot' | 'vase' | 'tallVase'

/** Estampa pedida: faixas, um carimbo, ou nenhuma */
export type PatternWant = 'bands' | 'none' | StampId

/** Traços pedidos. Tipos e cores são listas: qualquer um deles conta (cores = índices da paleta) */
export interface OrderWants {
  types?: PieceType[]
  colors?: number[]
  pattern?: PatternWant
  finish?: Finish
  /** desafios da lojinha: uma alça, um formato de furo ou o ripado vertical */
  handle?: 'ring' | 'ear' | 'double' | 'tall'
  holes?: 'round' | 'star' | 'heart' | 'drop'
  fluting?: boolean
}

export type OrderKind = 'open' | 'special'

/** Recompensa pelo trabalho, nunca pelo acerto */
export const REWARD: Record<OrderKind, number> = { open: 10, special: 25 }

export interface OrderTemplate {
  /** chave do texto: village.animals.<id>.orders.<key> */
  key: string
  kind: OrderKind
  wants: OrderWants
}

// paleta (paint/palette.ts): 0 creme · 1 rosa · 2 coral · 3 pêssego · 4 manteiga · 5 menta
// 6 sálvia · 7 céu · 8 lavanda · 9 lilás · 10 caramelo · 11 grafite

/** Abertos pedem um traço só; especiais pedem de 2 a 3 */
export const CATALOG: Record<AnimalId, OrderTemplate[]> = {
  capi: [
    { key: 'open1', kind: 'open', wants: { types: ['mug'] } },
    { key: 'open2', kind: 'open', wants: { colors: [10] } },
    { key: 'special1', kind: 'special', wants: { types: ['mug'], colors: [6], pattern: 'leaf' } },
  ],
  soneca: [
    { key: 'open1', kind: 'open', wants: { types: ['vase', 'pot'] } },
    { key: 'open2', kind: 'open', wants: { colors: [8, 7] } },
    { key: 'special1', kind: 'special', wants: { types: ['pot', 'vase'], colors: [8], pattern: 'star' } },
  ],
  tuco: [
    { key: 'open1', kind: 'open', wants: { pattern: 'bands' } },
    { key: 'open2', kind: 'open', wants: { colors: [4] } },
    { key: 'special1', kind: 'special', wants: { types: ['tallVase'], colors: [4, 2, 11], pattern: 'bands' } },
  ],
  mica: [
    { key: 'open1', kind: 'open', wants: { types: ['pot'] } },
    { key: 'open2', kind: 'open', wants: { colors: [2, 3] } },
    { key: 'special1', kind: 'special', wants: { types: ['pot'], colors: [2, 3], pattern: 'dot' } },
  ],
  tata: [
    { key: 'open1', kind: 'open', wants: { types: ['bowl'] } },
    { key: 'open2', kind: 'open', wants: { colors: [3] } },
    { key: 'special1', kind: 'special', wants: { types: ['bowl'], colors: [3], pattern: 'heart' } },
  ],
  rosinha: [
    { key: 'open1', kind: 'open', wants: { colors: [7] } },
    { key: 'open2', kind: 'open', wants: { colors: [1] } },
    { key: 'special1', kind: 'special', wants: { types: ['tallVase'], colors: [7], pattern: 'drop' } },
  ],
  guara: [
    { key: 'open1', kind: 'open', wants: { types: ['tallVase', 'vase'] } },
    { key: 'open2', kind: 'open', wants: { colors: [11] } },
    { key: 'special1', kind: 'special', wants: { types: ['tallVase'], colors: [11], finish: 'matte' } },
  ],
}

/** Pedido em andamento (salvo no aparelho até a entrega) */
export interface Order {
  id: string
  animal: AnimalId
  key: string
  kind: OrderKind
  wants: OrderWants
  reward: number
  /** desafio liberado por um item da lojinha (id do item) */
  challenge?: string
}

/** Visual provisório de cada bichinho (formas simples até chegarem os modelos finais) */
export interface AnimalLook {
  body: string
  belly: string
  accent: string
  /** altura aproximada (unidades de mundo) */
  height: number
  ears: 'round' | 'pointy' | 'tall' | 'none'
  snout: 'blunt' | 'beak' | 'long' | 'small'
  extra: 'none' | 'mask' | 'mane' | 'shell' | 'fin' | 'tail'
  legs: 'short' | 'long'
}

export const LOOKS: Record<AnimalId, AnimalLook> = {
  capi: { body: '#B98A62', belly: '#D9B58E', accent: '#8C6447', height: 1.05, ears: 'round', snout: 'blunt', extra: 'none', legs: 'short' },
  soneca: { body: '#BFAE98', belly: '#E3D6C3', accent: '#7A6A5C', height: 1.1, ears: 'none', snout: 'small', extra: 'mask', legs: 'short' },
  tuco: { body: '#4A4550', belly: '#FBF3E4', accent: '#F6B04A', height: 1.0, ears: 'none', snout: 'beak', extra: 'none', legs: 'short' },
  mica: { body: '#F2A541', belly: '#F9CF8A', accent: '#D9822B', height: 0.95, ears: 'none', snout: 'small', extra: 'mane', legs: 'short' },
  tata: { body: '#B8AFC4', belly: '#E2DCEA', accent: '#968CA6', height: 0.85, ears: 'pointy', snout: 'small', extra: 'shell', legs: 'short' },
  rosinha: { body: '#F4AFC2', belly: '#FBD9E2', accent: '#E58FA8', height: 1.05, ears: 'none', snout: 'long', extra: 'fin', legs: 'short' },
  guara: { body: '#E07A47', belly: '#F6C7A4', accent: '#4A3A35', height: 1.15, ears: 'tall', snout: 'long', extra: 'tail', legs: 'long' },
}

// paleta extra (lojinha): 12 dourado · 13 verde-água · 14 vinho · 15 azul-noite · 16 mostarda · 17 rosa antigo

/**
 * Desafios: pedidos especiais que só aparecem depois de comprar o item correspondente.
 * Texto em village.challenges.<id do item>. Valem 25 moedinhas, como todo especial.
 */
export const CHALLENGES: Record<string, { animal: AnimalId; wants: OrderWants }> = {
  'color-gold': { animal: 'mica', wants: { types: ['pot'], colors: [12] } },
  'color-aqua': { animal: 'rosinha', wants: { colors: [13] } },
  'color-wine': { animal: 'guara', wants: { types: ['tallVase', 'vase'], colors: [14] } },
  'color-navy': { animal: 'soneca', wants: { types: ['vase', 'pot'], colors: [15] } },
  'color-mustard': { animal: 'tuco', wants: { colors: [16], pattern: 'bands' } },
  'color-blush': { animal: 'tata', wants: { types: ['bowl'], colors: [17] } },
  'stamp-monstera': { animal: 'soneca', wants: { types: ['vase', 'pot'], pattern: 'monstera' } },
  'stamp-paw': { animal: 'tata', wants: { types: ['bowl'], pattern: 'paw' } },
  'stamp-moon': { animal: 'guara', wants: { colors: [11, 15], pattern: 'moon' } },
  'stamp-fish': { animal: 'rosinha', wants: { colors: [7, 13], pattern: 'fish' } },
  'stamp-cloud': { animal: 'soneca', wants: { colors: [7, 8], pattern: 'cloud' } },
  'stamp-mushroom': { animal: 'capi', wants: { types: ['mug'], pattern: 'mushroom' } },
  'stamp-cactus': { animal: 'guara', wants: { types: ['pot', 'vase'], pattern: 'cactus' } },
  'stamp-butterfly': { animal: 'mica', wants: { types: ['pot'], pattern: 'butterfly' } },
  'stamp-sun': { animal: 'tuco', wants: { colors: [4, 16], pattern: 'sun' } },
  'stamp-cherry': { animal: 'capi', wants: { types: ['bowl'], pattern: 'cherry' } },
  'tool-flute': { animal: 'guara', wants: { types: ['tallVase'], fluting: true } },
  'hole-star': { animal: 'soneca', wants: { holes: 'star' } },
  'hole-heart': { animal: 'tata', wants: { types: ['pot', 'bowl'], holes: 'heart' } },
  'hole-drop': { animal: 'capi', wants: { holes: 'drop' } },
  'handle-ear': { animal: 'capi', wants: { types: ['mug'], handle: 'ear' } },
  'handle-double': { animal: 'rosinha', wants: { types: ['vase', 'tallVase'], handle: 'double' } },
  'handle-tall': { animal: 'tuco', wants: { handle: 'tall', pattern: 'bands' } },
}
