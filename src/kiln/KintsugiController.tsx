import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { glazeUniforms } from '../paint/glazeMaterial'
import { playEffect } from '../audio/sounds'

// Kintsugi: as linhas do craquelado se enchem de ouro, de baixo para cima, com um brilho
// que passa e assenta. A peça restaurada fica dourada para sempre (receita: kintsugi = true).

const DURATION = 2.4 // s
const SETTLED_GLOW = 0.12

const ease = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

export function KintsugiController() {
  // tempo da animação em andamento (−1 = nenhuma)
  const time = useRef(-1)
  const chimes = useRef(0)

  // começa quando o jogador escolhe restaurar (uma peça que já voltou restaurada não anima)
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (s.crackle?.kintsugi && !prev.crackle?.kintsugi) {
          time.current = 0
          chimes.current = 0
          playEffect('pour', { rate: 0.8, volume: 0.6 })
        }
      }),
    [],
  )

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const restored = !!s.crackle?.kintsugi
    if (!restored) {
      time.current = -1
      glazeUniforms.kintsugi.value = 0
      glazeUniforms.kintsugiGlow.value = 0
      return
    }
    if (time.current < 0) {
      glazeUniforms.kintsugi.value = 1
      glazeUniforms.kintsugiGlow.value = SETTLED_GLOW
      return
    }
    const dur = s.settings.reduceMotion ? 0.4 : DURATION
    time.current += Math.min(delta, 0.1) / dur
    const t = Math.min(1, time.current)
    glazeUniforms.kintsugi.value = ease(t)
    // brilho sobe com o ouro e depois assenta
    glazeUniforms.kintsugiGlow.value = SETTLED_GLOW + Math.sin(Math.PI * t) * 1.1
    // tilintares de ouro durante o caminho
    if (t > chimes.current * 0.22 + 0.1 && chimes.current < 4) {
      chimes.current++
      playEffect('pop', { rate: 1.7 + chimes.current * 0.12, volume: 0.35 })
    }
    if (t >= 1) {
      time.current = -1
      playEffect('ding', { rate: 1.25, volume: 0.7 })
    }
  })

  return null
}
