import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Mesh } from 'three'
import { cactusTextures, catPhotoTexture, woodGrainTextures } from './textures'

// Prateleira do fundo com objetinhos de decoração, tudo nas cores da paleta.

const P = {
  cream: '#FBF3E4',
  pink: '#F6C1CC',
  coral: '#F4A08E',
  butter: '#FBE3A0',
  mint: '#BFE6D3',
  sage: '#AFC8A6',
  sky: '#B9DDF2',
  lavender: '#B8C3EE',
  lilac: '#D7BCE8',
  caramel: '#C99A6E',
  face: '#6B4F3F',
  catOrange: '#F4B183',
}

/** Altura do topo de cada tábua (no espaço da prateleira) */
const TOP = 3.31
const BOTTOM = 2.16

function Mat({ color, rough = 0.7 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} />
}

/** Livro em pé: capa colorida com duas faixinhas creme na lombada */
function Book({ x, y, w, h, color, tilt = 0 }: { x: number; y: number; w: number; h: number; color: string; tilt?: number }) {
  const d = 0.32
  return (
    <group position={[x, y, 0]} rotation={[0, 0, tilt]}>
      <RoundedBox args={[w, h, d]} radius={0.012} position={[0, h / 2, 0]} castShadow>
        <Mat color={color} rough={0.8} />
      </RoundedBox>
      {[0.12, 0.85].map((f) => (
        <mesh key={f} position={[0, h * f, d / 2 + 0.002]}>
          <planeGeometry args={[w * 0.92, 0.025]} />
          <Mat color={P.cream} rough={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Livro deitado (para pilhas) */
function FlatBook({ y, w, h, color, rot = 0 }: { y: number; w: number; h: number; color: string; rot?: number }) {
  return (
    <group position={[0, y, 0]} rotation={[0, rot, 0]}>
      <RoundedBox args={[w, h, 0.32]} radius={0.012} position={[0, h / 2, 0]} castShadow>
        <Mat color={color} rough={0.8} />
      </RoundedBox>
      {/* páginas creme aparecendo na frente */}
      <mesh position={[0.012, h / 2, 0.161]}>
        <planeGeometry args={[w - 0.04, h * 0.7]} />
        <Mat color={P.cream} rough={0.9} />
      </mesh>
    </group>
  )
}

/** Porta-retrato com a foto do gatinho, apoiado num pezinho atrás */
function PhotoFrame({ x }: { x: number }) {
  const photo = catPhotoTexture()
  return (
    <group position={[x, TOP, 0.05]} rotation={[-0.12, 0.18, 0]}>
      <RoundedBox args={[0.46, 0.56, 0.05]} radius={0.03} position={[0, 0.28, 0]} castShadow>
        <Mat color={P.butter} rough={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.28, 0.027]}>
        <planeGeometry args={[0.36, 0.45]} />
        <meshStandardMaterial map={photo.map} roughness={0.4} />
      </mesh>
      {/* pezinho de apoio */}
      <mesh position={[0, 0.18, -0.09]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[0.08, 0.34, 0.02]} />
        <Mat color={P.butter} rough={0.5} />
      </mesh>
    </group>
  )
}

/** Cacto-bola num vasinho, com uma florzinha rosa no topo */
function BallCactus({ x, y }: { x: number; y: number }) {
  const tex = cactusTextures()
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.14, 24]} />
        <Mat color={P.butter} rough={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.018, 8, 24]} />
        <Mat color={P.butter} rough={0.5} />
      </mesh>
      <mesh position={[0, 0.24, 0]} scale={[1, 0.85, 1]} castShadow>
        <sphereGeometry args={[0.12, 24, 16]} />
        <meshStandardMaterial map={tex.map} bumpMap={tex.bump} bumpScale={1.2} roughness={0.7} />
      </mesh>
      <Flower y={0.35} />
    </group>
  )
}

/** Cacto alto com um bracinho, num vaso coral */
function TallCactus({ x, y }: { x: number; y: number }) {
  const tex = cactusTextures()
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.16, 24]} />
        <Mat color={P.coral} rough={0.6} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 24]} />
        <Mat color={P.cream} rough={0.6} />
      </mesh>
      <mesh position={[0, 0.37, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.3, 8, 16]} />
        <meshStandardMaterial map={tex.map} bumpMap={tex.bump} bumpScale={1.2} roughness={0.7} />
      </mesh>
      {/* bracinho */}
      <mesh position={[0.1, 0.4, 0]} rotation={[0, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.04, 0.12, 6, 12]} />
        <meshStandardMaterial map={tex.map} bumpMap={tex.bump} bumpScale={1.2} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Florzinha rosa de 5 pétalas */
function Flower({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.028, 0, Math.sin(a) * 0.028]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <Mat color={P.pink} rough={0.6} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.016, 10, 8]} />
        <Mat color={P.butter} rough={0.6} />
      </mesh>
    </group>
  )
}

