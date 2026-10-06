import { Howl, Howler } from 'howler'
import { useGameStore } from '../store/useGameStore'
import { AUDIO_FILES, assetUrl, type EffectId, type LoopId } from './assets'
import { TRACKS, renderTrack } from './music'
import { brushSwish, clayRub, claySquish, ding, kilnCrackle, stampPop, toWavUrl, wheelHum } from './synth'

// Motor de áudio: efeitos curtos, loops com volume/tom contínuos e a playlist lo-fi.
// Os sons são preparados cedo (síntese offline não precisa de toque), mas nada toca
// antes do primeiro toque do jogador, como pedem os navegadores.

/** Volume base de cada som, antes do volume de efeitos escolhido pelo jogador */
const EFFECT_GAIN: Record<EffectId, number> = { squish: 0.55, brush: 0.3, pop: 0.55, ding: 0.6, pour: 0.35 }
const LOOP_GAIN: Record<LoopId, number> = { wheel: 0.3, clay: 0.45, kiln: 0.45 }
/** Música em loop baixo */
const MUSIC_GAIN = 0.32

type Src = { src: string[]; format?: string[] }

const generators: Record<EffectId | LoopId, () => Promise<AudioBuffer>> = {
  squish: claySquish,
  brush: () => brushSwish(),
  pop: stampPop,
  ding,
  pour: () => brushSwish(1.1, 77),
  wheel: wheelHum,
  clay: clayRub,
  kiln: kilnCrackle,
}

let prepared: Promise<{ fx: Record<string, Src>; music: Promise<Src[]> }> | null = null
const effects: Partial<Record<EffectId, Howl>> = {}
const loops: Partial<Record<LoopId, { howl: Howl; id: number; level: number }>> = {}
let musicHowls: Howl[] = []
let musicIndex = 0
let started = false

/** Arquivo do manifesto, se houver; senão, síntese → WAV em memória */
async function source(id: EffectId | LoopId): Promise<Src> {
  const file = AUDIO_FILES.effects[id]
  if (file) return { src: [assetUrl(file)] }
  return { src: [toWavUrl(await generators[id]())], format: ['wav'] }
}

/** Gera os sons em segundo plano logo depois de a página carregar */
export function prepareAudio() {
  if (prepared) return prepared
  prepared = (async () => {
    const ids = Object.keys(generators) as (EffectId | LoopId)[]
    const fx: Record<string, Src> = {}
    for (const id of ids) fx[id] = await source(id)
    // a música demora mais: fica pronta depois e entra quando estiver
    const music = (async () => {
      if (AUDIO_FILES.music.length) return AUDIO_FILES.music.map((f) => ({ src: [assetUrl(f)] }))
      const out: Src[] = []
      for (const t of TRACKS) out.push({ src: [toWavUrl(await renderTrack(t))], format: ['wav'] })
      return out
    })()
    return { fx, music }
  })()
  return prepared
}

function settings() {
  return useGameStore.getState().settings
}

/** Aplica mudo e volumes de música/efeitos */
function applyVolumes() {
  const s = settings()
  Howler.mute(s.muted)
  for (const h of musicHowls) h.volume(s.musicVolume * MUSIC_GAIN)
  for (const [id, l] of Object.entries(loops)) {
    if (l) l.howl.volume(LOOP_GAIN[id as LoopId] * s.sfxVolume * l.level, l.id)
  }
}

function playNextTrack() {
  if (!musicHowls.length) return
  const h = musicHowls[musicIndex % musicHowls.length]
  musicIndex++
  h.volume(settings().musicVolume * MUSIC_GAIN)
  h.play()
}

/** Chamar no primeiro toque/tecla: cria os sons no howler e começa a música */
export async function startAudio() {
  if (started) return
  started = true
  const { fx, music } = await prepareAudio()
  for (const id of ['squish', 'brush', 'pop', 'ding', 'pour'] as EffectId[]) {
    effects[id] = new Howl({ ...fx[id], preload: true })
  }
  for (const id of ['wheel', 'clay', 'kiln'] as LoopId[]) {
    const howl = new Howl({ ...fx[id], loop: true, volume: 0 })
    // os loops ficam tocando mudos; o volume sobe quando há algo acontecendo
    loops[id] = { howl, id: howl.play(), level: 0 }
  }
  applyVolumes()
  useGameStore.subscribe((s, prev) => {
    if (s.settings !== prev.settings) applyVolumes()
  })

  musicHowls = (await music).map((m) => new Howl({ ...m, onend: playNextTrack }))
  playNextTrack()
}

/** Toca um efeito curto. `rate` muda o tom (variação natural), `volume` é relativo. */
export function playEffect(id: EffectId, opts: { rate?: number; volume?: number } = {}) {
  const h = effects[id]
  if (!h) return
  const sid = h.play()
  h.volume(EFFECT_GAIN[id] * settings().sfxVolume * (opts.volume ?? 1), sid)
  if (opts.rate) h.rate(opts.rate, sid)
}

/**
 * Ajusta um loop contínuo (chamar a cada quadro). `level` 0 a 1 vira volume com suavização;
 * `rate` muda o tom (o zumbido do torno sobe com a velocidade).
 */
export function setLoop(id: LoopId, level: number, dt: number, rate?: number) {
  const l = loops[id]
  if (!l) return
  const k = Math.min(1, dt * 8)
  const next = l.level + (level - l.level) * k
  if (Math.abs(next - l.level) > 0.0005 || level === 0) {
    l.level = next < 0.001 ? 0 : next
    l.howl.volume(LOOP_GAIN[id] * settings().sfxVolume * l.level, l.id)
  }
  if (rate !== undefined) l.howl.rate(rate, l.id)
}

/** Diagnóstico (desenvolvimento): o que já foi criado e os níveis dos loops */
export function audioDebug() {
  return {
    started,
    effects: Object.keys(effects),
    loops: Object.fromEntries(Object.entries(loops).map(([k, l]) => [k, l ? +l.level.toFixed(2) : null])),
    music: musicHowls.map((h) => ({ state: h.state(), playing: h.playing(), duration: +h.duration().toFixed(1) })),
    ctx: Howler.ctx?.state,
    muted: settings().muted,
  }
}

if (import.meta.env.DEV) Object.assign(window, { __audio: { audioDebug, startAudio } })
