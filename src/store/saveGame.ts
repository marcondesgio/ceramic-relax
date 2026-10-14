import i18n from '../i18n'
import { PROFILE_SAMPLES, restoreSnapshot, type Profile } from '../pottery/profile'
import { exportSurface, getSurface, importSurface, type SurfaceId } from '../paint/paintSurface'
import { hydrationRuntime, restoreHydration } from '../pottery/hydration'
import { defaultSettings, useGameStore, type Settings } from './useGameStore'
import type { AnimalId } from '../village/animals'
import {
  RECIPE_VERSION,
  createIndexedDbStorage,
  createSessionOnlyStorage,
  type Draft,
  type GameStorage,
  type PieceRecipe,
} from './persistence'

// Liga o jogo à camada de salvamento (persistence.ts):
// - hidratação: antes da primeira tela, carrega configurações, moedinhas, itens, prateleira
//   e a peça em andamento;
// - salvamento automático: a peça em andamento é regravada sempre que muda (a cada poucos
//   segundos e ao trocar de fase ou sair da aba); a peça pronta vai para a prateleira.

const LOAD_TIMEOUT = 2500 // ms: banco travado não pode segurar a abertura do jogo
const DRAFT_INTERVAL = 3000 // ms entre conferências de mudança na peça
const PLAYER_DELAY = 400 // ms: junta várias mudanças seguidas (ex.: arrastar o volume)

// chaves antigas do localStorage (antes desta camada), migradas uma vez
const LEGACY_SETTINGS = 'ceramic-relax:settings'
const LEGACY_LANG = 'ceramic-relax:lang'

let storage: GameStorage = createSessionOnlyStorage()

/** Peça em andamento: id estável (o mesmo no rascunho e na prateleira) */
const piece = {
  id: newId(),
  createdAt: Date.now(),
  /** última fase de trabalho; null enquanto não há peça começada para salvar */
  phase: null as Draft['phase'] | null,
}

/** O que já está gravado no rascunho (para só regravar o que mudou) */
const savedState = { profile: null as Profile | null, version: -1, outer: -1, inner: -1, handle: -1, hydration: -1 }
let draftDirty = false

// PNGs da pintura já codificados, por revisão do canvas (só recodifica o lado que mudou)
const blobCache: Partial<Record<SurfaceId, { revision: number; blob: Blob | null }>> = {}

// gravações em fila, na ordem em que foram pedidas (apagar o rascunho nunca passa na frente)
let chain: Promise<unknown> = Promise.resolve()
function enqueue(task: () => Promise<void>) {
  const run = chain.then(task)
  chain = run.catch(() => {})
  return run
}

// crypto.randomUUID só existe em https/localhost; no celular pela rede local o jogo roda em http
function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function warn(what: string, error: unknown) {
  if (import.meta.env.DEV) console.warn(`[salvamento] ${what}`, error)
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        window.clearTimeout(id)
        resolve(v)
      },
      (e) => {
        window.clearTimeout(id)
        reject(e)
      },
    )
  })
}

// ---------- receita ----------

async function paintBlob(side: SurfaceId) {
  const revision = getSurface(side).revision
  const cached = blobCache[side]
  if (cached && cached.revision === revision) return cached.blob
  const blob = await exportSurface(side)
  blobCache[side] = { revision, blob }
  return blob
}

/** Receita da peça atual; null se o jogador começou outra peça enquanto a pintura codificava */
async function buildRecipe(): Promise<PieceRecipe | null> {
  const id = piece.id
  const s = useGameStore.getState()
  const p = s.profile
  // a forma é copiada antes de esperar a pintura, para as duas serem do mesmo instante
  const profile = { radii: Array.from(p.radii), height: p.height, mouthDepth: p.mouthDepth, clayVolume: p.clayVolume }
  const handles = s.handles
  const [outer, inner, handle] = await Promise.all([paintBlob('outer'), paintBlob('inner'), paintBlob('handle')])
  if (id !== piece.id) return null
  return {
    version: RECIPE_VERSION,
    id,
    createdAt: piece.createdAt,
    profile,
    paint: { outer, inner, handle },
    marks: s.marks,
    finish: s.finish,
    fluting: s.fluting,
    holes: s.holes,
    handles,
    crackle: s.crackle,
    recipient: s.deliveredTo,
  }
}

