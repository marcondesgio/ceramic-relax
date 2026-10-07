import { CanvasTexture, ClampToEdgeWrapping, NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

// Texturas do ateliê geradas em canvas (sem arquivos): cada uma tem a cor (map)
// e um relevo em tons de cinza (bumpMap), que pega luz e sombra e tira a cara de "plano".

export interface SurfaceTextures {
  map: Texture
  bump: Texture
}

/** Gerador pseudoaleatório com semente: o mesmo desenho em todo aparelho */
function prng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, ctx: c.getContext('2d')! }
}

function toTextures(color: HTMLCanvasElement, bump: HTMLCanvasElement, repeatX = 1, repeatY = 1): SurfaceTextures {
  const map = new CanvasTexture(color)
  map.colorSpace = SRGBColorSpace
  const b = new CanvasTexture(bump)
  b.colorSpace = NoColorSpace
  for (const t of [map, b]) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(repeatX, repeatY)
    t.anisotropy = 8
  }
  return { map, bump: b }
}

const cache = new Map<string, SurfaceTextures>()
function cached(key: string, make: () => SurfaceTextures) {
  let t = cache.get(key)
  if (!t) {
    t = make()
    cache.set(key, t)
  }
  return t
}

// ---------------------------------------------------------------------------
// Piso de tábuas de madeira
// ---------------------------------------------------------------------------

/**
 * Tábuas correndo em profundidade (eixo z), emendas desencontradas, veios ondulados.
 * Um quadro da textura cobre 12 tábuas (6,6 unidades); `floorSize` define quantas vezes ele repete.
 */
export function woodFloorTextures(floorSize: number) {
  const TILE_WORLD = 6.6 // 12 tábuas de 0,55
  return cached(`floor-${floorSize}`, () => {
    const S = 1024
    const { c, ctx } = canvas(S, S)
    const { c: bc, ctx: bctx } = canvas(S, S)
    const rnd = prng(3)
    const PLANKS = 12
    const pw = S / PLANKS
    const tones = ['#D7AE84', '#D2A67B', '#DDB68D', '#CFA278', '#D9B289']

    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, S, S)

    for (let i = 0; i < PLANKS; i++) {
      const x = i * pw
      // cada coluna tem 2 emendas em alturas diferentes (tábuas desencontradas)
      const cut = rnd() * S
      const segs = [
        [cut - S, cut],
        [cut, cut + S * 0.55],
        [cut + S * 0.55, cut + S],
      ]
      for (const [y0, y1] of segs) {
        const base = tones[Math.floor(rnd() * tones.length)]
        for (const off of [0, S, -S]) {
          const a = y0 + off
          const b = y1 + off
          if (b < 0 || a > S) continue
          ctx.fillStyle = base
          ctx.fillRect(x, a, pw, b - a)
          // veios: linhas finas onduladas ao longo da tábua
          for (let g = 0; g < 7; g++) {
            const gx = x + 4 + rnd() * (pw - 8)
            const dark = rnd() < 0.6
            ctx.strokeStyle = dark ? 'rgba(140, 92, 55, 0.16)' : 'rgba(255, 236, 210, 0.22)'
            ctx.lineWidth = 1 + rnd() * 1.5
            ctx.beginPath()
            const amp = 2 + rnd() * 4
            const freq = 0.01 + rnd() * 0.02
            const ph = rnd() * 6
            for (let yy = a; yy <= b; yy += 8) {
              const xx = gx + Math.sin(yy * freq + ph) * amp
              if (yy === a) ctx.moveTo(xx, yy)
              else ctx.lineTo(xx, yy)
            }
            ctx.stroke()
            // o veio também vira um sulco bem leve no relevo
            bctx.strokeStyle = 'rgba(0,0,0,0.12)'
            bctx.lineWidth = 1
            bctx.beginPath()
            for (let yy = a; yy <= b; yy += 8) {
              const xx = gx + Math.sin(yy * freq + ph) * amp
              if (yy === a) bctx.moveTo(xx, yy)
              else bctx.lineTo(xx, yy)
            }
            bctx.stroke()
          }
          // nózinho de vez em quando
          if (rnd() < 0.25) {
            const kx = x + pw * (0.3 + rnd() * 0.4)
            const ky = a + (b - a) * rnd()
            const g = ctx.createRadialGradient(kx, ky, 0, kx, ky, 9)
            g.addColorStop(0, 'rgba(130, 84, 50, 0.35)')
            g.addColorStop(1, 'rgba(130, 84, 50, 0)')
            ctx.fillStyle = g
            ctx.fillRect(kx - 10, ky - 14, 20, 28)
          }
          // emenda da ponta da tábua
          ctx.fillStyle = 'rgba(120, 78, 48, 0.45)'
          ctx.fillRect(x, a - 1.5, pw, 3)
          bctx.fillStyle = '#303030'
          bctx.fillRect(x, a - 2, pw, 4)
        }
      }
      // friso entre tábuas: sombra escura + filete de luz
      ctx.fillStyle = 'rgba(120, 78, 48, 0.5)'
      ctx.fillRect(x, 0, 2.5, S)
      ctx.fillStyle = 'rgba(255, 240, 220, 0.35)'
      ctx.fillRect(x + 2.5, 0, 1.5, S)
      bctx.fillStyle = '#202020'
      bctx.fillRect(x - 1, 0, 4, S)
    }
    const rep = floorSize / TILE_WORLD
    return toTextures(c, bc, rep, rep)
  })
}

