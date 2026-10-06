// Sons gerados por síntese (Web Audio offline), sem arquivos e sem questões de licença.
// Cada função devolve um AudioBuffer; `toWavUrl` vira uma URL que o howler toca.

const RATE = 22050 // suficiente para sons suaves e economiza memória no celular

type Build = (ctx: OfflineAudioContext) => void

/** Gerador pseudoaleatório com semente: o mesmo som sai igual em todo aparelho */
function prng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

async function render(seconds: number, build: Build) {
  const ctx = new OfflineAudioContext(1, Math.ceil(seconds * RATE), RATE)
  build(ctx)
  return ctx.startRendering()
}

/** Buffer de ruído branco (ou marrom, mais grave e "úmido") */
function noiseBuffer(ctx: BaseAudioContext, seconds: number, seed: number, brown = false) {
  const buf = ctx.createBuffer(1, Math.ceil(seconds * ctx.sampleRate), ctx.sampleRate)
  const d = buf.getChannelData(0)
  const rnd = prng(seed)
  let last = 0
  for (let i = 0; i < d.length; i++) {
    const w = rnd() * 2 - 1
    if (brown) {
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    } else d[i] = w
  }
  return buf
}

function noiseSource(ctx: BaseAudioContext, seconds: number, seed: number, brown = false) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, seconds, seed, brown)
  return src
}

/**
 * Transforma um som renderizado com sobra em loop sem emenda:
 * o pedaço depois do fim é misturado no começo (crossfade).
 */
function makeLoop(buf: AudioBuffer, loopSeconds: number, fadeSeconds: number) {
  const n = Math.round(loopSeconds * buf.sampleRate)
  const f = Math.round(fadeSeconds * buf.sampleRate)
  const src = buf.getChannelData(0)
  const out = new AudioBuffer({ length: n, numberOfChannels: 1, sampleRate: buf.sampleRate })
  const d = out.getChannelData(0)
  for (let i = 0; i < n; i++) {
    if (i < f && n + i < src.length) {
      const k = i / f
      d[i] = src[i] * Math.sqrt(k) + src[n + i] * Math.sqrt(1 - k)
    } else d[i] = src[i]
  }
  return out
}

/** Normaliza o pico para não estourar e deixar todos os sons num volume parecido */
function normalize(buf: AudioBuffer, peak = 0.8) {
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c)
    let m = 0
    for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]))
    if (m > 0) for (let i = 0; i < d.length; i++) d[i] *= peak / m
  }
  return buf
}

/** AudioBuffer → WAV 16 bits → URL de blob (o howler precisa de `format: ['wav']`) */
export function toWavUrl(buf: AudioBuffer) {
  const ch = buf.numberOfChannels
  const len = buf.length
  const bytes = 44 + len * ch * 2
  const view = new DataView(new ArrayBuffer(bytes))
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  view.setUint32(4, bytes - 8, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, ch, true)
  view.setUint32(24, buf.sampleRate, true)
  view.setUint32(28, buf.sampleRate * ch * 2, true)
  view.setUint16(32, ch * 2, true)
  view.setUint16(34, 16, true)
  str(36, 'data')
  view.setUint32(40, len * ch * 2, true)
  const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c))
  let o = 44
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i]))
      view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true)
      o += 2
    }
  }
  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }))
}

// ---------------- sons ----------------

/** Zumbido do torno: tons graves periódicos + ronco de motor (loop de 2 s) */
export async function wheelHum() {
  const buf = await render(2.2, (ctx) => {
    const bus = ctx.createGain()
    bus.gain.value = 0.5
    bus.connect(ctx.destination)
    for (const [type, f, g] of [
      ['triangle', 55, 0.5],
      ['sine', 110, 0.6],
      ['sine', 220, 0.12],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      const gn = ctx.createGain()
      gn.gain.value = g
      o.connect(gn).connect(bus)
      o.start()
    }
    // leve pulsação (4 Hz → ciclos inteiros em 2 s)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 4
    const depth = ctx.createGain()
    depth.gain.value = 0.12
    lfo.connect(depth).connect(bus.gain)
    lfo.start()
    const n = noiseSource(ctx, 2.2, 7, true)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 380
    const ng = ctx.createGain()
    ng.gain.value = 0.5
    n.connect(lp).connect(ng).connect(bus)
    n.start()
  })
  return normalize(makeLoop(buf, 2, 0.15), 0.7)
}

/** Argila úmida sendo esfregada: ruído marrom filtrado que "respira" + estalinhos molhados */
export async function clayRub() {
  const buf = await render(2.3, (ctx) => {
    const n = noiseSource(ctx, 2.3, 11, true)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 650
    bp.Q.value = 0.9
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 2.5
    const lg = ctx.createGain()
    lg.gain.value = 260
    lfo.connect(lg).connect(bp.frequency)
    lfo.start()
    const g = ctx.createGain()
    g.gain.value = 0.9
    n.connect(bp).connect(g).connect(ctx.destination)
    n.start()
    // bolhinhas de água
    const rnd = prng(5)
    for (let i = 0; i < 9; i++) {
      const t = rnd() * 2
      const o = ctx.createOscillator()
      o.frequency.setValueAtTime(300 + rnd() * 300, t)
      o.frequency.exponentialRampToValueAtTime(120, t + 0.05)
      const eg = ctx.createGain()
      eg.gain.setValueAtTime(0, t)
      eg.gain.linearRampToValueAtTime(0.08 + rnd() * 0.08, t + 0.005)
      eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
      o.connect(eg).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.08)
    }
  })
  return normalize(makeLoop(buf, 2, 0.2), 0.7)
}

