import { useGameStore } from '../store/useGameStore'

// Vibração leve no celular (onde o navegador permite; o Safari do iPhone não tem a API).

const PATTERNS = {
  /** toquinho contínuo enquanto molda */
  sculpt: { ms: 8, every: 140 },
  /** parede no limite: um pouco mais forte */
  limit: { ms: 22, every: 260 },
  /** abrir a boca, carimbar */
  tap: { ms: 14, every: 80 },
} as const

let last = 0

export function haptic(kind: keyof typeof PATTERNS) {
  if (!useGameStore.getState().settings.vibration) return
  if (typeof navigator.vibrate !== 'function') return
  const p = PATTERNS[kind]
  const now = performance.now()
  if (now - last < p.every) return
  last = now
  navigator.vibrate(p.ms)
}