// ---------------------------------------------------------------------------
// Papel de parede com coraçõezinhos
// ---------------------------------------------------------------------------

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.85)
  ctx.bezierCurveTo(x - s * 0.35, y + s * 0.6, x - s, y + s * 0.2, x - s, y - s * 0.25)
  ctx.bezierCurveTo(x - s, y - s * 0.7, x - s * 0.4, y - s * 0.95, x, y - s * 0.5)
  ctx.bezierCurveTo(x + s * 0.4, y - s * 0.95, x + s, y - s * 0.7, x + s, y - s * 0.25)
  ctx.bezierCurveTo(x + s, y + s * 0.2, x + s * 0.35, y + s * 0.6, x, y + s * 0.85)
  ctx.closePath()
}

/** Creme com coraçõezinhos em fileiras alternadas (pêssego e lavanda bem suaves) e textura de papel */
export function wallpaperTextures(wallW: number, wallH: number) {
  const TILE_WORLD = 2.1
  return cached(`wall-${wallW}x${wallH}`, () => {
    const S = 512
    const { c, ctx } = canvas(S, S)
    const { c: bc, ctx: bctx } = canvas(S, S)
    const rnd = prng(9)
    ctx.fillStyle = '#FFF7EE'
    ctx.fillRect(0, 0, S, S)
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, S, S)

    // granulado do papel
    for (let i = 0; i < 5000; i++) {
      const x = rnd() * S
      const y = rnd() * S
      const v = rnd()
      ctx.fillStyle = v < 0.5 ? 'rgba(200,160,130,0.05)' : 'rgba(255,255,255,0.08)'
      ctx.fillRect(x, y, 1.5, 1.5)
      bctx.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
      bctx.fillRect(x, y, 1.5, 1.5)
    }

    // listras verticais bem discretas (dão ritmo como no papel da referência)
    for (let x = 0; x < S; x += S / 8) {
      ctx.fillStyle = 'rgba(236, 214, 200, 0.12)'
      ctx.fillRect(x, 0, S / 16, S)
    }

    // coraçõezinhos em grade com deslocamento de meia célula a cada fileira
    const cols = 4
    const rows = 4
    const cw = S / cols
    const ch = S / rows
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const x = k * cw + cw / 2 + (r % 2 ? cw / 2 : 0)
        const y = r * ch + ch / 2
        const color = (r + k) % 2 ? 'rgba(240, 178, 160, 0.55)' : 'rgba(196, 182, 232, 0.6)'
        for (const dx of [0, -S, S]) {
          heartPath(ctx, x + dx, y, 17)
          ctx.fillStyle = color
          ctx.fill()
          // relevo de papel em alto-relevo
          heartPath(bctx, x + dx, y, 17)
          bctx.fillStyle = '#A8A8A8'
          bctx.fill()
        }
      }
    }
    return toTextures(c, bc, wallW / TILE_WORLD, wallH / TILE_WORLD)
  })
}

