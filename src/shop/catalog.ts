import type { AnimalId } from '../village/animals'
import { HANDLE_DOUBLE, HANDLE_EAR, HANDLE_TALL, PREPARED_CLAY } from './items'

// Catálogo da lojinha. Todos os itens aparecem desde o começo (os bloqueados em silhueta).
// `challenge`: bichinho cujo pedido especial o item libera (o ícone dele aparece no item).
// `soon`: a mecânica ainda não existe no jogo; o item aparece, mas não dá para comprar.
// Nomes em i18n: shop.items.<id>.

export type ShopCategory =
  | 'colors'
  | 'stamps'
  | 'tools'
  | 'handles'
  | 'prepared'
  | 'shapes'
  | 'clays'
  | 'decor'
  | 'music'
  | 'adornments'

export const CATEGORIES: ShopCategory[] = [
  'colors',
  'stamps',
  'tools',
  'handles',
  'prepared',
  'shapes',
  'clays',
  'decor',
  'music',
  'adornments',
]

export interface ShopItem {
  id: string
  category: ShopCategory
  price: number
  challenge?: AnimalId
  soon?: boolean
  /** o que o item libera: id da cor, do carimbo, da ponta de furo ou da alça */
  ref?: string
}

const item = (id: string, category: ShopCategory, price: number, challenge?: AnimalId, ref?: string): ShopItem => ({
  id,
  category,
  price,
  challenge,
  ref,
})
const soon = (id: string, category: ShopCategory, price: number, challenge?: AnimalId): ShopItem => ({
  id,
  category,
  price,
  challenge,
  soon: true,
})

export const CATALOG_ITEMS: ShopItem[] = [
  // cores extras (30 a 60)
  item('color-gold', 'colors', 60, 'mica', 'gold'),
  item('color-aqua', 'colors', 40, 'rosinha', 'aqua'),
  item('color-wine', 'colors', 50, 'guara', 'wine'),
  item('color-navy', 'colors', 45, 'soneca', 'navy'),
  item('color-mustard', 'colors', 35, 'tuco', 'mustard'),
  item('color-blush', 'colors', 30, 'tata', 'blush'),
  // carimbos (40 a 80)
  item('stamp-monstera', 'stamps', 60, 'soneca', 'monstera'),
  item('stamp-paw', 'stamps', 40, 'tata', 'paw'),
  item('stamp-moon', 'stamps', 55, 'guara', 'moon'),
  item('stamp-fish', 'stamps', 50, 'rosinha', 'fish'),
  item('stamp-cloud', 'stamps', 45, 'soneca', 'cloud'),
  item('stamp-mushroom', 'stamps', 50, 'capi', 'mushroom'),
  item('stamp-cactus', 'stamps', 45, 'guara', 'cactus'),
  item('stamp-butterfly', 'stamps', 70, 'mica', 'butterfly'),
  item('stamp-sun', 'stamps', 65, 'tuco', 'sun'),
  item('stamp-cherry', 'stamps', 40, 'capi', 'cherry'),
  // ferramentas de acabamento (80 a 150; ripador horizontal e furo redondo são gratuitos)
  item('tool-flute', 'tools', 150, 'guara'),
  item('hole-star', 'tools', 100, 'soneca', 'star'),
  item('hole-heart', 'tools', 90, 'tata', 'heart'),
  item('hole-drop', 'tools', 80, 'capi', 'drop'),
  // alças (60 a 120; a argola é gratuita)
  item(HANDLE_EAR, 'handles', 60, 'capi', 'ear'),
  item(HANDLE_DOUBLE, 'handles', 100, 'rosinha', 'double'),
  item(HANDLE_TALL, 'handles', 120, 'tuco', 'tall'),
  // argila preparada: pula o preparo manual
  item(PREPARED_CLAY, 'prepared', 200),
  // formas iniciais (60 a 100)
  soon('shape-teapot', 'shapes', 100, 'capi'),
  soon('shape-pitcher', 'shapes', 80, 'tuco'),
  soon('shape-deep-plate', 'shapes', 60, 'tata'),
  soon('shape-goblet', 'shapes', 90, 'guara'),
  // argilas (120 a 150)
  soon('clay-terracotta', 'clays', 120, 'mica'),
  soon('clay-porcelain', 'clays', 150, 'rosinha'),
  soon('clay-black', 'clays', 140, 'guara'),
  // decoração do ateliê (50 a 150)
  soon('decor-lamp', 'decor', 90, 'soneca'),
  soon('decor-rug', 'decor', 70),
  soon('decor-hammock', 'decor', 150, 'soneca'),
  soon('decor-curtain', 'decor', 60),
  soon('decor-painting', 'decor', 80),
  soon('decor-bookcase', 'decor', 120),
  soon('decor-pouf', 'decor', 70),
  soon('decor-clock', 'decor', 90),
  soon('decor-bunting', 'decor', 50, 'tuco'),
  soon('decor-tea-table', 'decor', 110, 'capi'),
  soon('decor-cushions', 'decor', 50),
  soon('decor-fern', 'decor', 60),
  // músicas (80)
  soon('music-rain', 'music', 80),
  soon('music-sunday', 'music', 80),
  soon('music-breakfast', 'music', 80),
  // adornos (80 a 150)
  soon('adorn-wavy-rim', 'adornments', 80),
  soon('adorn-feet', 'adornments', 90),
  soon('adorn-lid', 'adornments', 120),
  soon('adorn-spout', 'adornments', 150, 'tuco'),
]

export function itemById(id: string) {
  return CATALOG_ITEMS.find((i) => i.id === id)
}

/** Presente de boas-vindas: dá para comprar um item logo na primeira visita à lojinha */
export const WELCOME_COINS = 40

/** Item de carimbo, cor ou ponta de furo que libera um `ref` */
export function itemFor(category: ShopCategory, ref: string) {
  return CATALOG_ITEMS.find((i) => i.category === category && i.ref === ref)
}
