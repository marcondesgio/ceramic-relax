// Carimbos desenhados em vetor (Path2D), num quadrado de -1 a 1 com y para baixo.

export const STAMPS = ['star', 'heart', 'flower', 'drop', 'leaf', 'dot'] as const
export type StampId = (typeof STAMPS)[number]

function star() {
  const p = new Path2D()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.46
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r + 0.06
    if (i === 0) p.moveTo(x, y)
    else p.lineTo(x, y)
  }
  p.closePath()
  return p
}

function heart() {
  const p = new Path2D()
  p.moveTo(0, 0.9)
  p.bezierCurveTo(-0.35, 0.62, -1, 0.2, -1, -0.28)
  p.bezierCurveTo(-1, -0.72, -0.42, -0.98, 0, -0.52)
  p.bezierCurveTo(0.42, -0.98, 1, -0.72, 1, -0.28)
  p.bezierCurveTo(1, 0.2, 0.35, 0.62, 0, 0.9)
  p.closePath()
  return p
}

function flower() {
  const p = new Path2D()
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    const cx = Math.cos(a) * 0.52
    const cy = Math.sin(a) * 0.52
    p.moveTo(cx + 0.46, cy)
    p.arc(cx, cy, 0.46, 0, Math.PI * 2)
  }
  return p
}

function drop() {
  const p = new Path2D()
  p.moveTo(0, -1)
  p.bezierCurveTo(0.25, -0.55, 0.72, -0.1, 0.72, 0.3)
  p.arc(0, 0.3, 0.72, 0, Math.PI)
  p.bezierCurveTo(-0.72, -0.1, -0.25, -0.55, 0, -1)
  p.closePath()
  return p
}

function leaf() {
  const p = new Path2D()
  p.moveTo(0, -1)
  p.bezierCurveTo(0.75, -0.55, 0.75, 0.45, 0, 1)
  p.bezierCurveTo(-0.75, 0.45, -0.75, -0.55, 0, -1)
  p.closePath()
  return p
}

function dot() {
  const p = new Path2D()
  p.arc(0, 0, 0.82, 0, Math.PI * 2)
  return p
}

const builders: Record<StampId, () => Path2D> = { star, heart, flower, drop, leaf, dot }
const cache = new Map<StampId, Path2D>()

export function stampPath(id: StampId) {
  let p = cache.get(id)
  if (!p) {
    p = builders[id]()
    cache.set(id, p)
  }
  return p
}

/** Detalhes que ficam por cima, mais claros (miolo da flor, nervura da folha) */
export function stampDetail(ctx: CanvasRenderingContext2D, id: StampId) {
  if (id === 'flower') {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.arc(0, 0, 0.32, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'leaf') {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 0.12
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, -0.7)
    ctx.quadraticCurveTo(0.08, 0, 0, 0.75)
    ctx.stroke()
  }
}