// ---------------------------------------------------------------------------
// Madeira simples (prateleiras, mesinha): veios sem emendas
// ---------------------------------------------------------------------------

export function woodGrainTextures(base = '#E8C39A') {
  return cached(`grain-${base}`, () => {
    const W = 512
    const H = 128
    const { c, ctx } = canvas(W, H)
    const { c: bc, ctx: bctx } = canvas(W, H)
    const rnd = prng(17)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, W, H)
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, W, H)
    for (let g = 0; g < 28; g++) {
      const y0 = rnd() * H
      const amp = 1 + rnd() * 3
      const freq = 0.01 + rnd() * 0.02
      const ph = rnd() * 6
      const dark = rnd() < 0.65
      ctx.strokeStyle = dark ? 'rgba(150, 100, 60, 0.18)' : 'rgba(255, 240, 215, 0.25)'
      ctx.lineWidth = 0.8 + rnd() * 1.4
      bctx.strokeStyle = dark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)'
      bctx.lineWidth = ctx.lineWidth
      for (const cx of [ctx, bctx]) {
        cx.beginPath()
        for (let x = 0; x <= W; x += 8) {
          const y = y0 + Math.sin(x * freq + ph) * amp
          if (x === 0) cx.moveTo(x, y)
          else cx.lineTo(x, y)
        }
        cx.stroke()
      }
    }
    return toTextures(c, bc, 1, 1)
  })
}

// ---------------------------------------------------------------------------
// Tapete redondo de lã com listras e bolinhas
// ---------------------------------------------------------------------------

/**
 * Feito para a tampa de um cilindro (UV circular): anéis concêntricos em tons de lavanda,
 * um anel de bolinhas creme perto da borda e fibras de lã por toda parte.
 */
export function rugTextures() {
  return cached('rug', () => {
    const S = 1024
    const { c, ctx } = canvas(S, S)
    const { c: bc, ctx: bctx } = canvas(S, S)
    const rnd = prng(23)
    const cx = S / 2
    const R = S / 2

    // anéis de fora para dentro (fração do raio, cor)
    const rings: [number, string][] = [
      [1.0, '#C9BFEA'],
      [0.93, '#D9D2F0'],
      [0.8, '#CDC4EC'],
      [0.74, '#E6E0F6'],
      [0.68, '#D9D2F0'],
      [0.46, '#CFC6ED'],
      [0.41, '#E6E0F6'],
      [0.36, '#D9D2F0'],
    ]
    for (const [f, col] of rings) {
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(cx, cx, R * f, 0, Math.PI * 2)
      ctx.fill()
    }
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, S, S)
    // costura entre os anéis (afunda um pouco)
    for (const [f] of rings) {
      bctx.strokeStyle = '#606060'
      bctx.lineWidth = 3
      bctx.beginPath()
      bctx.arc(cx, cx, R * f, 0, Math.PI * 2)
      bctx.stroke()
    }

    // anel de bolinhas creme (como no design da tela inicial)
    const dotsR = R * 0.865
    const n = 44
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const x = cx + Math.cos(a) * dotsR
      const y = cx + Math.sin(a) * dotsR
      ctx.fillStyle = '#FFF4E6'
      ctx.beginPath()
      ctx.arc(x, y, 9, 0, Math.PI * 2)
      ctx.fill()
      bctx.fillStyle = '#B0B0B0'
      bctx.beginPath()
      bctx.arc(x, y, 9, 0, Math.PI * 2)
      bctx.fill()
    }

    // fibras de lã: risquinhos curtos em direções aleatórias
    for (let i = 0; i < 26000; i++) {
      const x = rnd() * S
      const y = rnd() * S
      const a = rnd() * Math.PI
      const len = 3 + rnd() * 5
      const light = rnd() < 0.5
      ctx.strokeStyle = light ? 'rgba(255,255,255,0.13)' : 'rgba(90,70,140,0.09)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      ctx.stroke()
      bctx.strokeStyle = light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
      bctx.beginPath()
      bctx.moveTo(x, y)
      bctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      bctx.stroke()
    }
    const t = toTextures(c, bc)
    // o tapete é um desenho só (não repete)
    t.map.wrapS = t.map.wrapT = t.bump.wrapS = t.bump.wrapT = ClampToEdgeWrapping
    return t
  })
}

