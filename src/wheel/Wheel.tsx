import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { WHEEL_TOP_Y, wheelRuntime } from './wheelRuntime'

/** Torno: pé em sálvia, bacia em biscoito e a cabeça que gira */
export function Wheel() {
  const head = useRef<Group>(null)

  useFrame(() => {
    if (head.current) head.current.rotation.y = wheelRuntime.angle
  })

  return (
    <group>
      {/* pé do torno */}
      <mesh position={[0, 0.33, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.66, 40]} />
        <meshStandardMaterial color="#C9DDC4" roughness={0.9} />
      </mesh>
      {/* bacia (anel que segura a água) */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.85, 1.7, 0.16, 56]} />
        <meshStandardMaterial color="#E2CDB5" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[1.78, 0.06, 12, 64]} />
        <meshStandardMaterial color="#EBD9C4" roughness={0.85} />
      </mesh>

      {/* cabeça giratória */}
      <group ref={head} position={[0, WHEEL_TOP_Y, 0]}>
        <mesh position={[0, -0.05, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.5, 1.46, 0.1, 64]} />
          <meshStandardMaterial color="#D9C1A3" roughness={0.8} />
        </mesh>
        {/* anéis-guia em relevo baixo */}
        {[0.7, 1.2].map((r) => (
          <mesh key={r} position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[r - 0.025, r, 64]} />
            <meshStandardMaterial color="#C9AE8C" roughness={0.9} />
          </mesh>
        ))}
        {/* marquinhas que deixam a rotação visível */}
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI * 2
          return (
            <mesh key={k} position={[Math.sin(a) * 1.36, 0.004, Math.cos(a) * 1.36]} rotation={[-Math.PI / 2, 0, -a]}>
              <circleGeometry args={[0.06, 20]} />
              <meshStandardMaterial color="#FFF4E6" roughness={0.8} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
