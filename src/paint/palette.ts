// Paleta fixa de 12 cores pastel (docs/Ceramic Relax — Interface.pdf, seção 02)

export const PALETTE = [
  { id: 'cream', hex: '#FBF3E4' },
  { id: 'pink', hex: '#F6C1CC' },
  { id: 'coral', hex: '#F4A08E' },
  { id: 'peach', hex: '#FFCFA8' },
  { id: 'butter', hex: '#FBE3A0' },
  { id: 'mint', hex: '#BFE6D3' },
  { id: 'sage', hex: '#AFC8A6' },
  { id: 'sky', hex: '#B9DDF2' },
  { id: 'lavender', hex: '#B8C3EE' },
  { id: 'lilac', hex: '#D7BCE8' },
  { id: 'caramel', hex: '#C99A6E' },
  { id: 'graphite', hex: '#6E6A72' },
] as const

export type BrushSize = 'S' | 'M' | 'L'

/** Raio do pincel/borracha em unidades de mundo */
export const BRUSH_RADIUS: Record<BrushSize, number> = { S: 0.035, M: 0.07, L: 0.13 }
/** Meia espessura das faixas */
export const BAND_HALF: Record<BrushSize, number> = { S: 0.035, M: 0.065, L: 0.11 }
/** Raio dos carimbos */
export const STAMP_RADIUS: Record<BrushSize, number> = { S: 0.055, M: 0.09, L: 0.14 }
