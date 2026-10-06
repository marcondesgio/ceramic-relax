import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Duas superfícies de pintura (exterior e interior), cada uma um canvas 2D 1024×1024
// usado como CanvasTexture. Mapeamento pelo torno: U = ângulo (x), V = altura (y invertido).
// O canvas guarda só o esmalte, com fundo transparente; o biscoito vem do material.

export const PAINT_SIZE = 1024

export type Side = 'outer' | 'inner'

export interface Surface {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: CanvasTexture
  dirty: boolean
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
  return { canvas, ctx, texture, dirty: false }
}

const surfaces: Record<Side, Surface> = { outer: createSurface(), inner: createSurface() }

export function getSurface(side: Side) {
  return surfaces[side]
}

export function markDirty(side: Side) {
  surfaces[side].dirty = true
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
  }
}

/** Coordenadas UV → pixel do canvas (V cresce para cima na peça, y cresce para baixo no canvas) */
export function uvToPx(u: number, v: number): [number, number] {
  return [u * PAINT_SIZE, (1 - v) * PAINT_SIZE]
}