// ---------------------------------------------------------------------------
// Tecido da cortina
// ---------------------------------------------------------------------------

/** Lavanda com trama de tecido e listrinhas verticais finas */
export function curtainTextures() {
  return cached('curtain', () => {
    const W = 256
    const H = 512
    const { c, ctx } = canvas(W, H)
    const { c: bc, ctx: bctx } = canvas(W, H)
    ctx.fillStyle = '#D9D2F0'
    ctx.fillRect(0, 0, W, H)
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, W, H)
    // listrinhas finas mais claras
    for (let x = 6; x < W; x += 32) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.fillRect(x, 0, 4, H)
      ctx.fillStyle = 'rgba(160, 145, 210, 0.25)'
      ctx.fillRect(x + 12, 0, 1.5, H)
    }
    // trama: linhas horizontais e verticais bem finas alternadas
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = y % 6 ? 'rgba(255,255,255,0.06)' : 'rgba(120,100,180,0.06)'
      ctx.fillRect(0, y, W, 1)
      bctx.fillStyle = y % 6 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
      bctx.fillRect(0, y, W, 1)
    }
    for (let x = 0; x < W; x += 3) {
      bctx.fillStyle = x % 6 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      bctx.fillRect(x, 0, 1, H)
    }
    return toTextures(c, bc, 1, 2)
  })
}

// ---------------------------------------------------------------------------
// Ripado do rodapé (veio de madeira pintada, para as ripas)
// ---------------------------------------------------------------------------

