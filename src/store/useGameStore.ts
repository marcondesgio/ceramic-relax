import { create } from 'zustand'
import { detectLang, saveLang, type Lang } from '../i18n'
import i18n from '../i18n'
import {
  createBallProfile,
  restoreSnapshot,
  snapshotOf,
  type Profile,
  type ProfileSnapshot,
} from '../pottery/profile'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { clearPaintHistory } from '../paint/paintHistory'
import { clearSurfaces, type Side } from '../paint/paintSurface'
import type { BrushSize } from '../paint/palette'
import type { StampId } from '../paint/stamps'

export type Phase = 'home' | 'modeling' | 'painting' | 'kiln' | 'firing' | 'result'
export type Finish = 'glossy' | 'matte'
export type Quality = 'high' | 'low'
export type PaintTool = 'brush' | 'bands' | 'stamp' | 'bucket' | 'eraser'

export interface PaintState {
  tool: PaintTool
  size: BrushSize
  /** índice na paleta fixa de 12 cores */
  color: number
  stamp: StampId
  side: Side
  /** já pintou algo nesta peça (pede confirmação ao voltar a modelar) */
  hasPaint: boolean
}

const UNDO_LIMIT = 20
const SETTINGS_KEY = 'ceramic-relax:settings'

/** Configurações salvas no próprio aparelho (o idioma tem a sua própria chave, ver i18n) */
function loadSettings(): Settings {
  const defaults: Settings = {
    lang: detectLang(),
    muted: false,
    musicVolume: 0.6,
    sfxVolume: 0.85,
    wheelAlwaysOn: false,
    // respeita a preferência do sistema na primeira vez
    reduceMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    vibration: true,
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<Settings> | null
    return saved ? { ...defaults, ...saved, lang: defaults.lang } : defaults
  } catch {
    return defaults
  }
}

function saveSettings(s: Settings) {
  try {
    const { lang: _lang, ...rest } = s
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest))
  } catch {
    /* armazenamento indisponível: segue só na sessão */
  }
}

export interface Settings {
  lang: Lang
  muted: boolean
  musicVolume: number
  sfxVolume: number
  wheelAlwaysOn: boolean
  reduceMotion: boolean
  vibration: boolean
}

interface GameState {
  phase: Phase
  /** perfil mutável: a malha lê direto daqui a cada quadro */
  profile: Profile
  /** muda quando uma peça nova começa (dispara a animação de "ploft") */
  pieceId: number
  undoStack: ProfileSnapshot[]
  /** pintura: as texturas (canvas) ficam em paint/paintSurface; aqui as escolhas do jogador */
  paint: PaintState
  finish: Finish
  /** prévias (data URL) da peça com cada acabamento, para os cartões do forno */
  previews: Record<Finish, string | null>
  settings: Settings

  /** torno: entradas e velocidade atual (0 a 1) */
  wheelInput: { space: boolean; pedal: number }
  wheelSpeed: number

  /** qualidade gráfica escolhida pelo PerformanceMonitor */
  quality: Quality

  /** aviso curto que some sozinho (chave de tradução) */
  toast: { key: string; id: number } | null
  /** menu de opções aberto */
  optionsOpen: boolean

  setPhase: (phase: Phase) => void
  pushUndo: () => void
  undo: () => void
  newPiece: () => void
  backToModeling: () => void
  updatePaint: (patch: Partial<PaintState>) => void
  setFinish: (finish: Finish) => void
  setPreviews: (previews: Record<Finish, string | null>) => void
  setLang: (lang: Lang) => void
  updateSettings: (patch: Partial<Settings>) => void
  setSpaceHeld: (held: boolean) => void
  setPedal: (value: number) => void
  setWheelSpeed: (speed: number) => void
  setQuality: (q: Quality) => void
  showToast: (key: string) => void
  setOptionsOpen: (open: boolean) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'home',
  profile: createBallProfile(),
  pieceId: 0,
  undoStack: [],
  paint: { tool: 'brush', size: 'M', color: 1, stamp: 'star', side: 'outer', hasPaint: false },
  finish: 'glossy',
  previews: { glossy: null, matte: null },
  settings: loadSettings(),
  wheelInput: { space: false, pedal: 0 },
  wheelSpeed: 0,
  quality: 'high',
  toast: null,
  optionsOpen: false,

  setPhase: (phase) => set({ phase }),

  // guarda o estado atual antes de uma nova deformação
  pushUndo: () => {
    const stack = [...get().undoStack, snapshotOf(get().profile)]
    if (stack.length > UNDO_LIMIT) stack.shift()
    set({ undoStack: stack })
  },

  undo: () => {
    const stack = get().undoStack
    if (!stack.length) return
    const last = stack[stack.length - 1]
    potteryRuntime.mouthPending = 0
    restoreSnapshot(get().profile, last)
    set({ undoStack: stack.slice(0, -1) })
  },

  newPiece: () => {
    potteryRuntime.mouthPending = 0
    clearSurfaces()
    clearPaintHistory()
    set((s) => ({
      profile: createBallProfile(),
      pieceId: s.pieceId + 1,
      undoStack: [],
      paint: { ...s.paint, side: 'outer', hasPaint: false },
      phase: 'modeling',
    }))
  },

  // apaga a pintura e volta para o torno (a forma da peça continua a mesma)
  backToModeling: () => {
    clearSurfaces()
    clearPaintHistory()
    set((s) => ({ paint: { ...s.paint, side: 'outer', hasPaint: false }, phase: 'modeling' }))
  },

  updatePaint: (patch) => set((s) => ({ paint: { ...s.paint, ...patch } })),
  setFinish: (finish) => set({ finish }),
  setPreviews: (previews) => set({ previews }),

  setLang: (lang) => {
    saveLang(lang)
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    set((s) => ({ settings: { ...s.settings, lang } }))
  },

  updateSettings: (patch) =>
    set((s) => {
      const settings = { ...s.settings, ...patch }
      saveSettings(settings)
      return { settings }
    }),

  setSpaceHeld: (held) =>
    set((s) => (s.wheelInput.space === held ? s : { wheelInput: { ...s.wheelInput, space: held } })),
  setPedal: (value) => set((s) => ({ wheelInput: { ...s.wheelInput, pedal: value } })),
  setWheelSpeed: (wheelSpeed) => set({ wheelSpeed }),
  setQuality: (quality) => set({ quality }),
  showToast: (key) => set((s) => ({ toast: { key, id: (s.toast?.id ?? 0) + 1 } })),
  setOptionsOpen: (optionsOpen) => set({ optionsOpen }),
}))

// facilita inspecionar o estado pelo console durante o desenvolvimento
if (import.meta.env.DEV) (window as unknown as { __game: typeof useGameStore }).__game = useGameStore

/** Nível perceptível do torno para a interface: 0 parado, 1 lento, 2 médio, 3 rápido */
export function wheelLevel(speed: number) {
  if (speed < 0.05) return 0
  if (speed < 0.4) return 1
  if (speed < 0.75) return 2
  return 3
}
