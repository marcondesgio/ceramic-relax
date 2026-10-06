import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { useGameStore } from '../store/useGameStore'
import { potteryRuntime } from './potteryRuntime'

const BASE_RADIUS = 0.0875

/**
 * Mostra onde o cursor ou o dedo toca a peça.
 * Na modelagem é um anel branco; na pintura, um disco com a cor e o tamanho do pincel.
 */
export function PotteryCursor() {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const disc = useRef<Mesh>(null)

  useFrame(({ camera }, delta) => {
    const g = group.current
    if (!g || !ring.current || !disc.current) return
    const c = potteryRuntime.cursor
    const phase = useGameStore.getState().phase
    const show = c.visible && (phase === 'modeling' || phase === 'painting')

    const ringMat = ring.current.material as MeshBasicMaterial
    const discMat = disc.current.material as MeshBasicMaterial
    const k = Math.min(1, delta * 12)
    ringMat.opacity += ((show ? (c.active ? 0.95 : 0.6) : 0) - ringMat.opacity) * k
    discMat.opacity += ((show && c.fill ? 0.85 : 0) - discMat.opacity) * k
    discMat.color.set(c.color)
    g.visible = ringMat.opacity > 0.02
    if (!show) return

    // um pouquinho para fora da superfície, sempre de frente para a câmera
    g.position.copy(c.point).addScaledVector(c.normal, 0.03)
    g.lookAt(camera.position)
    const target = (c.radius / BASE_RADIUS) * (c.active && !c.fill ? 1.25 : 1)
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * Math.min(1, delta * 10))
  })

  return (
    <group ref={group}>
      <mesh ref={disc} renderOrder={10}>
        <circleGeometry args={[0.08, 40]} />
        <meshBasicMaterial transparent opacity={0} depthTest={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} renderOrder={11}>
        <ringGeometry args={[0.075, 0.1, 40]} />
        <meshBasicMaterial color="#FFFBF5" transparent opacity={0} depthTest={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
