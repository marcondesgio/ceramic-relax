import { PerspectiveCamera, Vector3 } from 'three'
import { sceneRuntime } from '../scene/sceneRuntime'
import { useGameStore } from '../store/useGameStore'
import { SHELF_TOP, pieceSize, shelfScale } from './kilnLayout'
import { renderToCanvas } from './renderToCanvas'

// PNG 1080 × 1350 (bom para redes sociais): foto da peça na prateleira,
// moldura creme arredondada e o logo pequeno no canto.

const W = 1080
const H = 1350
const BORDER = 44
const RADIUS = 56
const VASE_PATH = 'M23 6h18v6c11 5 16 15 16 27 0 16-11 27-25 27S7 55 7 39c0-12 5-22 16-27Z'

/** Câmera da foto: enquadra a peça e um pedaço da prateleira, no formato 4:5 */
function photoCamera(aspect: number) {
  const p = useGameStore.getState().profile
  const shown = pieceSize(p) * shelfScale(p)
  const height = p.height * shelfScale(p)
  const target = new Vector3(SHELF_TOP.x, SHELF_TOP.y + height * 0.42, SHELF_TOP.z)
  const cam = new PerspectiveCamera(30, aspect, 0.1, 60)
  const frame = Math.max(shown * 1.9, 1.6) // altura visível
  const dist = frame / 2 / Math.tan((15 * Math.PI) / 180)
  cam.position.copy(target).add(new Vector3(0, 0.3, 1).normalize().multiplyScalar(dist))
  cam.lookAt(target)
  cam.updateMatrixWorld()
  return cam
}

function drawLogo(ctx: CanvasRenderingContext2D, right: number, bottom: number) {
  const text = 'Ceramic Relax'
  ctx.font = '800 34px "Baloo 2", "Nunito", sans-serif'
  const tw = ctx.measureText(text).width
  const pillH = 64
  const pillW = tw + 104
  const x = right - pillW
  const y = bottom - pillH
  ctx.save()
  ctx.shadowColor = 'rgba(107, 79, 63, 0.18)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 4
  ctx.fillStyle = 'rgba(255, 251, 245, 0.92)'
  ctx.beginPath()
  ctx.roundRect(x, y, pillW, pillH, pillH / 2)
  ctx.fill()
  ctx.restore()
  // vasinho
  ctx.save()
  ctx.translate(x + 22, y + 12)
  ctx.scale(0.62, 0.62)
  ctx.fillStyle = '#E3A587'
  ctx.fill(new Path2D(VASE_PATH))
  ctx.restore()
  ctx.fillStyle = '#6B4F3F'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + 76, y + pillH / 2 + 2)
}

/** Gera o PNG final */
export async function captureResultImage(): Promise<Blob> {
  const { gl, scene } = sceneRuntime
  if (!gl || !scene) throw new Error('cena indisponível')
  // a fonte do logo precisa estar carregada antes de desenhar no canvas
  await document.fonts.load('800 34px "Baloo 2"').catch(() => undefined)

  const pw = W - BORDER * 2
  const ph = H - BORDER * 2
  const photo = renderToCanvas(gl, scene, photoCamera(pw / ph), pw, ph)

  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')!
  ctx.fillStyle = '#FFF4E6'
  ctx.fillRect(0, 0, W, H)

  // sombra suave da "foto" sobre a moldura
  ctx.save()
  ctx.shadowColor = 'rgba(107, 79, 63, 0.16)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 8
  ctx.fillStyle = '#FFFBF5'
  ctx.beginPath()
  ctx.roundRect(BORDER, BORDER, pw, ph, RADIUS)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(BORDER, BORDER, pw, ph, RADIUS)
  ctx.clip()
  ctx.drawImage(photo, BORDER, BORDER)
  ctx.restore()

  // filete creme por dentro da moldura
  ctx.strokeStyle = 'rgba(255, 251, 245, 0.85)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(BORDER + 3, BORDER + 3, pw - 6, ph - 6, RADIUS - 3)
  ctx.stroke()

  drawLogo(ctx, W - BORDER - 28, H - BORDER - 28)

  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('falha ao gerar PNG'))), 'image/png'),
  )
}

/**
 * No celular usa o compartilhamento nativo (Web Share API) quando o aparelho aceita arquivos;
 * senão baixa o PNG.
 */
export async function shareOrDownload(blob: Blob, preferShare: boolean) {
  const file = new File([blob], 'ceramic-relax.png', { type: 'image/png' })
  if (preferShare && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Ceramic Relax' })
      return 'shared' as const
    } catch (e) {
      // o jogador fechou a folha de compartilhar: não é erro
      if ((e as DOMException).name === 'AbortError') return 'cancelled' as const
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded' as const
}
