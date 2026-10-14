import { create } from 'zustand'
import { detectLang, type Lang } from '../i18n'
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
import { setClayMarks } from '../pottery/clayMarks'
import { resetHydration } from '../pottery/hydration'
import { AMOUNT_DEFAULT, BUBBLES_START, marksFromBubbles, type ClayMarks, type PrepStep } from '../prep/prep'
import type { CrackleRecipe, HandleRecipe, HoleRecipe, PieceRecipe } from './persistence'
import type { AnimalId, Order } from '../village/animals'
import type { ReactionLevel } from '../village/traits'

export type Phase = 'home' | 'prep' | 'modeling' | 'finishing' | 'painting' | 'kiln' | 'firing' | 'result'
export type Finish = 'glossy' | 'matte'
export type Quality = 'high' | 'low'
export type PaintTool = 'brush' | 'bands' | 'stamp' | 'bucket' | 'eraser'
export type SpongeState = 'off' | 'wet' | 'empty'

/** Etapas da visita de um bichinho (ver village/village.ts) */
export type VisitStage = 'knocking' | 'arriving' | 'asking' | 'waiting' | 'delivering' | 'reacting' | 'leaving'

export interface Visit {
  animal: AnimalId
  order: Order
  stage: VisitStage
  /** reação à peça entregue */
  level?: ReactionLevel
  /** saindo depois de um "Agora não" (despedida carinhosa) */
  declined?: boolean
}

/** Progresso na vila, salvo no aparelho */
export interface VillageProgress {
  /** visitas já começadas (as 3 primeiras seguem a ordem Capi, Tatá, Tuco) */
  visits: number
  lastAnimal: AnimalId | null
  /** pedido aceito, esperando a entrega */
  order: Order | null
  delivered: number
  /** desafios da lojinha já entregues (ids dos itens) — o álbum dos bichinhos */
  challengesDone?: string[]
  /** presente de boas-vindas da lojinha já recebido */
  welcomeGift?: boolean
}
/** Ferramentas do acabamento: ripador horizontal ou uma das alças pré-moldadas */
export type FinishTool = 'rib' | 'flute' | 'hole' | HandleRecipe['shape']
/** Gomos do ripado vertical (fino, médio, largo) */
export type FluteCount = 18 | 12 | 8
type FlutingRecipe = PieceRecipe['fluting']

/** Passo de desfazer do acabamento: a forma (ripado) e as alças */
interface FinishSnapshot {
  profile: ProfileSnapshot
  handles: HandleRecipe[]
  holes: HoleRecipe[]
  fluting: FlutingRecipe | null
}

export interface PaintState {
  tool: PaintTool
  size: BrushSize
  /** índice na paleta fixa de 12 cores */
  color: number
  stamp: StampId
  side: Side
  /** já pintou algo nesta peça (pede confirmação ao voltar a modelar) */
  hasPaint: boolean
  /** estampas usadas nesta peça (os bichinhos leem a estampa) */
  stampsUsed: StampId[]
  bandsUsed: boolean
}

/** Preparo da argila na bancada (o que a interface precisa; o movimento fica em prep/prepRuntime) */
export interface PrepState {
  step: PrepStep
  /** quantidade escolhida no fio de corte (1 = bola padrão) */
  amount: number
  /** bolhas que ainda estão na massa */
  bubbles: number
  /** a massa já está achatada pelo rolo (pode dobrar) */
  flat: boolean
  folds: number
}

function initialPrep(): PrepState {
  return { step: 'cut', amount: AMOUNT_DEFAULT, bubbles: BUBBLES_START, flat: false, folds: 0 }
}

const UNDO_LIMIT = 20

/** Peça nova ou bola nova no torno: sem alças e com o ripador na mão */
function emptyFinishing() {
  return {
    handles: [] as HandleRecipe[],
    holes: [] as HoleRecipe[],
    fluting: null,
    finishTool: 'rib' as FinishTool,
    selectedHandle: null,
    finishUndo: [],
  }
}

