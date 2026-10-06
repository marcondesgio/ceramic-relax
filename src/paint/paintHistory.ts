import { PAINT_SIZE, getSurface, markDirty, type Side } from './paintSurface'

// Desfazer da pintura (até 20 passos). Para economizar memória no celular,
// cada passo guarda só o retângulo que o traço mudou, e não o canvas inteiro.

const LIMIT = 20

interface Entry {
  side: Side
  x: number
  y: number
  data: ImageData
}

const stack: Entry[] = []
const listeners = new Set<() => void>()

// cópia do canvas antes do traço atual
const before = document.createElement('canvas')
before.width = PAINT_SIZE
before.height = PAINT_SIZE
const beforeCtx = before.getContext('2d', { willReadFrequently: true })!

let active: { side: Side; x0: number; y0: number; x1: number; y1: number } | null = null

const notify = () => listeners.forEach((fn) => fn())

/** Começa um passo de desfazer: fotografa o canvas do lado que vai ser pintado */
export function beginStroke(side: Side) {
  if (active) endStroke()
  beforeCtx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE)
  beforeCtx.drawImage(getSurface(side).canvas, 0, 0)
  active = { side, x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
}

/** Registra a área alterada pelo traço */
export function touchRect(x: number, y: number, w: number, h: number) {
  if (!active) return
  active.x0 = Math.min(active.x0, x)
  active.y0 = Math.min(active.y0, y)
  active.x1 = Math.max(active.x1, x + w)
  active.y1 = Math.max(active.y1, y + h)
}

export function isStrokeActive() {
  return active !== null
}

/** Fecha o passo: guarda só o pedaço que mudou */
export function endStroke() {
  if (!active) return
  const x = Math.max(0, Math.floor(active.x0))
  const y = Math.max(0, Math.floor(active.y0))
  const x1 = Math.min(PAINT_SIZE, Math.ceil(active.x1))
  const y1 = Math.min(PAINT_SIZE, Math.ceil(active.y1))
  if (x1 > x && y1 > y) {
    stack.push({ side: active.side, x, y, data: beforeCtx.getImageData(x, y, x1 - x, y1 - y) })
    if (stack.length > LIMIT) stack.shift()
    notify()
  }
  active = null
}

export function undoPaint() {
  if (active) endStroke()
  const entry = stack.pop()
  if (!entry) return
  getSurface(entry.side).ctx.putImageData(entry.data, entry.x, entry.y)
  markDirty(entry.side)
  notify()
}

export function clearPaintHistory() {
  stack.length = 0
  active = null
  notify()
}

// para o React (useSyncExternalStore)
export function subscribePaintHistory(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
export function paintHistorySize() {
  return stack.length
}
