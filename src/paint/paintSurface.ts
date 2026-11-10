import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Três superfícies de pintura (exterior, interior e alças), cada uma um canvas 2D 1024×1024
// usado como CanvasTexture. Na peça, mapeamento pelo torno: U = ângulo (x), V = altura (y invertido).
// Nas alças, cada tubo ocupa uma faixa do canvas: U = volta do tubo, V = comprimento.
// O canvas guarda só o esmalte, com fundo transparente; o biscoito vem do material.

export const PAINT_SIZE = 1024

export type Side = 'outer' | 'inner'
/** Lados da peça (alternância Fora/Dentro) + as alças */
export type SurfaceId = Side | 'handle'

export interface Surface {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: CanvasTexture
  dirty: boolean
  /** sobe a cada mudança no canvas (o salvamento automático só regrava o que mudou) */
  revision: number
  /** já recebeu tinta desde a última limpeza (um canvas vazio nem é salvo) */
  painted: boolean
}

function createSurface(): Surface {
  const canvas = document.createElement('canvas')
  canvas.width = PAINT_SIZE
  canvas.height = PAINT_SIZE
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  // pré-multiplicado: as bordas do traço não escurecem ao filtrar a textura
  texture.premultiplyAlpha = true
  texture.wrapS = RepeatWrapping
  texture.anisotropy = 4
  return { canvas, ctx, texture, dirty: false, revision: 0, painted: false }
}

const surfaces: Record<SurfaceId, Surface> = { outer: createSurface(), inner: createSurface(), handle: createSurface() }

export function getSurface(side: SurfaceId) {
  return surfaces[side]
}

export function markDirty(side: SurfaceId) {
  const s = surfaces[side]
  s.dirty = true
  s.revision++
  s.painted = true
}

/** Envia para a GPU só o que mudou, no máximo uma vez por quadro */
export function flushSurfaces() {
  for (const s of Object.values(surfaces)) {
    if (s.dirty) {
      s.texture.needsUpdate = true
      s.dirty = false
    }
  }
}

/** Apaga toda a pintura (peça nova ou volta para a modelagem) */
export function clearSurfaces() {
  for (const s of Object.values(surfaces)) {
    s.ctx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE)
    s.texture.needsUpdate = true
    s.dirty = false
    s.revision++
    s.painted = false
  }
}

/** Pintura de um lado como PNG (null se o lado nunca foi pintado), para salvar a receita */
export function exportSurface(side: SurfaceId): Promise<Blob | null> {
  const s = surfaces[side]
  if (!s.painted) return Promise.resolve(null)
  return new Promise((resolve) => s.canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

/** Redesenha uma pintura salva (substitui o que estiver no canvas) */
export async function importSurface(side: SurfaceId, png: Blob | null) {
  const s = surfaces[side]
  s.ctx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE)
  if (png) {
    const img = await createImageBitmap(png)
    s.ctx.drawImage(img, 0, 0, PAINT_SIZE, PAINT_SIZE)
    img.close()
  }
  s.texture.needsUpdate = true
  s.dirty = false
  s.revision++
  s.painted = png !== null
}

/** Coordenadas UV → pixel do canvas (V cresce para cima na peça, y cresce para baixo no canvas) */
export function uvToPx(u: number, v: number): [number, number] {
  return [u * PAINT_SIZE, (1 - v) * PAINT_SIZE]
}
