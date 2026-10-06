import { normalize, noiseSource, prng, render } from './synth'

// Música lo-fi gerada por síntese: piano elétrico com tremolo, baixo, bateria preguiçosa
// com swing, melodia pentatônica esparsa e chiado de vinil. Duas faixas que se alternam.

const BPM = 72
const BEAT = 60 / BPM
const BAR = BEAT * 4
const BARS = 8
export const TRACK_SECONDS = BAR * BARS

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

interface TrackSpec {
  seed: number
  /** acordes (notas MIDI), um por compasso, repetidos até completar 8 compassos */
  chords: number[][]
  /** escala pentatônica da melodia */
  scale: number[]
}

export const TRACKS: TrackSpec[] = [
  {
    // Fmaj7 – Em7 – Dm7 – Cmaj7
    seed: 1,
    chords: [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60],
      [48, 52, 55, 59],
    ],
    scale: [72, 74, 76, 79, 81, 84],
  },
  {
    // Am7 – Dm7 – G7 – Cmaj7
    seed: 2,
    chords: [
      [57, 60, 64, 67],
      [50, 53, 57, 60],
      [55, 59, 62, 65],
      [48, 52, 55, 59],
    ],
    scale: [69, 72, 74, 76, 79, 81],
  },
]

/** Piano elétrico: duas senoides levemente desafinadas + harmônico suave */
function epNote(ctx: BaseAudioContext, out: AudioNode, note: number, t: number, len: number, vel: number) {
  const f = midi(note)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vel, t + 0.015)
  g.gain.exponentialRampToValueAtTime(vel * 0.45, t + 0.6)
  g.gain.setValueAtTime(vel * 0.45, t + Math.max(0.61, len - 0.35))
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  g.connect(out)
  for (const [mult, amp] of [
    [1, 1],
    [1.004, 0.6],
    [2, 0.12],
  ]) {
    const o = ctx.createOscillator()
    o.frequency.value = f * mult
    const og = ctx.createGain()
    og.gain.value = amp
    o.connect(og).connect(g)
    o.start(t)
    o.stop(t + len + 0.05)
  }
}

function kick(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) {
  const o = ctx.createOscillator()
  o.frequency.setValueAtTime(115, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14)
  const g = ctx.createGain()
  g.gain.setValueAtTime(vel, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + 0.35)
}

function snare(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number, seed: number) {
  const n = noiseSource(ctx, 0.2, seed)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1700
  bp.Q.value = 0.7
  const g = ctx.createGain()
  g.gain.setValueAtTime(vel, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  n.connect(bp).connect(g).connect(out)
  n.start(t)
}

function hat(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number, seed: number) {
  const n = noiseSource(ctx, 0.05, seed)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  const g = ctx.createGain()
  g.gain.setValueAtTime(vel, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  n.connect(hp).connect(g).connect(out)
  n.start(t)
}

/** Renderiza uma faixa completa (8 compassos, ~26,7 s) */
export async function renderTrack(spec: TrackSpec) {
  const buf = await render(TRACK_SECONDS, (ctx) => {
    const rnd = prng(spec.seed * 97)
    // tudo passa por um passa-baixa: som abafado de fita
    const master = ctx.createBiquadFilter()
    master.type = 'lowpass'
    master.frequency.value = 2400
    master.connect(ctx.destination)

    const keys = ctx.createGain()
    keys.gain.value = 0.32
    keys.connect(master)
    // tremolo do piano elétrico
    const trem = ctx.createOscillator()
    trem.frequency.value = 4.8
    const td = ctx.createGain()
    td.gain.value = 0.06
    trem.connect(td).connect(keys.gain)
    trem.start()

    const drums = ctx.createGain()
    drums.gain.value = 0.55
    drums.connect(master)

    const swing = BEAT * 0.08
    for (let bar = 0; bar < BARS; bar++) {
      const t0 = bar * BAR
      const chord = spec.chords[bar % spec.chords.length]
      // acorde no 1 e um "toque" atrasado no 2-e
      const last = bar === BARS - 1
      chord.forEach((n, i) => {
        epNote(ctx, keys, n, t0 + i * 0.012, last ? BAR * 0.8 : BEAT * 1.5, 0.22)
        if (!last) epNote(ctx, keys, n, t0 + BEAT * 2.5 + swing + i * 0.01, BEAT * 1.4, 0.16)
      })
      // baixo: fundamental nos tempos 1 e 3
      for (const beat of [0, 2]) {
        const o = ctx.createOscillator()
        o.frequency.value = midi(chord[0] - 12)
        const g = ctx.createGain()
        const t = t0 + beat * BEAT
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.42, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 1.6)
        o.connect(g).connect(master)
        o.start(t)
        o.stop(t + BEAT * 1.7)
      }
      // bateria preguiçosa (entra a partir do 2º compasso)
      if (bar > 0) {
        kick(ctx, drums, t0, 0.8)
        kick(ctx, drums, t0 + BEAT * 2 + (bar % 2 ? BEAT * 0.5 : 0), 0.6)
        snare(ctx, drums, t0 + BEAT + swing, 0.35, bar * 10 + 1)
        snare(ctx, drums, t0 + BEAT * 3 + swing, 0.35, bar * 10 + 2)
        for (let e = 0; e < 8; e++) {
          const t = t0 + e * (BEAT / 2) + (e % 2 ? swing * 1.5 : 0)
          hat(ctx, drums, t, 0.06 + rnd() * 0.06, bar * 100 + e)
        }
      }
      // melodia na segunda metade: poucas notas, bem calmas
      if (bar >= 4 && !last) {
        for (let k = 0; k < 3; k++) {
          if (rnd() < 0.35) continue
          const n = spec.scale[Math.floor(rnd() * spec.scale.length)]
          const t = t0 + (k * 1.25 + rnd() * 0.25) * BEAT
          const o = ctx.createOscillator()
          o.frequency.value = midi(n)
          const vib = ctx.createOscillator()
          vib.frequency.value = 5
          const vg = ctx.createGain()
          vg.gain.value = 3
          vib.connect(vg).connect(o.frequency)
          const g = ctx.createGain()
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.09, t + 0.04)
          g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 1.2)
          o.connect(g).connect(master)
          o.start(t)
          vib.start(t)
          o.stop(t + BEAT * 1.3)
          vib.stop(t + BEAT * 1.3)
        }
      }
    }

    // vinil: chiado bem baixinho + estalos raros
    const hiss = noiseSource(ctx, TRACK_SECONDS, spec.seed * 13)
    const hlp = ctx.createBiquadFilter()
    hlp.type = 'lowpass'
    hlp.frequency.value = 3500
    const hg = ctx.createGain()
    hg.gain.value = 0.012
    hiss.connect(hlp).connect(hg).connect(ctx.destination)
    hiss.start()
    for (let i = 0; i < 40; i++) {
      const t = rnd() * TRACK_SECONDS
      const c = noiseSource(ctx, 0.004, 900 + i)
      const cg = ctx.createGain()
      cg.gain.value = 0.05 + rnd() * 0.08
      c.connect(cg).connect(ctx.destination)
      c.start(t)
    }
  })
  return normalize(buf, 0.7)
}
