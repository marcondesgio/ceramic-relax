import { useFrame, useThree } from '@react-three/fiber'
import { Color, type Fog } from 'three'
import { useGameStore } from '../store/useGameStore'
import { nextTarget, samplePalette, timeRuntime } from './timeOfDay'

/** Segundos para uma mudança de período (amanhecer → entardecer etc.) */
const TRANSITION_SECONDS = 4
/** Na queima o anoitecer acompanha a animação inteira do forno */
const FIRING_SECONDS = 6.5

/**
 * Anda o relógio do dia em direção ao momento da fase atual e atualiza a paleta
 * (céu, paisagem, luzes e fundo). Deve vir antes dos componentes que leem a paleta.
 */
export function TimeController() {
  const scene = useThree((s) => s.scene)

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const dt = Math.min(delta, 0.1)
    const target = nextTarget(timeRuntime.value, s.phase)
    const diff = target - timeRuntime.value
    if (Math.abs(diff) > 1e-4) {
      if (s.settings.reduceMotion) timeRuntime.value = target
      else {
        const rate = 1 / (s.phase === 'firing' ? FIRING_SECONDS : TRANSITION_SECONDS)
        timeRuntime.value += Math.sign(diff) * Math.min(Math.abs(diff), rate * dt)
      }
    }
    const p = samplePalette(timeRuntime.value, timeRuntime.palette)
    if (scene.background instanceof Color) scene.background.copy(p.background)
    if (scene.fog) (scene.fog as Fog).color.copy(p.background)
  })

  return null
}
