import { PROFILE_SAMPLES, R_MAX, sampleY, type Profile } from './profile'
import type { CrackleRecipe } from '../store/persistence'

// Hidratação da argila no torno. A umidade nunca aparece como número: só pela aparência
// (cor, brilho, fissuras). Cada amostra de altura do perfil tem sua umidade e suas fissuras.
//   1 = úmida (ponto ideal) · < 0,55 secando (clara e opaca) · < 0,25 seca (surgem fissuras)
//   > 1,15 água demais (a parede cede um pouquinho, nada desaba)

export const MOIST_START = 1
export const MOIST_DRYING = 0.55
export const MOIST_DRY = 0.25
export const MOIST_SOAKED = 1.15
const MOIST_MAX = 1.6

/** Secagem por segundo: torno parado ~2 min até secar, torno no máximo ~45 s */
const DRY_BASE = 0.006
const DRY_SPIN = 0.01
/** Água demais evapora mais rápido até voltar ao ponto */
const EXCESS_DRY = 0.05
/** Esponja: quanto molha por segundo no centro do toque, e a largura do toque */
const WET_RATE = 0.55
const WET_SIGMA = 0.3
/** Fissuras: crescem com a argila seca e somem ao hidratar a tempo */
const CRACK_GROW = 0.12
const CRACK_HEAL = 0.6
/** Parede cedendo com água demais (unidades de raio por segundo) */
const SAG_RATE = 0.012
/** Fissura mínima que fica registrada na peça */
const CRACK_RECORD_MIN = 0.05

export const hydrationRuntime = {
  moisture: new Float32Array(PROFILE_SAMPLES).fill(MOIST_START),
  cracks: new Float32Array(PROFILE_SAMPLES),
  /** sobe sempre que a umidade muda (o salvamento automático regrava) */
  revision: 0,
}

/** Peça nova: argila úmida e lisinha */
export function resetHydration() {
  hydrationRuntime.moisture.fill(MOIST_START)
  hydrationRuntime.cracks.fill(0)
  hydrationRuntime.revision++
}

export function restoreHydration(moisture: number[], cracks: number[]) {
  if (moisture.length !== PROFILE_SAMPLES || cracks.length !== PROFILE_SAMPLES) return
  hydrationRuntime.moisture.set(moisture)
  hydrationRuntime.cracks.set(cracks)
  hydrationRuntime.revision++
}

/** Valor de um dos arrays numa altura qualquer da peça (interpolado) */
export function sampleAt(arr: Float32Array | number[], p: Profile, y: number) {
  const f = Math.min(Math.max(y / p.height, 0), 1) * (PROFILE_SAMPLES - 1)
  const i = Math.min(Math.floor(f), PROFILE_SAMPLES - 2)
  const k = f - i
  return arr[i] * (1 - k) + arr[i + 1] * k
}

const smooth01 = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * Quanto a argila cede às mãos numa altura: seca fica "dura" (até 55%),
 * úmida é o normal, com água demais fica um pouco mais mole.
 */
export function clayGive(p: Profile, y: number) {
  const m = sampleAt(hydrationRuntime.moisture, p, y)
  if (m <= 1) return 0.55 + 0.45 * smooth01(0.1, 0.8, m)
  return 1 + 0.25 * Math.min(1, (m - 1) / 0.4)
}

/**
 * Secagem de um quadro: mais rápida com o torno rápido e onde a parede é fina.
 * Fissuras crescem onde secou e somem onde voltou a ficar úmida.
 * Com água demais a parede cede de leve. Retorna true se o perfil mudou.
 */
export function stepDrying(p: Profile, dt: number, wheelSpeed: number) {
  const { moisture, cracks } = hydrationRuntime
  let sagged = false
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const r = p.radii[i]
    const thin = 1 - smooth01(0.25, 0.85, r)
    let m = moisture[i]
    m -= (DRY_BASE + DRY_SPIN * wheelSpeed) * (1 + 0.8 * thin) * dt
    if (m > 1) m -= EXCESS_DRY * (m - 1) * dt * 4
    m = Math.max(0, m)
    moisture[i] = m

    if (m < MOIST_DRY) cracks[i] = Math.min(1, cracks[i] + (0.15 + (MOIST_DRY - m) / MOIST_DRY) * CRACK_GROW * dt)
    else if (m >= MOIST_DRYING) cracks[i] = Math.max(0, cracks[i] - CRACK_HEAL * dt)

    // água demais: a parede "escorrega" para fora; a conservação de volume abaixa a peça
    if (m > MOIST_SOAKED && sampleY(p, i) > 0.05) {
      p.radii[i] = Math.min(R_MAX, r + SAG_RATE * Math.min(1, (m - MOIST_SOAKED) / 0.3) * dt)
      sagged = true
    }
  }
  hydrationRuntime.revision++
  if (sagged) p.version++
  return sagged
}

/** Esponja apertada numa altura: molha com queda suave em volta */
export function wetAt(p: Profile, y: number, amount: number) {
  const { moisture } = hydrationRuntime
  const inv = 1 / (2 * WET_SIGMA * WET_SIGMA)
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const dy = sampleY(p, i) - y
    const w = Math.exp(-dy * dy * inv)
    if (w < 0.01) continue
    moisture[i] = Math.min(MOIST_MAX, moisture[i] + WET_RATE * amount * w)
  }
  hydrationRuntime.revision++
}

/** A argila já está visivelmente secando em algum lugar (para a dica da esponja) */
export function isDrying() {
  const { moisture } = hydrationRuntime
  for (let i = 0; i < PROFILE_SAMPLES; i++) if (moisture[i] < MOIST_DRYING) return true
  return false
}

/**
 * Fissuras da peça ao sair do torno: viram craquelado no forno (null = sem fissuras).
 * `joints`: alguma alça foi colada com a peça seca (a fissura fica na junção da alça).
 */
export function recordCrackle(joints = false): CrackleRecipe | null {
  const amount = Array.from(hydrationRuntime.cracks, (c) => (c >= CRACK_RECORD_MIN ? Math.round(c * 100) / 100 : 0))
  if (!joints && !amount.some((c) => c > 0)) return null
  return { amount, seed: Math.floor(Math.random() * 1000), kintsugi: false }
}

// inspeção pelo console durante o desenvolvimento
if (import.meta.env.DEV) Object.assign(window, { __hydration: hydrationRuntime })
