// Perfil da peça: 64 raios (um por faixa de altura) + altura total + profundidade da boca.
// Todas as medidas estão em unidades de mundo (1 unidade ≈ 10 cm).

export const PROFILE_SAMPLES = 64

export const WALL = 0.14 // espessura da parede quando a boca está aberta
export const R_MIN = 0.22 // raio externo mínimo: abaixo disso a peça "quebraria"
export const R_MAX = 1.4 // não passa da borda da cabeça do torno
export const H_MIN = 0.35
export const H_MAX = 3.2
export const BASE_THICKNESS = 0.16 // fundo mínimo que sobra embaixo da boca
const INNER_MIN = 0.06 // raio interno mínimo da cavidade
const CAVITY_WEIGHT = 0.3

export interface Profile {
  radii: Float32Array
  height: number
  mouthDepth: number
  /** quantidade de argila que o volume tenta conservar */
  clayVolume: number
  /** muda a cada deformação; a malha só se atualiza quando muda */
  version: number
}

export interface ProfileSnapshot {
  radii: Float32Array
  height: number
  mouthDepth: number
}

/** Bola de argila inicial: um montinho arredondado, mais largo no meio */
export function createBallProfile(): Profile {
  const radii = new Float32Array(PROFILE_SAMPLES)
  const R = 0.85
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const t = i / (PROFILE_SAMPLES - 1)
    radii[i] = R * (0.9 + 0.2 * Math.sin(Math.PI * t)) * Math.sqrt(1 - 0.78 * t ** 3)
  }
  const profile: Profile = { radii, height: 1.25, mouthDepth: 0, clayVolume: 0, version: 0 }
  profile.clayVolume = computeClayVolume(profile)
  return profile
}

export function snapshotOf(p: Profile): ProfileSnapshot {
  return { radii: p.radii.slice(), height: p.height, mouthDepth: p.mouthDepth }
}

export function restoreSnapshot(p: Profile, s: ProfileSnapshot) {
  p.radii.set(s.radii)
  p.height = s.height
  p.mouthDepth = s.mouthDepth
  p.clayVolume = computeClayVolume(p)
  p.version++
}

/** Altura (y local) da amostra i */
export function sampleY(p: Profile, i: number) {
  return (p.height * i) / (PROFILE_SAMPLES - 1)
}

/** Raio externo interpolado em uma altura qualquer */
export function outerRadiusAt(p: Profile, y: number) {
  const f = Math.min(Math.max(y / p.height, 0), 1) * (PROFILE_SAMPLES - 1)
  const i = Math.min(Math.floor(f), PROFILE_SAMPLES - 2)
  const k = f - i
  return p.radii[i] * (1 - k) + p.radii[i + 1] * k
}

export function innerRadiusAt(p: Profile, y: number) {
  return Math.max(INNER_MIN, outerRadiusAt(p, y) - WALL)
}

export function maxMouthDepth(p: Profile) {
  return Math.max(0, p.height - BASE_THICKNESS)
}

/**
 * Volume de argila = sólido externo − parte da cavidade (integração simples).
 * A cavidade pesa só 30%: ao abrir a boca, boa parte da argila vai para o fundo e
 * as paredes, então a peça sobe um pouco, sem disparar de altura.
 */
export function computeClayVolume(p: Profile) {
  const dy = p.height / (PROFILE_SAMPLES - 1)
  let outer = 0
  for (let i = 0; i < PROFILE_SAMPLES - 1; i++) {
    const a = p.radii[i]
    const b = p.radii[i + 1]
    outer += Math.PI * ((a * a + b * b) / 2) * dy
  }
  let cavity = 0
  if (p.mouthDepth > 0.001) {
    const steps = 16
    const cdy = p.mouthDepth / steps
    for (let j = 0; j < steps; j++) {
      const r = innerRadiusAt(p, p.height - (j + 0.5) * cdy)
      cavity += Math.PI * r * r * cdy
    }
  }
  return outer - cavity * CAVITY_WEIGHT
}