/**
 * Configurações iniciais do aparelho. As salvas chegam pela hidratação
 * (store/saveGame.ts), antes da primeira tela aparecer.
 */
export function defaultSettings(): Settings {
  return {
    lang: detectLang(),
    muted: false,
    musicVolume: 0.6,
    sfxVolume: 0.85,
    wheelAlwaysOn: false,
    // respeita a preferência do sistema na primeira vez
    reduceMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    vibration: true,
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
  prep: PrepState
  /** marquinhas das bolhas que sobraram no preparo (null = argila lisinha) */
  marks: ClayMarks | null
  /** esponja da hidratação: guardada, molhada ou já espremida (precisa voltar ao balde) */
  sponge: SpongeState
  /** a argila está visivelmente secando em algum ponto (só para a dica da esponja) */
  clayDrying: boolean
  /** fissuras gravadas ao sair do torno: viram craquelado no forno (null = sem fissuras) */
  crackle: CrackleRecipe | null
  /** alças pré-moldadas coladas na peça (acabamento) */
  handles: HandleRecipe[]
  /** furos da espátula e ripado vertical (acabamento) */
  holes: HoleRecipe[]
  fluting: FlutingRecipe | null
  /** escolhas das ferramentas: gomos do ripado vertical e ponta da espátula */
  fluteCount: FluteCount
  holeShape: HoleRecipe['shape']
  finishTool: FinishTool | null
  /** alça com os pontos de controle à mostra */
  selectedHandle: number | null
  finishUndo: FinishSnapshot[]
  /** pintura: as texturas (canvas) ficam em paint/paintSurface; aqui as escolhas do jogador */
  paint: PaintState
  finish: Finish
  /** prévias (data URL) da peça com cada acabamento, para os cartões do forno */
  previews: Record<Finish, string | null>
  settings: Settings

  /** vila: progresso salvo, bichinho na sala agora e quando bate o próximo (ms, Date.now) */
  village: VillageProgress
  visit: Visit | null
  nextKnockAt: number | null
  /** a peça atual foi entregue a este bichinho (vai para a prateleira com o nome) */
  deliveredTo: AnimalId | null
  /** cartão do pedido aberto pelo botão do topo */
  orderOpen: boolean
  /** lojinha aberta */
  shopOpen: boolean

  /** moedinhas da lojinha e ids dos itens comprados */
  coins: number
  purchases: string[]
  /** prateleira: peças prontas, salvas como receita */
  shelf: PieceRecipe[]
  /** peça salva a retomar: "Começar" volta para esta fase em vez da modelagem */
  resumePhase: Exclude<Phase, 'home'> | null

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
  /** "Começar": continua a peça salva ou vai para o preparo da argila */
  start: () => void
  updatePrep: (patch: Partial<PrepState>) => void
  /**
   * Fim do preparo: a quantidade vira a bola do torno e as bolhas que sobraram viram marquinhas.
   * `prepared`: argila preparada da lojinha (sem bolhas).
   */
  finishPrep: (prepared?: boolean) => void
  setMarks: (marks: ClayMarks | null) => void
  setSponge: (sponge: SpongeState) => void
  setClayDrying: (drying: boolean) => void
  setCrackle: (crackle: CrackleRecipe | null) => void
  /** kintsugi: gratuito e sempre disponível para peças craqueladas */
  restoreKintsugi: () => void
  setFinishTool: (tool: FinishTool | null) => void
  selectHandle: (index: number | null) => void
  /** guarda forma e alças antes de uma mudança do acabamento (ripar, colar, ajustar, remover) */
  pushFinishUndo: () => void
  undoFinish: () => void
  addHandle: (handle: HandleRecipe) => void
  addHole: (hole: HoleRecipe) => void
  setFluting: (fluting: FlutingRecipe | null) => void
  setFinishParams: (patch: { fluteCount?: FluteCount; holeShape?: HoleRecipe['shape'] }) => void
  updateHandle: (index: number, handle: HandleRecipe) => void
  removeHandle: (index: number) => void
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
  setVillage: (patch: Partial<VillageProgress>) => void
  setVisit: (visit: Visit | null) => void
  setNextKnock: (at: number | null) => void
  setDeliveredTo: (animal: AnimalId | null) => void
  setOrderOpen: (open: boolean) => void
  setShopOpen: (open: boolean) => void
  addCoins: (amount: number) => void
  /** compra um item da lojinha; false se faltar moedinha ou se já tiver */
  buyItem: (id: string, price: number) => boolean
  /** coloca (ou atualiza, pelo id) uma peça na prateleira */
  putOnShelf: (piece: PieceRecipe) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'home',
  profile: createBallProfile(),
  pieceId: 0,
  undoStack: [],
  prep: initialPrep(),
  marks: null,
  sponge: 'off',
  clayDrying: false,
  crackle: null,
  handles: [],
  holes: [],
  fluting: null,
  fluteCount: 12,
  holeShape: 'round',
  finishTool: 'rib',
  selectedHandle: null,
  finishUndo: [],
  paint: { tool: 'brush', size: 'M', color: 1, stamp: 'star', side: 'outer', hasPaint: false, stampsUsed: [], bandsUsed: false },
  finish: 'glossy',
  previews: { glossy: null, matte: null },
  settings: defaultSettings(),
  village: { visits: 0, lastAnimal: null, order: null, delivered: 0 },
  visit: null,
  nextKnockAt: null,
  deliveredTo: null,
  orderOpen: false,
  shopOpen: false,
  coins: 0,
  purchases: [],
  shelf: [],
  resumePhase: null,
  wheelInput: { space: false, pedal: 0 },
  wheelSpeed: 0,
  quality: 'high',
  toast: null,
  optionsOpen: false,

  // voltar ao início guarda onde o jogador estava, para "Começar" continuar dali
  setPhase: (phase) =>
    set((s) => {
      const from = s.phase
      return phase === 'home' && from !== 'home' ? { phase, resumePhase: from } : { phase }
    }),

  start: () => set((s) => ({ phase: s.resumePhase ?? 'prep', resumePhase: null })),

  updatePrep: (patch) => set((s) => ({ prep: { ...s.prep, ...patch } })),

  finishPrep: (prepared = false) => {
    const { prep } = get()
    const marks = prepared ? null : marksFromBubbles(prep.bubbles)
    potteryRuntime.mouthPending = 0
    setClayMarks(marks)
    // a bola chega ao torno úmida e lisinha
    resetHydration()
    set({
      profile: createBallProfile(prep.amount),
      marks,
      undoStack: [],
      sponge: 'off',
      clayDrying: false,
      crackle: null,
      ...emptyFinishing(),
      phase: 'modeling',
    })
  },

  setMarks: (marks) => {
    setClayMarks(marks)
    set({ marks })
  },

  setSponge: (sponge) => set({ sponge }),
  setClayDrying: (clayDrying) => set({ clayDrying }),
  setCrackle: (crackle) => set({ crackle }),
  restoreKintsugi: () =>
    set((s) => (s.crackle && !s.crackle.kintsugi ? { crackle: { ...s.crackle, kintsugi: true } } : s)),

  setFinishTool: (finishTool) => set({ finishTool }),
  selectHandle: (selectedHandle) => set({ selectedHandle }),

  pushFinishUndo: () => {
    const s = get()
    const stack = [...s.finishUndo, { profile: snapshotOf(s.profile), handles: s.handles, holes: s.holes, fluting: s.fluting }]
    if (stack.length > UNDO_LIMIT) stack.shift()
    set({ finishUndo: stack })
  },

  undoFinish: () => {
    const s = get()
    const last = s.finishUndo[s.finishUndo.length - 1]
    if (!last) return
    restoreSnapshot(s.profile, last.profile)
    const keep = s.selectedHandle !== null && s.selectedHandle < last.handles.length
    set({ handles: last.handles, holes: last.holes, fluting: last.fluting, finishUndo: s.finishUndo.slice(0, -1), selectedHandle: keep ? s.selectedHandle : null })
  },

  // a alça nova já aparece selecionada, com os pontos de controle
  addHole: (hole) => set((s) => ({ holes: [...s.holes, hole] })),
  setFluting: (fluting) => set({ fluting }),
  setFinishParams: (patch) => set(patch),

  addHandle: (handle) =>
    set((s) => ({ handles: [...s.handles, handle], selectedHandle: s.handles.length, finishTool: null })),

  updateHandle: (index, handle) =>
    set((s) => ({ handles: s.handles.map((h, i) => (i === index ? handle : h)) })),

  removeHandle: (index) =>
    set((s) => ({ handles: s.handles.filter((_, i) => i !== index), selectedHandle: null })),

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
    setClayMarks(null)
    resetHydration()
    set((s) => ({
      profile: createBallProfile(),
      pieceId: s.pieceId + 1,
      undoStack: [],
      prep: initialPrep(),
      marks: null,
      sponge: 'off',
      clayDrying: false,
      crackle: null,
      ...emptyFinishing(),
      deliveredTo: null,
      paint: { ...s.paint, side: 'outer', hasPaint: false, stampsUsed: [], bandsUsed: false },
      // "Fazer outra peça" volta para o preparo da argila
      phase: 'prep',
      resumePhase: null,
    }))
  },

  // apaga a pintura e volta para o torno (a forma da peça continua a mesma)
  backToModeling: () => {
    clearSurfaces()
    clearPaintHistory()
    set((s) => ({ paint: { ...s.paint, side: 'outer', hasPaint: false, stampsUsed: [], bandsUsed: false }, phase: 'modeling' }))
  },

  updatePaint: (patch) => set((s) => ({ paint: { ...s.paint, ...patch } })),
  setFinish: (finish) => set({ finish }),
  setPreviews: (previews) => set({ previews }),

  setLang: (lang) => {
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    set((s) => ({ settings: { ...s.settings, lang } }))
  },

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  setSpaceHeld: (held) =>
    set((s) => (s.wheelInput.space === held ? s : { wheelInput: { ...s.wheelInput, space: held } })),
  setPedal: (value) => set((s) => ({ wheelInput: { ...s.wheelInput, pedal: value } })),
  setWheelSpeed: (wheelSpeed) => set({ wheelSpeed }),
  setQuality: (quality) => set({ quality }),
  showToast: (key) => set((s) => ({ toast: { key, id: (s.toast?.id ?? 0) + 1 } })),
  setOptionsOpen: (optionsOpen) => set({ optionsOpen }),

  setVillage: (patch) => set((s) => ({ village: { ...s.village, ...patch } })),
  setVisit: (visit) => set({ visit }),
  setNextKnock: (nextKnockAt) => set({ nextKnockAt }),
  setDeliveredTo: (deliveredTo) => set({ deliveredTo }),
  setOrderOpen: (orderOpen) => set({ orderOpen }),
  setShopOpen: (shopOpen) => set({ shopOpen }),

  addCoins: (amount) => set((s) => ({ coins: Math.max(0, s.coins + amount) })),
  buyItem: (id, price) => {
    const s = get()
    if (s.purchases.includes(id) || s.coins < price) return false
    set({ coins: s.coins - price, purchases: [...s.purchases, id] })
    return true
  },
  putOnShelf: (piece) =>
    set((s) => {
      const i = s.shelf.findIndex((p) => p.id === piece.id)
      if (i < 0) return { shelf: [...s.shelf, piece] }
      const shelf = s.shelf.slice()
      shelf[i] = piece
      return { shelf }
    }),
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