function currentState() {
  const p = useGameStore.getState().profile
  return {
    profile: p,
    version: p.version,
    outer: getSurface('outer').revision,
    inner: getSurface('inner').revision,
    handle: getSurface('handle').revision,
    hydration: hydrationRuntime.revision,
  }
}

function pieceChanged() {
  const m = currentState()
  return (
    m.profile !== savedState.profile ||
    m.version !== savedState.version ||
    m.outer !== savedState.outer ||
    m.inner !== savedState.inner ||
    m.handle !== savedState.handle ||
    m.hydration !== savedState.hydration
  )
}

// ---------- rascunho (peça em andamento) ----------

let draftBusy = false
let draftAgain = false

async function saveDraft() {
  if (!piece.phase) return
  if (draftBusy) {
    draftAgain = true
    return
  }
  draftBusy = true
  try {
    do {
      draftAgain = false
      draftDirty = false
      const state = currentState()
      const recipe = await buildRecipe()
      const phase = piece.phase
      if (!recipe || !phase) break
      const hydration = { moisture: Array.from(hydrationRuntime.moisture), cracks: Array.from(hydrationRuntime.cracks) }
      const draft: Draft = { piece: recipe, phase, paint: useGameStore.getState().paint, hydration, savedAt: Date.now() }
      await enqueue(() => storage.saveDraft(draft))
      Object.assign(savedState, state)
    } while (draftAgain)
  } catch (e) {
    warn('rascunho', e)
  } finally {
    draftBusy = false
  }
}

/** A peça saiu do forno: vai para a prateleira (o mesmo id substitui, nunca duplica) */
async function saveToShelf() {
  try {
    const recipe = await buildRecipe()
    if (!recipe) return
    await enqueue(() => storage.savePiece(recipe))
    useGameStore.getState().putOnShelf(recipe)
  } catch (e) {
    warn('prateleira', e)
  }
}

async function restoreDraft(draft: Draft) {
  const p = draft.piece.profile
  if (draft.piece.version !== RECIPE_VERSION || p.radii.length !== PROFILE_SAMPLES) return
  const s = useGameStore.getState()
  restoreSnapshot(s.profile, { radii: Float32Array.from(p.radii), height: p.height, mouthDepth: p.mouthDepth })
  s.profile.clayVolume = p.clayVolume
  s.setMarks(draft.piece.marks ?? null)
  s.setCrackle(draft.piece.crackle ?? null)
  if (draft.hydration) restoreHydration(draft.hydration.moisture, draft.hydration.cracks)
  try {
    await Promise.all([
      importSurface('outer', draft.piece.paint.outer),
      importSurface('inner', draft.piece.paint.inner),
      importSurface('handle', draft.piece.paint.handle ?? null),
    ])
  } catch (e) {
    // pintura ilegível: a forma volta mesmo assim
    warn('pintura do rascunho', e)
  }
  piece.id = draft.piece.id
  piece.createdAt = draft.piece.createdAt
  piece.phase = draft.phase
  useGameStore.setState({
    handles: draft.piece.handles ?? [],
    holes: draft.piece.holes ?? [],
    fluting: draft.piece.fluting ?? null,
    deliveredTo: (draft.piece.recipient as AnimalId | null) ?? null,
    paint: { ...s.paint, ...draft.paint },
    finish: draft.piece.finish,
    // fechou no meio da queima: a peça já sai pronta do forno
    resumePhase: draft.phase === 'firing' ? 'result' : draft.phase,
  })
}

// ---------- jogador (configurações, moedinhas, lojinha) ----------

let playerTimer = 0

