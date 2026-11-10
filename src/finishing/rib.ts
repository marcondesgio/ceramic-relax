import { PROFILE_SAMPLES, R_MIN, WALL, type Profile } from '../pottery/profile'

// Ripador horizontal: sulcos em anéis ao redor da peça, feitos ondulando o próprio perfil
// (sem malha nem textura extra). O ripador é um "pente": cada toque cava alguns sulcos
// paralelos em volta da altura tocada, mais fundos no meio.

/** Distância entre sulcos, em amostras do perfil (abaixo de 4 o perfil não desenha bem) */
const PERIOD = 4
/** Largura do pente (desvio da queda gaussiana, em amostras): ~4 sulcos por toque */
const WIDTH = 5
/** Profundidade máxima de um sulco em relação às cristas vizinhas */
export const RIB_MAX_DEPTH = 0.045

function minRadius(p: Profile) {
  return p.mouthDepth > 0.02 ? Math.max(R_MIN, WALL + 0.1) : R_MIN
}

/**
 * Cava os sulcos em volta da altura `y`. Os sulcos ficam presos à grade do perfil
 * (múltiplos de PERIOD), então passar de novo aprofunda os mesmos anéis.
 * Retorna true quando o sulco do meio chegou na profundidade máxima.
 */
export function ribRings(p: Profile, y: number, amount: number) {
  const n = PROFILE_SAMPLES
  const f = (y / p.height) * (n - 1)
  const c = Math.min(n - 3, Math.max(2, Math.round(f / PERIOD) * PERIOD))
  const r = p.radii
  const ridge = (r[c - 2] + r[c + 2]) / 2
  if (ridge - r[c] >= RIB_MAX_DEPTH) return true
  const rMin = minRadius(p)
  const inv = 1 / (2 * WIDTH * WIDTH)
  for (let i = 1; i < n; i++) {
    const d = i - c
    const w = Math.exp(-d * d * inv)
    if (w < 0.02) continue
    // 1 no fundo do sulco, 0 na crista
    const groove = 0.5 + 0.5 * Math.cos((2 * Math.PI * d) / PERIOD)
    r[i] = Math.max(rMin, r[i] - amount * w * groove)
  }
  p.version++
  return false
}
