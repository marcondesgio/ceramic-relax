// Carimbos desenhados em vetor (Path2D), num quadrado de -1 a 1 com y para baixo.

export const STAMPS = [
  'star',
  'heart',
  'flower',
  'drop',
  'leaf',
  'dot',
  // carimbos da lojinha
  'monstera',
  'paw',
  'moon',
  'fish',
  'cloud',
  'mushroom',
  'cactus',
  'butterfly',
  'sun',
  'cherry',
] as const
export type StampId = (typeof STAMPS)[number]

/** Os 6 primeiros são gratuitos; os outros vêm da lojinha */
export const BASE_STAMPS = 6

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

// ---------- carimbos da lojinha ----------

/** Folha de costela-de-adão (os recortes vêm no detalhe) */
function monstera() {
  const p = new Path2D()
  p.moveTo(0, 0.95)
  p.bezierCurveTo(-0.9, 0.7, -1.05, -0.35, -0.45, -0.85)
  p.bezierCurveTo(-0.2, -1.02, 0.2, -1.02, 0.45, -0.85)
  p.bezierCurveTo(1.05, -0.35, 0.9, 0.7, 0, 0.95)
  p.closePath()
  return p
}

/** Pegadinha: almofada e quatro dedinhos */
function paw() {
  const p = new Path2D()
  p.ellipse(0, 0.32, 0.5, 0.42, 0, 0, Math.PI * 2)
  for (const [x, y] of [
    [-0.64, -0.22],
    [-0.24, -0.62],
    [0.24, -0.62],
    [0.64, -0.22],
  ]) {
    p.moveTo(x + 0.22, y)
    p.arc(x, y, 0.22, 0, Math.PI * 2)
  }
  return p
}

function moon() {
  const p = new Path2D()
  p.moveTo(0.25, -0.92)
  p.bezierCurveTo(-0.8, -0.8, -0.8, 0.8, 0.25, 0.92)
  p.bezierCurveTo(-0.3, 0.55, -0.3, -0.55, 0.25, -0.92)
  p.closePath()
  return p
}

function fish() {
  const p = new Path2D()
  p.ellipse(-0.18, 0, 0.62, 0.42, 0, 0, Math.PI * 2)
  p.moveTo(0.36, 0)
  p.lineTo(0.95, -0.45)
  p.quadraticCurveTo(0.8, 0, 0.95, 0.45)
  p.closePath()
  return p
}

function cloud() {
  const p = new Path2D()
  for (const [x, y, r] of [
    [-0.48, 0.12, 0.38],
    [0, -0.18, 0.52],
    [0.48, 0.12, 0.38],
  ]) {
    p.moveTo(x + r, y)
    p.arc(x, y, r, 0, Math.PI * 2)
  }
  p.roundRect(-0.86, 0.05, 1.72, 0.45, 0.22)
  return p
}

function mushroom() {
  const p = new Path2D()
  p.ellipse(0, 0.05, 0.95, 0.75, 0, Math.PI, Math.PI * 2)
  p.closePath()
  p.roundRect(-0.27, -0.02, 0.54, 0.9, 0.16)
  return p
}

function cactus() {
  const p = new Path2D()
  p.roundRect(-0.22, -0.92, 0.44, 1.84, 0.22)
  p.roundRect(-0.72, -0.45, 0.24, 0.62, 0.12)
  p.roundRect(-0.72, 0.0, 0.6, 0.22, 0.11)
  p.roundRect(0.48, -0.7, 0.24, 0.62, 0.12)
  p.roundRect(0.12, -0.25, 0.6, 0.22, 0.11)
  return p
}

function butterfly() {
  const p = new Path2D()
  for (const [x, y, rx, ry, a] of [
    [-0.45, -0.3, 0.45, 0.34, -0.5],
    [0.45, -0.3, 0.45, 0.34, 0.5],
    [-0.36, 0.38, 0.3, 0.24, 0.5],
    [0.36, 0.38, 0.3, 0.24, -0.5],
  ]) {
    p.moveTo(x + rx, y)
    p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2)
  }
  p.roundRect(-0.08, -0.6, 0.16, 1.25, 0.08)
  return p
}

function sun() {
  const p = new Path2D()
  p.arc(0, 0, 0.48, 0, Math.PI * 2)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const x = Math.cos(a) * 0.8
    const y = Math.sin(a) * 0.8
    p.moveTo(x + 0.15, y)
    p.arc(x, y, 0.15, 0, Math.PI * 2)
  }
  return p
}

function cherry() {
  const p = new Path2D()
  p.arc(-0.38, 0.45, 0.34, 0, Math.PI * 2)
  p.moveTo(0.72, 0.5)
  p.arc(0.38, 0.5, 0.34, 0, Math.PI * 2)
  // folhinha no alto
  p.moveTo(0.1, -0.85)
  p.quadraticCurveTo(0.7, -0.95, 0.75, -0.55)
  p.quadraticCurveTo(0.3, -0.45, 0.1, -0.85)
  return p
}

const builders: Record<StampId, () => Path2D> = {
  star,
  heart,
  flower,
  drop,
  leaf,
  dot,
  monstera,
  paw,
  moon,
  fish,
  cloud,
  mushroom,
  cactus,
  butterfly,
  sun,
  cherry,
}
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
  } else if (id === 'monstera') {
    // nervura e os recortes típicos da costela-de-adão
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineCap = 'round'
    ctx.lineWidth = 0.1
    ctx.beginPath()
    ctx.moveTo(0, 0.85)
    ctx.lineTo(0, -0.8)
    for (const s of [-1, 1]) {
      for (const y of [-0.45, 0, 0.42]) {
        ctx.moveTo(s * 0.92, y - 0.12)
        ctx.lineTo(s * 0.4, y + 0.05)
      }
    }
    ctx.stroke()
  } else if (id === 'fish') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.beginPath()
    ctx.arc(-0.48, -0.08, 0.1, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'mushroom') {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    for (const [x, y, r] of [
      [-0.45, -0.25, 0.14],
      [0.1, -0.5, 0.16],
      [0.5, -0.2, 0.12],
    ]) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (id === 'cherry') {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 0.09
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-0.32, 0.15)
    ctx.quadraticCurveTo(-0.15, -0.5, 0.12, -0.82)
    ctx.moveTo(0.36, 0.2)
    ctx.quadraticCurveTo(0.3, -0.4, 0.12, -0.82)
    ctx.stroke()
  }
}
