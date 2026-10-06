import { touchRect } from './paintHistory'
import { PAINT_SIZE as S, getSurface, markDirty, uvToPx, type Side } from './paintSurface'
import { stampDetail, stampPath, type StampId } from './stamps'

// Desenho no canvas da peça. Como U = ângulo e V = comprimento do perfil,
// um círculo na peça vira uma elipse no canvas: esticada em U onde o raio é pequeno.

/** Ponto tocado na superfície: UV + raio da peça naquele ponto (unidades de mundo) */
export interface SurfacePoint {
  u: number
  v: number
  r: number
}

const MIN_R = 0.06

/** Pixels de canvas por unidade de mundo, em cada direção */
function pxPerWorld(r: number, length: number) {
  return { sx: S / (2 * Math.PI * Math.max(r, MIN_R)), sy: S / length }
}

/** Repete o desenho do outro lado da costura (U = 0 = 1) quando ele passa da borda */
function wrapped(x: number, halfW: number, draw: (cx: number) => void) {
  for (const off of [0, -S, S]) {
    const cx = x + off
    if (cx + halfW < 0 || cx - halfW > S) continue
    draw(cx)
  }
}

function withPaint(side: Side, color: string | null, draw: (ctx: CanvasRenderingContext2D) => void) {
  const { ctx } = getSurface(side)
  ctx.save()
  if (color) {
    ctx.fillStyle = color
  } else {
    // borracha: tira o esmalte e volta ao biscoito
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = '#000'
  }
  draw(ctx)
  ctx.restore()
  markDirty(side)
}

/**
 * Pincel/borracha: liga dois pontos com "carimbadas" elípticas.
 * Com o torno girando, o mesmo ponto da tela passa por U diferentes a cada quadro,
 * e o traço vira um anel naturalmente. `spinDu` informa quanto a peça girou
 * (em voltas, com sinal); sem ele, usa o caminho mais curto entre os dois U.
 */
export function paintSegment(
  side: Side,
  length: number,
  a: SurfacePoint,
  b: SurfacePoint,
  radius: number,
  color: string | null,
  spinDu?: number,
) {
  let du = b.u - a.u
  if (du > 0.5) du -= 1
  if (du < -0.5) du += 1
  // uma volta inteira ou mais: o anel fecha
  if (spinDu !== undefined) du = Math.max(-1, Math.min(1, spinDu))
  const dv = b.v - a.v

  withPaint(side, color, (ctx) => {
    const ry = radius * pxPerWorld(1, length).sy
    const distPx = Math.hypot(du * S, dv * S)
    let step = 0
    // percorre o segmento com espaçamento proporcional ao tamanho do pincel
    do {
      const t = distPx > 0 ? Math.min(1, step / distPx) : 1
      const u = (((a.u + du * t) % 1) + 1) % 1
      const r = a.r + (b.r - a.r) * t
      const rx = Math.min(S / 2, radius * pxPerWorld(r, length).sx)
      const [x, y] = uvToPx(u, a.v + dv * t)
      wrapped(x, rx, (cx) => {
        ctx.beginPath()
        ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        touchRect(cx - rx, y - ry, rx * 2, ry * 2)
      })
      step += Math.max(1, Math.min(rx, ry) * 0.35)
    } while (step <= distPx)
  })
}

/** Faixa reta: preenche todas as linhas entre duas alturas (o torno faz a volta inteira) */
export function paintBand(side: Side, length: number, v0: number, v1: number, half: number, color: string) {
  withPaint(side, color, (ctx) => {
    const h = half * pxPerWorld(1, length).sy
    const yTop = uvToPx(0, Math.max(v0, v1))[1] - h
    const yBot = uvToPx(0, Math.min(v0, v1))[1] + h
    ctx.fillRect(0, yTop, S, yBot - yTop)
    touchRect(0, yTop, S, yBot - yTop)
  })
}

/** Balde: pinta o lado inteiro, de cima para baixo até `fraction` (0 a 1) da altura */
export function fillBucket(side: Side, color: string, from: number, to: number) {
  withPaint(side, color, (ctx) => {
    const y0 = from * S
    const y1 = to * S
    // borda de baixo levemente ondulada: parece cor escorrendo
    ctx.beginPath()
    ctx.moveTo(0, y0)
    ctx.lineTo(S, y0)
    for (let x = S; x >= 0; x -= 32) ctx.lineTo(x, y1 + Math.sin(x * 0.05) * (to < 1 ? 10 : 0))
    ctx.closePath()
    ctx.fill()
    touchRect(0, y0, S, y1 - y0 + 12)
  })
}

/** Quantas vezes o carimbo se repete ao redor da peça, conforme a circunferência */
export function stampRepeatCount(r: number, radius: number) {
  return Math.min(14, Math.max(3, Math.round((2 * Math.PI * r) / (radius * 3.4))))
}

/** Carimbo: desenha a forma vetorial; `count` > 1 repete em intervalos iguais de ângulo */
export function paintStamp(
  side: Side,
  length: number,
  p: SurfacePoint,
  id: StampId,
  radius: number,
  color: string,
  count = 1,
) {
  const path = stampPath(id)
  withPaint(side, color, (ctx) => {
    const { sx, sy } = pxPerWorld(p.r, length)
    const rx = Math.min(S / 2, radius * sx)
    const ry = radius * sy
    for (let k = 0; k < count; k++) {
      const [x, y] = uvToPx((p.u + k / count) % 1, p.v)
      wrapped(x, rx, (cx) => {
        ctx.save()
        ctx.translate(cx, y)
        ctx.scale(rx, ry)
        ctx.fillStyle = color
        ctx.fill(path)
        stampDetail(ctx, id)
        ctx.restore()
        touchRect(cx - rx, y - ry, rx * 2, ry * 2)
      })
    }
  })
}