/** Vela num potinho de vidro lavanda, com chama tremulando */
function Candle({ x, y }: { x: number; y: number }) {
  const flame = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const f = flame.current
    if (!f) return
    const t = clock.elapsedTime
    const k = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05
    f.scale.set(1 / k, k * 1.6, 1 / k)
  })
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.1, 20]} />
        <Mat color={P.cream} rough={0.9} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 24, 1, true]} />
        <meshStandardMaterial color={P.lavender} roughness={0.2} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.03, 6]} />
        <Mat color={P.face} />
      </mesh>
      <mesh ref={flame} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.018, 12, 8]} />
        <meshBasicMaterial color="#FFD36B" toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Estatueta de gatinho dormindo enrolado (combina com a foto) */
function SleepyCat({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0.02]} rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.08, 0]} scale={[1.35, 0.75, 1]} castShadow>
        <sphereGeometry args={[0.11, 20, 14]} />
        <Mat color={P.catOrange} rough={0.5} />
      </mesh>
      <group position={[-0.11, 0.1, 0.05]}>
        <mesh castShadow>
          <sphereGeometry args={[0.075, 18, 12]} />
          <Mat color={P.catOrange} rough={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.04, 0.065, 0]} rotation={[0, 0, -s * 0.35]}>
            <coneGeometry args={[0.025, 0.05, 8]} />
            <Mat color={P.catOrange} rough={0.5} />
          </mesh>
        ))}
        {/* olhinhos fechados */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.028, 0.005, 0.068]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.012, 0.004, 4, 10, Math.PI]} />
            <Mat color={P.face} />
          </mesh>
        ))}
      </group>
      {/* rabinho enrolado na frente */}
      <mesh position={[0.02, 0.03, 0.1]} rotation={[Math.PI / 2, 0, 0.3]}>
        <torusGeometry args={[0.09, 0.022, 8, 16, Math.PI * 0.9]} />
        <Mat color={P.catOrange} rough={0.5} />
      </mesh>
    </group>
  )
}

/** Prateleira dupla de parede com a decoração */
export function WallShelf({ position }: { position: [number, number, number] }) {
  const grain = woodGrainTextures()
  const books = useMemo(
    () => [
      { w: 0.1, h: 0.46, color: P.sky },
      { w: 0.08, h: 0.4, color: P.pink },
      { w: 0.12, h: 0.5, color: P.sage },
      { w: 0.09, h: 0.42, color: P.lilac },
      { w: 0.1, h: 0.44, color: P.butter },
    ],
    [],
  )
  // fileira de livros em pé, encostados uns nos outros
  let bx = -1.12
  const row = books.map((b) => {
    const x = bx + b.w / 2
    bx += b.w + 0.008
    return { ...b, x }
  })

  return (
    <group position={position}>
      {[BOTTOM - 0.06, TOP - 0.06].map((y) => (
        <RoundedBox key={y} args={[2.5, 0.12, 0.6]} radius={0.05} position={[0, y, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={grain.map} bumpMap={grain.bump} bumpScale={0.8} roughness={0.8} />
        </RoundedBox>
      ))}

      {/* ---- tábua de cima ---- */}
      <PhotoFrame x={-0.85} />
      <BallCactus x={-0.33} y={TOP} />
      {/* vasinho verde (ovo) */}
      <mesh position={[0.08, TOP + 0.3, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.26, 24, 16]} />
        <Mat color="#B8D3B0" />
      </mesh>
      {/* pilha de livros deitados com xicrinha lilás em cima */}
      <group position={[0.55, TOP, 0]}>
        <FlatBook y={0} w={0.42} h={0.07} color={P.coral} rot={0.08} />
        <FlatBook y={0.07} w={0.38} h={0.06} color={P.mint} rot={-0.1} />
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.075, 0.14, 20]} />
          <Mat color={P.lilac} />
        </mesh>
      </group>
      {/* vasinho amarelo */}
      <mesh position={[0.98, TOP + 0.21, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.42, 24]} />
        <Mat color={P.butter} />
      </mesh>

      {/* ---- tábua de baixo ---- */}
      {row.map((b, i) => (
        <Book key={i} x={b.x} y={BOTTOM} w={b.w} h={b.h} color={b.color} />
      ))}
      {/* último livro inclinado, apoiado na fileira */}
      <Book x={bx + 0.12} y={BOTTOM} w={0.09} h={0.42} color={P.coral} tilt={-0.35} />
      {/* tigelinha rosa */}
      <mesh position={[-0.12, BOTTOM + 0.12, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <sphereGeometry args={[0.24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={P.pink} />
      </mesh>
      <Candle x={0.3} y={BOTTOM} />
      <TallCactus x={0.65} y={BOTTOM} />
      <SleepyCat x={1.0} y={BOTTOM} />
    </group>
  )
}