/** Madeira pintada de pêssego: cor lisa com veio suave só no relevo */
export function paintedSlatTextures() {
  return cached('slat', () => {
    const W = 64
    const H = 256
    const { c, ctx } = canvas(W, H)
    const { c: bc, ctx: bctx } = canvas(W, H)
    const rnd = prng(41)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, W, H)
    for (let g = 0; g < 10; g++) {
      const x0 = rnd() * W
      bctx.strokeStyle = 'rgba(0,0,0,0.18)'
      bctx.lineWidth = 1
      bctx.beginPath()
      for (let y = 0; y <= H; y += 6) {
        const x = x0 + Math.sin(y * 0.03 + g) * 2
        if (y === 0) bctx.moveTo(x, y)
        else bctx.lineTo(x, y)
      }
      bctx.stroke()
      // tinta um pouco mais clara e mais escura nos veios
      ctx.strokeStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.4)'
      ctx.beginPath()
      for (let y = 0; y <= H; y += 6) {
        const x = x0 + Math.sin(y * 0.03 + g) * 2
        if (y === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    return toTextures(c, bc)
  })
}


// ---------------------------------------------------------------------------
// Folha de espada-de-são-jorge
// ---------------------------------------------------------------------------

/**
 * U atravessa a folha (0 e 1 são as bordas), V vai da base (0) à ponta (1).
 * Faixas onduladas claras e escuras na horizontal e bordas em amarelo manteiga,
 * tudo em verdes pastel da paleta.
 */
export function snakeLeafTextures() {
  return cached('snake-leaf', () => {
    const W = 128
    const H = 512
    const { c, ctx } = canvas(W, H)
    const { c: bc, ctx: bctx } = canvas(W, H)
    const rnd = prng(57)

    // base: sálvia, um pouco mais escura no meio da folha
    const g = ctx.createLinearGradient(0, 0, W, 0)
    g.addColorStop(0, '#A3C29A')
    g.addColorStop(0.5, '#8DB085')
    g.addColorStop(1, '#A3C29A')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, W, H)

    // faixas onduladas atravessando a folha (o desenho típico da espada)
    for (let y = 6; y < H; y += 14 + rnd() * 10) {
      const light = rnd() < 0.55
      const amp = 3 + rnd() * 5
      const freq = 0.06 + rnd() * 0.05
      const ph = rnd() * 6
      const thick = 3 + rnd() * 5
      ctx.fillStyle = light ? 'rgba(214, 232, 204, 0.75)' : 'rgba(110, 145, 104, 0.55)'
      bctx.fillStyle = light ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'
      for (const cx of [ctx, bctx]) {
        cx.beginPath()
        for (let x = 0; x <= W; x += 4) {
          const yy = y + Math.sin(x * freq + ph) * amp
          if (x === 0) cx.moveTo(x, yy)
          else cx.lineTo(x, yy)
        }
        for (let x = W; x >= 0; x -= 4) cx.lineTo(x, y + Math.sin(x * freq + ph) * amp + thick)
        cx.closePath()
        cx.fill()
      }
    }

    // bordas amarelas, com transição suave para o verde
    const edge = W * 0.13
    for (const [x0, dir] of [
      [0, 1],
      [W, -1],
    ] as const) {
      const eg = ctx.createLinearGradient(x0, 0, x0 + dir * edge, 0)
      eg.addColorStop(0, '#FBE3A0')
      eg.addColorStop(0.65, '#FBE3A0')
      eg.addColorStop(1, 'rgba(251, 227, 160, 0)')
      ctx.fillStyle = eg
      ctx.fillRect(dir > 0 ? x0 : x0 - edge, 0, edge, H)
    }
    // nervura central bem leve no relevo
    bctx.fillStyle = 'rgba(255,255,255,0.18)'
    bctx.fillRect(W / 2 - 2, 0, 4, H)

    const t = toTextures(c, bc)
    t.map.wrapS = t.map.wrapT = t.bump.wrapS = t.bump.wrapT = ClampToEdgeWrapping
    return t
  })
}

// ---------------------------------------------------------------------------
// Foto do gato (porta-retrato)
// ---------------------------------------------------------------------------

