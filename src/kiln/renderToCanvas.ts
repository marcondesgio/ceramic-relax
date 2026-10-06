import { Color, SRGBColorSpace, WebGLRenderTarget, type Camera, type Object3D, type WebGLRenderer } from 'three'

/**
 * Renderiza uma cena num render target (com antisserrilhado) e devolve um canvas 2D.
 * Usado nas prévias do forno e no "Salvar imagem".
 */
export function renderToCanvas(
  gl: WebGLRenderer,
  scene: Object3D,
  camera: Camera,
  width: number,
  height: number,
  transparent = false,
) {
  const rt = new WebGLRenderTarget(width, height, { samples: 4 })
  rt.texture.colorSpace = SRGBColorSpace

  // guarda o estado do renderer para não atrapalhar a cena principal
  const prevTarget = gl.getRenderTarget()
  const prevColor = gl.getClearColor(new Color())
  const prevAlpha = gl.getClearAlpha()
  gl.setRenderTarget(rt)
  if (transparent) gl.setClearColor(0x000000, 0)
  gl.clear()
  gl.render(scene, camera)

  const px = new Uint8Array(width * height * 4)
  gl.readRenderTargetPixels(rt, 0, 0, width, height, px)
  gl.setRenderTarget(prevTarget)
  gl.setClearColor(prevColor, prevAlpha)
  rt.dispose()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(width, height)
  const row = width * 4
  for (let y = 0; y < height; y++) {
    // o WebGL lê de baixo para cima
    const src = px.subarray((height - 1 - y) * row, (height - y) * row)
    img.data.set(src, y * row)
  }
  if (transparent) {
    // bordas suavizadas vêm pré-multiplicadas; o canvas 2D espera cor "pura"
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]
      if (a > 0 && a < 255) {
        const k = 255 / a
        d[i] = Math.min(255, d[i] * k)
        d[i + 1] = Math.min(255, d[i + 1] * k)
        d[i + 2] = Math.min(255, d[i + 2] * k)
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}
