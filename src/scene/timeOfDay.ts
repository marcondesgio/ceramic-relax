import { Color, MathUtils } from 'three'
import type { Phase } from '../store/useGameStore'

// Ciclo do dia ligado às fases: modelar leva a manhã, pintar vai até o fim da tarde
// e a queima atravessa o anoitecer. Dá a sensação de que fazer cerâmica leva tempo.
//
// O tempo é um número que só anda para a frente: 0 = amanhecer, 1 = entardecer,
// 2 = noite, 3 = amanhecer de novo (e volta a 0). Assim a noite vira manhã sem
// "voltar" pela tarde quando o jogador faz outra peça.

export interface TimePalette {
  skyTop: Color
  skyBottom: Color
  sun: Color
  sunGlow: Color
  /** posição do sol na janela (-1 a 1 em x e y) */
  sunX: number
  sunY: number
  moon: number // 0 a 1
  stars: number // 0 a 1
  mountains: Color
  hillFar: Color
  hillMid: Color
  hillNear: Color
  tree: Color
  trunk: Color
  house: Color
  roof: Color
  houseLight: number // janelinha da casa acesa (0 a 1)
  cloud: Color
  cloudOpacity: number
  birds: number // 0 a 1
  // luz do ateliê
  hemiSky: Color
  hemiGround: Color
  hemiIntensity: number
  sunLight: Color
  sunIntensity: number
  sunLightX: number
  sunLightY: number
  fill: Color
  fillIntensity: number
  lamp: number // abajur quente à noite (0 a 1)
  beam: Color
  beamOpacity: number
  background: Color
}

type Preset = { [K in keyof TimePalette]: TimePalette[K] extends Color ? string : number }

const DAWN: Preset = {
  skyTop: '#C9D6F2',
  skyBottom: '#FFD6C9',
  sun: '#FFE7B5',
  sunGlow: '#FFD0C4',
  sunX: -0.45,
  sunY: 0.36, // acima das montanhas, ainda baixo
  moon: 0,
  stars: 0,
  mountains: '#D3CCEB',
  hillFar: '#C5DCC0',
  hillMid: '#B5D2AD',
  hillNear: '#A3C59A',
  tree: '#9EC294',
  trunk: '#C99A6E',
  house: '#FBF3E4',
  roof: '#F4A08E',
  houseLight: 0,
  cloud: '#FFF1EC',
  cloudOpacity: 0.95,
  birds: 1,
  hemiSky: '#FFEDE6',
  hemiGround: '#E8CDB0',
  hemiIntensity: 1.5,
  sunLight: '#FFDCCB',
  sunLightX: -6,
  sunLightY: 4.5,
  sunIntensity: 1.7,
  fill: '#E6DEFF',
  fillIntensity: 0.45,
  lamp: 0,
  beam: '#FFD9CF',
  beamOpacity: 0.16,
  background: '#FFF1EA',
}

const SUNSET: Preset = {
  skyTop: '#F4BFD0',
  skyBottom: '#FFD99E',
  sun: '#FFC47E',
  sunGlow: '#FFB49A',
  sunX: 0.3,
  sunY: 0.2, // se pondo atrás do pico
  moon: 0,
  stars: 0,
  mountains: '#E4B8CB',
  hillFar: '#D9C99C',
  hillMid: '#C6C68E',
  hillNear: '#AEBB86',
  tree: '#A9B97F',
  trunk: '#B98660',
  house: '#FFE9D2',
  roof: '#F08A7A',
  houseLight: 0.25,
  cloud: '#FFD8C6',
  cloudOpacity: 0.95,
  birds: 0.8,
  hemiSky: '#FFE2C6',
  hemiGround: '#E8C4A4',
  hemiIntensity: 1.45,
  sunLight: '#FFC48E',
  sunLightX: 6,
  sunLightY: 3.6,
  sunIntensity: 2.0,
  fill: '#F2D6FF',
  fillIntensity: 0.4,
  lamp: 0.15,
  beam: '#FFC98A',
  beamOpacity: 0.22,
  background: '#FFE9D8',
}

const NIGHT: Preset = {
  skyTop: '#5E62A6',
  skyBottom: '#A897D3',
  sun: '#FFC47E',
  sunGlow: '#FFB49A',
  sunX: 0.6,
  sunY: -1.6, // abaixo do horizonte
  moon: 1,
  stars: 1,
  mountains: '#7C78B0',
  hillFar: '#6F8391',
  hillMid: '#617A80',
  hillNear: '#56706F',
  tree: '#5C7A72',
  trunk: '#7C6670',
  house: '#C9C3E6',
  roof: '#A57E9E',
  houseLight: 1,
  cloud: '#9C93C9',
  cloudOpacity: 0.55,
  birds: 0,
  hemiSky: '#B3AEE6',
  hemiGround: '#8E7C9C',
  hemiIntensity: 0.75,
  sunLight: '#C9D2FF', // luar
  sunLightX: -4,
  sunLightY: 7,
  sunIntensity: 0.6,
  fill: '#B9B2F0',
  fillIntensity: 0.3,
  lamp: 1,
  beam: '#C9D2FF',
  beamOpacity: 0.07,
  background: '#D3CCEB',
}

const KEYS: Preset[] = [DAWN, SUNSET, NIGHT, DAWN]

/** Momento do dia de cada fase */
export function phaseTime(phase: Phase) {
  if (phase === 'painting' || phase === 'kiln') return 1
  if (phase === 'firing' || phase === 'result') return 2
  return 0
}

/** Estado vivo do relógio: `value` anda de 0 a 3 e volta a 0 */
export const timeRuntime = {
  value: 0,
  palette: createPalette(),
}

function createPalette(): TimePalette {
  const p = {} as Record<string, Color | number>
  for (const [k, v] of Object.entries(DAWN)) p[k] = typeof v === 'string' ? new Color(v) : v
  return p as unknown as TimePalette
}

// cores das chaves convertidas uma vez
const KEY_COLORS = KEYS.map((k) => {
  const out: Record<string, Color | number> = {}
  for (const [name, v] of Object.entries(k)) out[name] = typeof v === 'string' ? new Color(v) : v
  return out
})

/** Mistura as duas chaves vizinhas de `value` (com suavização) em `out` */
export function samplePalette(value: number, out: TimePalette) {
  const v = MathUtils.euclideanModulo(value, 3)
  const i = Math.min(2, Math.floor(v))
  const k = MathUtils.smootherstep(v - i, 0, 1)
  const a = KEY_COLORS[i]
  const b = KEY_COLORS[i + 1]
  const o = out as unknown as Record<string, Color | number>
  for (const name of Object.keys(a)) {
    const va = a[name]
    const vb = b[name]
    if (va instanceof Color) (o[name] as Color).copy(va).lerp(vb as Color, k)
    else o[name] = MathUtils.lerp(va as number, vb as number, k)
  }
  return out
}

/**
 * Para onde o relógio vai quando a fase muda.
 * - Seguindo o jogo (modelar → pintar → forno), anda para a frente.
 * - Depois da noite, "fazer outra peça" leva ao amanhecer seguinte (não volta pela tarde).
 * - "Voltar a modelar" no meio da tarde volta para a manhã do mesmo dia.
 */
export function nextTarget(current: number, phase: Phase) {
  const want = phaseTime(phase)
  const base = Math.floor(current / 3) * 3
  const local = current - base // 0 a 3 dentro do "dia" atual
  if (want === 0) return local < 1.99 ? base : base + 3
  const t = base + want
  return t < current - 0.5 ? t + 3 : t
}
