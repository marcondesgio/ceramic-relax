import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { kilnRuntime } from '../kiln/kilnRuntime'
import { setLoop } from './sounds'

/** Liga os loops de áudio ao que acontece na cena: torno, argila e forno */
export function AudioDriver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const s = useGameStore.getState()
    const spinning = s.phase === 'modeling' || s.phase === 'painting'
    const speed = spinning ? s.wheelSpeed : 0

    // zumbido do torno: volume e tom sobem com a velocidade
    setLoop('wheel', speed, dt, 0.7 + speed * 0.6)
    // argila úmida: enquanto a modelagem está deformando
    setLoop('clay', s.phase === 'modeling' ? potteryRuntime.deforming : 0, dt, 0.85 + speed * 0.3)
    potteryRuntime.deforming *= Math.exp(-dt * 8)
    // crepitar do forno acompanha o calor
    setLoop('kiln', s.phase === 'firing' ? kilnRuntime.heat : 0, dt)
  })
  return null
}