/** Gatinho laranja dormindo num fundo lavanda, em traço suave (sem contorno preto) */
export function catPhotoTexture() {
  return cached('cat-photo', () => {
    const W = 256
    const H = 320
    const { c, ctx } = canvas(W, H)
    const { c: bc } = canvas(4, 4) // a foto é lisa: relevo neutro

    // fundo: céu lavanda com chão creme e uma almofadinha sálvia
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#E6E0F6')
    sky.addColorStop(1, '#D9D2F0')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#FFF4E6'
    ctx.fillRect(0, H * 0.72, W, H)
    ctx.fillStyle = '#C9DDC4'
    ctx.beginPath()
    ctx.ellipse(W / 2, H * 0.74, 100, 26, 0, 0, Math.PI * 2)
    ctx.fill()
    // janelinha com sol ao fundo
    ctx.fillStyle = '#FFE9AE'
    ctx.beginPath()
    ctx.arc(W * 0.78, H * 0.2, 22, 0, Math.PI * 2)
    ctx.fill()

    const ORANGE = '#F4B183'
    const LIGHT = '#FBD2B0'
    const LINE = '#6B4F3F'

    // corpo "pão de forma" deitado
    ctx.fillStyle = ORANGE
    ctx.beginPath()
    ctx.ellipse(W / 2 + 18, H * 0.64, 78, 46, 0, 0, Math.PI * 2)
    ctx.fill()
    // listrinhas
    ctx.strokeStyle = '#E99A6B'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    for (const x of [130, 152, 174]) {
      ctx.beginPath()
      ctx.moveTo(x, H * 0.52)
      ctx.quadraticCurveTo(x + 6, H * 0.58, x, H * 0.62)
      ctx.stroke()
    }
    // rabo enrolado na frente
    ctx.strokeStyle = ORANGE
    ctx.lineWidth = 16
    ctx.beginPath()
    ctx.moveTo(W / 2 + 90, H * 0.66)
    ctx.quadraticCurveTo(W / 2 + 70, H * 0.78, W / 2 - 20, H * 0.76)
    ctx.stroke()

    // cabeça
    const hx = W / 2 - 40
    const hy = H * 0.55
    ctx.fillStyle = ORANGE
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(hx + s * 20, hy - 30)
      ctx.lineTo(hx + s * 42, hy - 62)
      ctx.lineTo(hx + s * 48, hy - 18)
      ctx.closePath()
      ctx.fill()
    }
    ctx.beginPath()
    ctx.ellipse(hx, hy, 50, 42, 0, 0, Math.PI * 2)
    ctx.fill()
    // orelhas por dentro
    ctx.fillStyle = '#F6C1CC'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(hx + s * 26, hy - 32)
      ctx.lineTo(hx + s * 40, hy - 52)
      ctx.lineTo(hx + s * 43, hy - 24)
      ctx.closePath()
      ctx.fill()
    }
    // focinho claro
    ctx.fillStyle = LIGHT
    ctx.beginPath()
    ctx.ellipse(hx, hy + 12, 26, 18, 0, 0, Math.PI * 2)
    ctx.fill()
    // olhos fechados (dormindo), nariz e bochechas
    ctx.strokeStyle = LINE
    ctx.lineWidth = 4
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(hx + s * 20, hy - 4, 9, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
    }
    ctx.fillStyle = '#E58C8C'
    ctx.beginPath()
    ctx.ellipse(hx, hy + 6, 5, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(244, 160, 142, 0.6)'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(hx + s * 32, hy + 10, 9, 6, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // "zzz"
    ctx.fillStyle = '#9F8FDB'
    ctx.font = '800 26px "Baloo 2", sans-serif'
    ctx.fillText('z', hx + 46, hy - 54)
    ctx.font = '800 18px "Baloo 2", sans-serif'
    ctx.fillText('z', hx + 66, hy - 74)

    return toTextures(c, bc)
  })
}

// ---------------------------------------------------------------------------
// Cacto: gomos verticais e pontinhos de espinho
// ---------------------------------------------------------------------------

export function cactusTextures() {
  return cached('cactus', () => {
    const W = 256
    const H = 128
    const { c, ctx } = canvas(W, H)
    const { c: bc, ctx: bctx } = canvas(W, H)
    ctx.fillStyle = '#AFC8A6'
    ctx.fillRect(0, 0, W, H)
    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, W, H)
    const ribs = 10
    const rw = W / ribs
    for (let i = 0; i < ribs; i++) {
      const x = i * rw
      // cada gomo: claro no meio, mais escuro no sulco
      const g = ctx.createLinearGradient(x, 0, x + rw, 0)
      g.addColorStop(0, '#93B38B')
      g.addColorStop(0.5, '#BFD6B5')
      g.addColorStop(1, '#93B38B')
      ctx.fillStyle = g
      ctx.fillRect(x, 0, rw, H)
      const bg = bctx.createLinearGradient(x, 0, x + rw, 0)
      bg.addColorStop(0, '#303030')
      bg.addColorStop(0.5, '#D0D0D0')
      bg.addColorStop(1, '#303030')
      bctx.fillStyle = bg
      bctx.fillRect(x, 0, rw, H)
      // espinhos fofos: pontinhos creme no topo do gomo
      for (let y = 8; y < H; y += 16) {
        ctx.fillStyle = '#FFF4E6'
        ctx.beginPath()
        ctx.arc(x + rw / 2, y + (i % 2) * 8, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return toTextures(c, bc)
  })
}
