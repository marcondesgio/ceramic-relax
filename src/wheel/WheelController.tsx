import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { MAX_ANGULAR_SPEED, SPIN_DOWN_SECONDS, SPIN_UP_SECONDS, wheelRuntime } from './wheelRuntime'

/**
 * Integra a velocidade do torno a cada quadro:
 * sobe até o máximo em ~1 s e desce em ~1,5 s, sempre de forma linear e suave.
 */
export function WheelController() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const s = useGameStore.getState()
    const active = s.phase === 'modeling' || s.phase === 'painting'

    let target = 0
    if (active) {
      target = Math.max(s.wheelInput.space ? 1 : 0, s.wheelInput.pedal, s.settings.wheelAlwaysOn ? 1 : 0)
    }

    let speed = s.wheelSpeed
    if (speed < target) speed = Math.min(target, speed + dt / SPIN_UP_SECONDS)
    else if (speed > target) speed = Math.max(target, speed - dt / SPIN_DOWN_SECONDS)

    if (speed !== s.wheelSpeed) s.setWheelSpeed(speed)
    wheelRuntime.angle = (wheelRuntime.angle + speed * MAX_ANGULAR_SPEED * dt) % (Math.PI * 2)
  })
  return null
}
