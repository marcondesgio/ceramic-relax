import { normalize, noiseSource, prng, render } from './synth'

// Música lo-fi gerada por síntese: piano elétrico com tremolo e eco suave, baixo, bateria
// macia com swing (kick redondo e escovinha) e melodia pentatônica esparsa. Sem chiado:
// renderizada a 44,1 kHz para os agudos ficarem limpos. Duas faixas que se alternam.

/** Taxa da música (os efeitos curtos usam 22,05 kHz) */
const MUSIC_RATE = 44100

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

/** Kick redondo: senoide que desce de tom, com ataque curtinho (sem estalo) */
function kick(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number) {
  const o = ctx.createOscillator()
  o.frequency.setValueAtTime(95, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vel, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.36)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + 0.4)
}

/** Escovinha no lugar da caixa: ruído grave e abafado, com ataque e cauda suaves */
function brush(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number, seed: number) {
  const n = noiseSource(ctx, 0.3, seed)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2200
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 900
  bp.Q.value = 0.5
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vel, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
  n.connect(lp).connect(bp).connect(g).connect(out)
  n.start(t)
  n.stop(t + 0.3)
}

/** Shaker bem baixinho, só um sopro de ritmo (nada de chiado agudo) */
function shaker(ctx: BaseAudioContext, out: AudioNode, t: number, vel: number, seed: number) {
  const n = noiseSource(ctx, 0.08, seed)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 3800
  bp.Q.value = 1.2
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vel, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  n.connect(bp).connect(g).connect(out)
  n.start(t)
  n.stop(t + 0.08)
}

/** Renderiza uma faixa completa (8 compassos, ~26,7 s) */
export async function renderTrack(spec: TrackSpec) {
  const buf = await render(TRACK_SECONDS, (ctx) => {
    const rnd = prng(spec.seed * 97)
    // tudo passa por um passa-baixa suave: som quentinho de fita, sem ficar abafado
    const master = ctx.createBiquadFilter()
    master.type = 'lowpass'
    master.frequency.value = 3400
    master.Q.value = 0.5
    master.connect(ctx.destination)

    // eco discreto e escuro para o piano e a melodia (ambiência no lugar do chiado)
    const echo = ctx.createDelay(1)
    echo.delayTime.value = BEAT * 0.75
    const echoTone = ctx.createBiquadFilter()
    echoTone.type = 'lowpass'
    echoTone.frequency.value = 1600
    const feedback = ctx.createGain()
    feedback.gain.value = 0.28
    const wet = ctx.createGain()
    wet.gain.value = 0.22
    echo.connect(echoTone).connect(feedback).connect(echo)
    echoTone.connect(wet).connect(master)

    const keys = ctx.createGain()
    keys.gain.value = 0.32
    keys.connect(master)
    keys.connect(echo)
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
        kick(ctx, drums, t0, 0.75)
        kick(ctx, drums, t0 + BEAT * 2 + (bar % 2 ? BEAT * 0.5 : 0), 0.55)
        brush(ctx, drums, t0 + BEAT + swing, 0.32, bar * 10 + 1)
        brush(ctx, drums, t0 + BEAT * 3 + swing, 0.32, bar * 10 + 2)
        for (let e = 1; e < 8; e += 2) {
          const t = t0 + e * (BEAT / 2) + swing * 1.5
          shaker(ctx, drums, t, 0.025 + rnd() * 0.015, bar * 100 + e)
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
          g.connect(echo)
          o.start(t)
          vib.start(t)
          o.stop(t + BEAT * 1.3)
          vib.stop(t + BEAT * 1.3)
        }
      }
    }
  }, MUSIC_RATE)
  return fadeEdges(normalize(buf, 0.7))
}

/** Entrada e saída de 30 ms: a troca de faixa não estala */
function fadeEdges(buf: AudioBuffer) {
  const d = buf.getChannelData(0)
  const n = Math.round(0.03 * buf.sampleRate)
  for (let k = 0; k < n; k++) {
    const g = k / n
    d[k] *= g
    d[d.length - 1 - k] *= g
  }
  return buf
}