/** "Squish" curto de argila molhada (ao abrir a boca, ao achatar) */
export async function claySquish() {
  return normalize(
    await render(0.4, (ctx) => {
      const n = noiseSource(ctx, 0.4, 21, true)
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = 2
      bp.frequency.setValueAtTime(1300, 0)
      bp.frequency.exponentialRampToValueAtTime(260, 0.3)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, 0)
      g.gain.linearRampToValueAtTime(1, 0.015)
      g.gain.exponentialRampToValueAtTime(0.001, 0.35)
      n.connect(bp).connect(g).connect(ctx.destination)
      n.start()
      const o = ctx.createOscillator()
      o.frequency.setValueAtTime(190, 0)
      o.frequency.exponentialRampToValueAtTime(80, 0.09)
      const og = ctx.createGain()
      og.gain.setValueAtTime(0.5, 0)
      og.gain.exponentialRampToValueAtTime(0.001, 0.1)
      o.connect(og).connect(ctx.destination)
      o.start()
      o.stop(0.12)
    }),
    0.75,
  )
}

/** Pincel: "swish" de cerdas (ruído agudo com envelope suave e tremulação) */
export async function brushSwish(seconds = 0.45, seed = 31) {
  return normalize(
    await render(seconds, (ctx) => {
      const n = noiseSource(ctx, seconds, seed)
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1800
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 3800
      bp.Q.value = 0.6
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, 0)
      g.gain.linearRampToValueAtTime(1, seconds * 0.3)
      g.gain.linearRampToValueAtTime(0, seconds)
      const flutter = ctx.createOscillator()
      flutter.frequency.value = 28
      const fg = ctx.createGain()
      fg.gain.value = 0.25
      flutter.connect(fg).connect(g.gain)
      flutter.start()
      n.connect(hp).connect(bp).connect(g).connect(ctx.destination)
      n.start()
    }),
    0.6,
  )
}

/** "Pop" de bolha do carimbo */
export async function stampPop() {
  return normalize(
    await render(0.2, (ctx) => {
      const o = ctx.createOscillator()
      o.frequency.setValueAtTime(950, 0)
      o.frequency.exponentialRampToValueAtTime(230, 0.07)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, 0)
      g.gain.linearRampToValueAtTime(1, 0.004)
      g.gain.exponentialRampToValueAtTime(0.001, 0.16)
      o.connect(g).connect(ctx.destination)
      o.start()
      o.stop(0.2)
      const n = noiseSource(ctx, 0.01, 41)
      const ng = ctx.createGain()
      ng.gain.value = 0.25
      n.connect(ng).connect(ctx.destination)
      n.start()
    }),
    0.8,
  )
}

/** Crepitar do forno: ronco grave + estalinhos aleatórios (loop de 3 s) */
export async function kilnCrackle() {
  const buf = await render(3.3, (ctx) => {
    const n = noiseSource(ctx, 3.3, 51, true)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 260
    const g = ctx.createGain()
    g.gain.value = 0.6
    n.connect(lp).connect(g).connect(ctx.destination)
    n.start()
    const rnd = prng(52)
    for (let i = 0; i < 70; i++) {
      const t = rnd() * 3.2
      const c = noiseSource(ctx, 0.012, 100 + i)
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1200 + rnd() * 2500
      const cg = ctx.createGain()
      const amp = 0.15 + rnd() ** 3 * 0.9
      cg.gain.setValueAtTime(amp, t)
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.004 + rnd() * 0.01)
      c.connect(hp).connect(cg).connect(ctx.destination)
      c.start(t)
    }
  })
  return normalize(makeLoop(buf, 3, 0.2), 0.7)
}

/** Ding de sininho: parciais inarmônicas com decaimentos diferentes */
export async function ding() {
  return normalize(
    await render(2.4, (ctx) => {
      for (const [ratio, gain, decay] of [
        [1, 1, 2.2],
        [2.0, 0.35, 1.4],
        [2.76, 0.25, 0.9],
        [5.4, 0.1, 0.4],
      ]) {
        for (const detune of [0, 0.6]) {
          const o = ctx.createOscillator()
          o.frequency.value = 1046.5 * ratio + detune
          const g = ctx.createGain()
          g.gain.setValueAtTime(0, 0)
          g.gain.linearRampToValueAtTime(gain * 0.5, 0.006)
          g.gain.exponentialRampToValueAtTime(0.0001, decay)
          o.connect(g).connect(ctx.destination)
          o.start()
          o.stop(decay + 0.05)
        }
      }
    }),
    0.75,
  )
}

export { RATE as SYNTH_RATE, render, prng, noiseSource, normalize }