// ---------- pontos do contorno para as malhas de revolução ----------

const RIM_HALF = 4 // pontos de cada metade da borda arredondada
const INNER_WALL = 24
const INNER_FLOOR = 8

/** Quantidade fixa de pontos: a topologia nunca muda, só as posições */
export const OUTER_POINT_COUNT = 2 + PROFILE_SAMPLES + RIM_HALF
export const INNER_POINT_COUNT = 1 + RIM_HALF + INNER_WALL + INNER_FLOOR

const smooth01 = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** O quanto a boca ainda está "fechada" (1 = bola fechada, 0 = boca aberta) */
function closedness(p: Profile) {
  return 1 - smooth01(0, 0.22, p.mouthDepth)
}

function rimGeometry(p: Profile) {
  const rTop = p.radii[PROFILE_SAMPLES - 1]
  const half = WALL / 2
  // com a boca fechada a borda fica mais baixinha, quase sumindo no domo
  const lift = 1 - 0.6 * closedness(p)
  return { center: rTop - half, half, lift }
}

/**
 * Parede externa: fundo (centro → borda) → lateral de baixo para cima → meia borda.
 * Escreve pares (r, y) em `out`.
 */
export function writeOuterPoints(p: Profile, out: Float32Array) {
  let k = 0
  const push = (r: number, y: number) => {
    out[k++] = r
    out[k++] = y
  }
  push(0, 0)
  push(p.radii[0] * 0.95, 0)
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    // a primeira amostra sobe um pouquinho para arredondar o pé
    const y = i === 0 ? 0.025 : sampleY(p, i)
    push(p.radii[i], y)
  }
  const rim = rimGeometry(p)
  for (let j = 1; j <= RIM_HALF; j++) {
    const a = (j / RIM_HALF) * (Math.PI / 2)
    push(rim.center + rim.half * Math.cos(a), p.height + rim.half * Math.sin(a) * rim.lift)
  }
}

/**
 * Parede interna: meia borda → descida pela cavidade → fundo até o centro.
 * Com a boca fechada, os mesmos pontos formam um domo suave no topo;
 * conforme a boca abre, o domo "afunda" até virar a cavidade.
 */
export function writeInnerPoints(p: Profile, out: Float32Array) {
  let k = 0
  const push = (r: number, y: number) => {
    out[k++] = r
    out[k++] = y
  }
  const rim = rimGeometry(p)
  const H = p.height
  // continua a borda a partir do topo (ângulo 90°) até o lado de dentro (180°)
  for (let j = 0; j <= RIM_HALF; j++) {
    const a = Math.PI / 2 + (j / RIM_HALF) * (Math.PI / 2)
    push(rim.center + rim.half * Math.cos(a), H + rim.half * Math.sin(a) * rim.lift)
  }

  const c = closedness(p)
  const d = Math.min(p.mouthDepth, maxMouthDepth(p))
  const rInnerTop = rim.center - rim.half
  const total = INNER_WALL + INNER_FLOOR
  const bulge = Math.min(0.12, rInnerTop * 0.45)
  const floorY = H - d
  const floorR = innerRadiusAt(p, floorY)

  for (let j = 1; j <= total; j++) {
    const s = j / total
    // ponto da cavidade aberta
    let cr: number
    let cy: number
    if (j <= INNER_WALL) {
      const t = j / INNER_WALL
      cy = H - d * t
      // perto do topo, encosta suavemente no raio da borda
      cr = Math.min(innerRadiusAt(p, cy), rInnerTop + (1 - t) * 0.02)
    } else {
      const u = (j - INNER_WALL) / INNER_FLOOR
      cr = floorR * (1 - u)
      cy = floorY + 0.05 * (1 - u) ** 3 * Math.min(1, d * 4)
    }
    // ponto do domo fechado
    const dr = rInnerTop * (1 - s)
    const dy = H + bulge * (1 - (1 - s) ** 2)
    push(cr + (dr - cr) * c, cy + (dy - cy) * c)
  }
}
