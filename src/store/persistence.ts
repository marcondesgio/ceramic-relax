import type { ClayMarks } from '../prep/prep'
import type { Finish, PaintState, Phase, Settings, VillageProgress } from './useGameStore'

// Camada de salvamento: só lê e grava, sem regra de jogo.
// O resto do jogo conversa com a interface `GameStorage`; hoje ela é implementada com
// IndexedDB (no próprio aparelho). Para trocar por Supabase, basta outro adaptador
// com os mesmos métodos (tabelas para jogador/peças/rascunho e Storage para os PNGs).

/** Versão do formato das receitas: sobe quando um campo muda de sentido (permite migrar) */
export const RECIPE_VERSION = 1

// ---------- receita da peça ----------

/** Forma da peça: o mesmo perfil do torno (ver pottery/profile.ts) */
export interface ProfileRecipe {
  radii: number[]
  height: number
  mouthDepth: number
  /** quantidade de argila que o volume tenta conservar */
  clayVolume: number
}

/** Furo da espátula: tipo da ponta e posição no mapa do torno (U = ângulo, V = altura) */
export interface HoleRecipe {
  shape: 'round' | 'star' | 'heart' | 'drop'
  u: number
  v: number
  size: number
}

/** Alça pré-moldada presa na lateral, ajustada pelos 3 pontos de controle */
export interface HandleRecipe {
  shape: 'ring' | 'ear' | 'double' | 'tall'
  /** ângulo em volta da peça (0 a 1) e altura do centro da alça (0 a 1 da altura da peça) */
  u: number
  v: number
  /** distância entre as duas junções (0 a 1 da altura da peça) */
  height: number
  /** abertura: o quanto a alça se afasta da parede (unidades de mundo) */
  opening: number
  /** espessura: raio do rolinho de argila (unidades de mundo) */
  thickness: number
  /** fissura na junção (peça seca demais ao colar): vira craquelado no forno */
  joint?: number
}

/** Fissuras da argila seca que viram craquelado no forno */
export interface CrackleRecipe {
  /** intensidade por amostra de altura do perfil (0 = lisa, 1 = bem craquelada) */
  amount: number[]
  /** semente das linhas irregulares (o mesmo desenho ao recarregar) */
  seed: number
  /** restaurada com ouro */
  kintsugi: boolean
}

export interface PieceRecipe {
  version: number
  id: string
  createdAt: number
  profile: ProfileRecipe
  /** pintura de cada lado como PNG 1024×1024 com transparência (null = sem tinta) */
  paint: { outer: Blob | null; inner: Blob | null; handle?: Blob | null }
  /** marquinhas das bolhas que sobraram no preparo (ausente nas receitas de antes do preparo) */
  marks?: ClayMarks | null
  /** acabamento escolhido no forno */
  finish: Finish
  /** espaçamento do ripado vertical (null = sem ripado); o horizontal já está no perfil */
  fluting: { spacing: number } | null
  holes: HoleRecipe[]
  handles: HandleRecipe[]
  crackle: CrackleRecipe | null
  /** nome do bichinho que recebeu a peça (null = peça livre) */
  recipient: string | null
}

// ---------- jogador e rascunho ----------

export interface PlayerData {
  settings: Settings
  coins: number
  /** ids dos itens comprados na lojinha */
  purchases: string[]
  /** vila dos bichinhos (ausente nos saves de antes da vila) */
  village?: VillageProgress
}

/** Peça em andamento: tudo o que é preciso para continuar de onde parou */
export interface Draft {
  piece: PieceRecipe
  /** última fase de trabalho (nunca a tela inicial) */
  phase: Exclude<Phase, 'home'>
  paint: PaintState
  /** umidade e fissuras ao vivo no torno, por altura (ausente nos rascunhos antigos) */
  hydration?: { moisture: number[]; cracks: number[] }
  savedAt: number
}

export interface GameStorage {
  loadPlayer(): Promise<PlayerData | null>
  savePlayer(data: PlayerData): Promise<void>
  /** prateleira: peças prontas, da mais antiga para a mais nova */
  loadPieces(): Promise<PieceRecipe[]>
  /** grava ou substitui (mesmo id) uma peça da prateleira */
  savePiece(piece: PieceRecipe): Promise<void>
  loadDraft(): Promise<Draft | null>
  saveDraft(draft: Draft): Promise<void>
  clearDraft(): Promise<void>
}

// ---------- adaptador IndexedDB ----------

const DB_NAME = 'ceramic-relax'
const DB_VERSION = 1
const PLAYER = 'player'
const PIECES = 'pieces'
const DRAFT = 'draft'
// os registros únicos (jogador, rascunho) ficam sempre nesta chave
const ONLY = 'current'

function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PLAYER)) db.createObjectStore(PLAYER)
      if (!db.objectStoreNames.contains(PIECES)) db.createObjectStore(PIECES, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(DRAFT)) db.createObjectStore(DRAFT)
    }
    req.onsuccess = () => {
      const db = req.result
      // outra aba com versão nova do jogo: fecha para não travar a atualização dela
      db.onversionchange = () => db.close()
      resolve(db)
    }
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('indexeddb-blocked'))
  })
}

export function createIndexedDbStorage(): GameStorage {
  let dbPromise: Promise<IDBDatabase> | null = null
  const db = () => (dbPromise ??= openDb())

  async function get<T>(store: string, key: IDBValidKey) {
    const tx = (await db()).transaction(store, 'readonly')
    return (await request(tx.objectStore(store).get(key))) as T | undefined
  }

  async function put(store: string, value: unknown, key?: IDBValidKey) {
    const tx = (await db()).transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  async function remove(store: string, key: IDBValidKey) {
    const tx = (await db()).transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  return {
    async loadPlayer() {
      return (await get<PlayerData>(PLAYER, ONLY)) ?? null
    },
    savePlayer: (data) => put(PLAYER, data, ONLY),
    async loadPieces() {
      const tx = (await db()).transaction(PIECES, 'readonly')
      const all = (await request(tx.objectStore(PIECES).getAll())) as PieceRecipe[]
      return all.sort((a, b) => a.createdAt - b.createdAt)
    },
    savePiece: (piece) => put(PIECES, piece),
    async loadDraft() {
      return (await get<Draft>(DRAFT, ONLY)) ?? null
    },
    saveDraft: (draft) => put(DRAFT, draft, ONLY),
    clearDraft: () => remove(DRAFT, ONLY),
  }
}

/** Sem armazenamento (aba anônima antiga, erro no banco): o jogo segue só na sessão */
export function createSessionOnlyStorage(): GameStorage {
  return {
    loadPlayer: async () => null,
    savePlayer: async () => {},
    loadPieces: async () => [],
    savePiece: async () => {},
    loadDraft: async () => null,
    saveDraft: async () => {},
    clearDraft: async () => {},
  }
}
