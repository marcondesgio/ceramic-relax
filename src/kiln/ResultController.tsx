import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { potteryRuntime } from '../pottery/potteryRuntime'

const AUTO_SPIN = 0.35 // rad/s: gira devagar sozinha
const DRAG_SPEED = 0.012 // rad por pixel

/** Na prateleira: a peça gira devagar e o jogador pode girar arrastando (mouse ou dedo) */
export function ResultController() {
  const gl = useThree((s) => s.gl)
  const st = useRef({ pointerId: null as number | null, lastX: 0, momentum: 0, idle: 0 })

  useEffect(() => {
    const el = gl.domElement
    const s = st.current
    const onDown = (e: PointerEvent) => {
      if (useGameStore.getState().phase !== 'result' || s.pointerId !== null) return
      s.pointerId = e.pointerId
      s.lastX = e.clientX
      s.momentum = 0
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* sem captura também funciona */
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== s.pointerId) return
      const dx = e.clientX - s.lastX
      s.lastX = e.clientX
      potteryRuntime.displayAngle += dx * DRAG_SPEED
      s.momentum = dx * DRAG_SPEED * 60 // rad/s aproximado, para continuar girando ao soltar
      s.idle = 0
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === s.pointerId) s.pointerId = null
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame((_, delta) => {
    const s = st.current
    if (useGameStore.getState().phase !== 'result') {
      s.pointerId = null
      return
    }
    if (s.pointerId !== null) return
    const dt = Math.min(delta, 0.1)
    // depois de soltar, o embalo diminui e volta o giro lento
    s.momentum *= Math.exp(-dt * 3)
    s.idle += dt
    const auto = AUTO_SPIN * Math.min(1, s.idle / 1.5)
    potteryRuntime.displayAngle += (s.momentum + auto) * dt
  })

  return null
}