function savePlayerNow() {
  window.clearTimeout(playerTimer)
  playerTimer = 0
  const { settings, coins, purchases, village } = useGameStore.getState()
  return enqueue(() => storage.savePlayer({ settings, coins, purchases, village })).catch((e) => warn('jogador', e))
}

function schedulePlayerSave() {
  window.clearTimeout(playerTimer)
  playerTimer = window.setTimeout(() => void savePlayerNow(), PLAYER_DELAY)
}

/** Configurações de antes desta camada (localStorage) */
function legacySettings(): Partial<Settings> {
  try {
    const saved = (JSON.parse(localStorage.getItem(LEGACY_SETTINGS) ?? 'null') ?? {}) as Partial<Settings>
    const lang = localStorage.getItem(LEGACY_LANG)
    return lang === 'pt' || lang === 'en' ? { ...saved, lang } : saved
  } catch {
    return {}
  }
}

function forgetLegacy() {
  try {
    localStorage.removeItem(LEGACY_SETTINGS)
    localStorage.removeItem(LEGACY_LANG)
  } catch {
    /* ignora */
  }
}

// ---------- abertura ----------

/**
 * Carrega o jogo salvo antes da primeira tela. Se o armazenamento falhar ou demorar,
 * o jogo abre do zero e segue só na sessão (sem sobrescrever o que estiver salvo).
 */
export async function hydrate() {
  try {
    const db = createIndexedDbStorage()
    const [player, pieces, draft] = await withTimeout(
      Promise.all([db.loadPlayer(), db.loadPieces(), db.loadDraft()]),
      LOAD_TIMEOUT,
    )
    storage = db

    const settings = { ...defaultSettings(), ...(player ? player.settings : legacySettings()) }
    useGameStore.setState({
      settings,
      coins: player?.coins ?? 0,
      purchases: player?.purchases ?? [],
      ...(player?.village ? { village: player.village } : {}),
      shelf: pieces,
    })
    if (settings.lang !== i18n.language) useGameStore.getState().setLang(settings.lang)
    if (!player) {
      // primeira vez com esta camada: leva as configurações antigas para o banco
      await savePlayerNow()
      forgetLegacy()
    }
    if (draft) await restoreDraft(draft)
  } catch (e) {
    storage = createSessionOnlyStorage()
    warn('indisponível, seguindo só na sessão', e)
  }
  Object.assign(savedState, currentState())
}

/** Liga o salvamento automático (chamar depois de `hydrate`) */
export function startAutosave() {
  useGameStore.subscribe((s, prev) => {
    if (s.settings !== prev.settings || s.coins !== prev.coins || s.purchases !== prev.purchases || s.village !== prev.village) {
      schedulePlayerSave()
    }
    // peça nova: novo id e o rascunho anterior some
    if (s.pieceId !== prev.pieceId) {
      piece.id = newId()
      piece.createdAt = Date.now()
      piece.phase = null
      enqueue(() => storage.clearDraft()).catch((e) => warn('apagar rascunho', e))
    }
    if (s.phase !== prev.phase && s.phase !== 'home') {
      piece.phase = s.phase
      void saveDraft()
      if (s.phase === 'result') void saveToShelf()
    }
    if (s.paint !== prev.paint || s.finish !== prev.finish || s.marks !== prev.marks || s.handles !== prev.handles || s.holes !== prev.holes || s.fluting !== prev.fluting) {
      draftDirty = true
    }
    // kintsugi ou entrega no resultado: a peça da prateleira é atualizada (mesmo id)
    if (s.crackle !== prev.crackle || s.deliveredTo !== prev.deliveredTo) {
      draftDirty = true
      if (s.phase === 'result' && prev.phase === 'result') void saveToShelf()
    }
  })

  window.setInterval(() => {
    if (piece.phase && (draftDirty || pieceChanged())) void saveDraft()
  }, DRAFT_INTERVAL)

  // fechando ou trocando de aba: grava o que estiver pendente
  const flush = () => {
    if (playerTimer) void savePlayerNow()
    if (piece.phase && (draftDirty || pieceChanged())) void saveDraft()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
}
