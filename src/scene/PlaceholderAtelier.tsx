import { RoundedBox } from '@react-three/drei'

// Ateliê provisório com formas simples: usado enquanto não há GLB (ver scene/models.ts)

const WOOD = '#E8C39A'
const CREAM = '#FFF4E6'
const PEACH = '#FFD9C0'
const SAGE = '#C9DDC4'
const LAVENDER = '#D9D2F0'

function Mat({ color, rough = 0.92 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} />
}

function Room() {
  return (
    <group>
      {/* chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <Mat color="#EBD9C4" />
      </mesh>
      {/* parede do fundo */}
      <mesh position={[0, 5, -4.6]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <Mat color={CREAM} />
      </mesh>
      {/* rodapé em pêssego com friso creme */}
      <RoundedBox args={[30, 1.5, 0.2]} radius={0.08} position={[0, 0.75, -4.5]} receiveShadow>
        <Mat color={PEACH} />
      </RoundedBox>
      <RoundedBox args={[30, 0.14, 0.32]} radius={0.06} position={[0, 1.52, -4.45]} receiveShadow castShadow>
        <Mat color="#F2C9AE" />
      </RoundedBox>
      {/* tapete redondo */}
      <mesh position={[0, 0.012, 0.2]} receiveShadow>
        <cylinderGeometry args={[2.9, 2.9, 0.02, 64]} />
        <Mat color={LAVENDER} />
      </mesh>
    </group>
  )
}

function Window() {
  return (
    <group position={[-2.6, 3.7, -4.5]}>
      {/* vidro com céu */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[2.5, 2.7]} />
        <meshBasicMaterial color="#DCEEF4" toneMapped={false} />
      </mesh>
      {/* colina e sol lá fora */}
      <mesh position={[0, -1.0, 0.05]} scale={[1.6, 0.6, 1]}>
        <circleGeometry args={[1, 40, 0, Math.PI]} />
        <meshBasicMaterial color="#CFE3C4" toneMapped={false} />
      </mesh>
      <mesh position={[0.55, 0.55, 0.05]}>
        <circleGeometry args={[0.42, 40]} />
        <meshBasicMaterial color="#FFE9AE" toneMapped={false} />
      </mesh>
      <mesh position={[-0.55, 0.85, 0.055]} scale={[1.6, 0.8, 1]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
      {/* moldura e travessas em sálvia */}
      {[
        { p: [0, 1.4, 0.12], s: [2.8, 0.18, 0.2] },
        { p: [0, -1.4, 0.16], s: [3.1, 0.2, 0.36] },
        { p: [-1.32, 0, 0.12], s: [0.18, 2.95, 0.2] },
        { p: [1.32, 0, 0.12], s: [0.18, 2.95, 0.2] },
        { p: [0, 0, 0.1], s: [0.1, 2.7, 0.12] },
        { p: [0, 0.2, 0.1], s: [2.5, 0.1, 0.12] },
      ].map((b, i) => (
        <RoundedBox
          key={i}
          args={b.s as [number, number, number]}
          radius={0.04}
          position={b.p as [number, number, number]}
          castShadow
          receiveShadow
        >
          <Mat color={SAGE} />
        </RoundedBox>
      ))}
      {/* cortina lavanda */}
      <RoundedBox args={[0.75, 3.2, 0.14]} radius={0.07} position={[-1.75, 0.05, 0.3]} castShadow>
        <Mat color={LAVENDER} />
      </RoundedBox>
    </group>
  )
}

function Shelf() {
  return (
    <group position={[3.4, 0, -4.2]}>
      {[2.1, 3.25].map((y) => (
        <RoundedBox key={y} args={[2.6, 0.12, 0.6]} radius={0.05} position={[0, y, 0]} castShadow receiveShadow>
          <Mat color={WOOD} />
        </RoundedBox>
      ))}
      {/* pecinhas fofas na prateleira */}
      <mesh position={[-0.8, 3.58, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.28, 24, 16]} />
        <Mat color="#B8D3B0" rough={0.7} />
      </mesh>
      <mesh position={[0.05, 3.45, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.32, 24]} />
        <Mat color="#C9C0EC" rough={0.7} />
      </mesh>
      <mesh position={[0.75, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.42, 24]} />
        <Mat color="#FBE3A0" rough={0.7} />
      </mesh>
      <mesh position={[-0.6, 2.28, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <sphereGeometry args={[0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color="#F6C1CC" rough={0.7} />
      </mesh>
      <mesh position={[0.5, 2.46, 0]} scale={[1, 1.3, 1]} castShadow>
        <sphereGeometry args={[0.26, 24, 16]} />
        <Mat color="#F4C2A6" rough={0.7} />
      </mesh>
    </group>
  )
}

function Plant() {
  return (
    <group position={[-4.2, 0, -2.2]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.4, 0.9, 32]} />
        <Mat color="#FBF3E4" />
      </mesh>
      {[-0.7, -0.25, 0.2, 0.6, 1.0].map((a, i) => (
        <mesh
          key={i}
          position={[Math.sin(a) * 0.35, 1.45 + (i % 2) * 0.2, Math.cos(a) * 0.1]}
          rotation={[0, 0, -a * 0.6]}
          scale={[0.22, 0.9, 0.08]}
          castShadow
        >
          <sphereGeometry args={[1, 16, 12]} />
          <Mat color="#A9C9A0" />
        </mesh>
      ))}
    </group>
  )
}

export function PlaceholderAtelier() {
  return (
    <group>
      <Room />
      <Window />
      <Shelf />
      <Plant />
    </group>
  )
}
