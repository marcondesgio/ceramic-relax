import {
  BASE_THICKNESS,
  H_MAX,
  H_MIN,
  PROFILE_SAMPLES,
  R_MAX,
  R_MIN,
  WALL,
  computeClayVolume,
  maxMouthDepth,
  sampleY,
  type Profile,
} from './profile'

// Funções puras de deformação. Cada uma muda o perfil e incrementa `version`.

const SIGMA = 0.15 // largura da queda gaussiana (unidades de mundo)

const smooth01 = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Raio externo mínimo: com a boca aberta a parede precisa caber */
function minRadius(p: Profile, y: number) {
  const insideMouth = p.mouthDepth > 0.02 && y > p.height - p.mouthDepth - 0.1
  return insideMouth ? Math.max(R_MIN, WALL + 0.1) : R_MIN
}

/**
 * Empurra (amount < 0, afinar) ou puxa (amount > 0, alargar) o raio em volta da altura `y`.
 * Retorna true se encostou no limite (para a argila "tremer").
 */
export function deformRadius(p: Profile, y: number, amount: number) {
  let hitLimit = false
  const inv2s2 = 1 / (2 * SIGMA * SIGMA)
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const dy = sampleY(p, i) - y
    const w = Math.exp(-dy * dy * inv2s2)
    if (w < 0.002) continue
    const r = p.radii[i]
    const rMin = minRadius(p, sampleY(p, i))
    // freio suave perto dos limites: nunca cria degraus
    const brake = amount < 0 ? smooth01(rMin, rMin + 0.12, r) : 1 - smooth01(R_MAX - 0.15, R_MAX, r)
    if (brake < 0.15 && w > 0.5) hitLimit = true
    p.radii[i] = Math.min(R_MAX, Math.max(rMin, r + amount * w * brake))
  }
  p.version++
  return hitLimit
}

/**
 * Estica (dh > 0) ou achata (dh < 0) a peça inteira.
 * Os raios mudam por √(H/H') para manter o volume (V ∝ r²·H).
 */
export function stretch(p: Profile, dh: number) {
  const newH = Math.min(H_MAX, Math.max(H_MIN, p.height + dh))
  if (Math.abs(newH - p.height) < 1e-5) return
  const k = Math.sqrt(p.height / newH)
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    p.radii[i] = Math.min(R_MAX, Math.max(R_MIN, p.radii[i] * k))
  }
  // a boca acompanha a proporção da peça
  p.mouthDepth = Math.min(maxMouthDepth({ ...p, height: newH }), p.mouthDepth * (newH / p.height))
  p.height = newH
  p.version++
}

/** Aprofunda a boca em `amount` (limitada pelo fundo mínimo) */
export function deepenMouth(p: Profile, amount: number) {
  const next = Math.min(maxMouthDepth(p), p.mouthDepth + amount)
  if (next - p.mouthDepth < 1e-5) return
  p.mouthDepth = next
  p.version++
}

/**
 * Conservação aproximada de volume: ajusta a altura aos poucos
 * para que o volume de argila volte ao valor alvo.
 * Afinar embaixo → a peça cresce; alargar → a peça baixa.
 */
export function relaxVolume(p: Profile, dt: number) {
  const v = computeClayVolume(p)
  if (v <= 0) return
  const ratio = p.clayVolume / v
  if (Math.abs(ratio - 1) < 0.002) return
  const wanted = p.height * ratio
  const goalH = Math.min(H_MAX, Math.max(H_MIN, wanted))
  // no limite de altura aceitamos a perda: o novo volume vira o alvo
  if (goalH !== wanted) p.clayVolume = v * (goalH / p.height)
  const newH = p.height + (goalH - p.height) * Math.min(1, dt * 6)
  if (Math.abs(newH - p.height) < 1e-5) return
  p.mouthDepth = Math.min(Math.max(0, newH - BASE_THICKNESS), p.mouthDepth * (newH / p.height))
  p.height = newH
  p.version++
}

/** Suavização leve (Laplaciana): torno rápido deixa a superfície mais uniforme */
export function smoothProfile(p: Profile, strength: number) {
  if (strength <= 0) return
  const k = Math.min(0.5, strength)
  const r = p.radii
  let prev = r[0]
  for (let i = 1; i < PROFILE_SAMPLES - 1; i++) {
    const cur = r[i]
    r[i] = cur + k * ((prev + r[i + 1]) / 2 - cur)
    prev = cur
  }
  p.version++
}
