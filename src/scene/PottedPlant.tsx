import { useMemo } from 'react'
import { DoubleSide, LatheGeometry, PlaneGeometry, Vector2 } from 'three'
import { snakeLeafTextures } from './textures'

// Vaso rosa (paleta: Rosa #F6C1CC) com espada-de-são-jorge.

const PINK = '#F6C1CC'
const PINK_DEEP = '#EFADBC' // sombra da borda e do pé, mesmo tom mais fundo
const BUTTER = '#FBE3A0'
const CREAM = '#FBF3E4'
const SOIL = '#9C7B66'

/** Perfil do vaso (raio, altura): pé, barriga arredondada e borda dobrada */
const POT_PROFILE: [number, number][] = [
  [0, 0.06],
  [0.34, 0.06],
  [0.4, 0.08],
  [0.41, 0.14],
  [0.38, 0.18], // cintura do pé
  [0.44, 0.26],
  [0.51, 0.42],
  [0.54, 0.58],
  [0.53, 0.72],
  [0.49, 0.84],
  [0.48, 0.9], // pescoço
  [0.53, 0.93],
  [0.57, 0.97], // borda dobrada para fora
  [0.57, 1.02],
  [0.53, 1.05],
  [0.48, 1.03],
  [0.45, 0.98],
]

/**
 * Folha em forma de espada: base estreita, larga no meio, ponta fina.
 * Curva para trás (bend) e é levemente côncava (cup), como uma folha de verdade.
 */
function leafGeometry(height: number, width: number, bend: number) {
  const g = new PlaneGeometry(1, 1, 6, 20)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) // -0,5 a 0,5
    const t = pos.getY(i) + 0.5 // 0 (base) a 1 (ponta)
    const w = t < 0.12 ? 0.7 + (t / 0.12) * 0.3 : Math.max(0.02, 1 - Math.pow((t - 0.12) / 0.88, 2.4))
    pos.setXYZ(i, u * width * w, t * height, bend * t * t * height + u * u * width * 0.9)
  }
  g.computeVertexNormals()
  return g
}

interface LeafSpec {
  h: number
  w: number
  bend: number
  /** posição dentro do vaso e inclinação para fora */
  x: number
  z: number
  rotY: number
  lean: number
}

const LEAVES: LeafSpec[] = [
  { h: 2.0, w: 0.26, bend: 0.06, x: 0.0, z: 0.0, rotY: 0.2, lean: 0.03 },
  { h: 1.75, w: 0.24, bend: 0.1, x: -0.14, z: 0.08, rotY: -0.7, lean: 0.14 },
  { h: 1.6, w: 0.23, bend: 0.12, x: 0.15, z: 0.06, rotY: 0.9, lean: 0.16 },
  { h: 1.35, w: 0.22, bend: 0.14, x: -0.1, z: -0.13, rotY: -2.2, lean: 0.2 },
  { h: 1.45, w: 0.22, bend: 0.12, x: 0.12, z: -0.12, rotY: 2.4, lean: 0.18 },
  { h: 1.15, w: 0.2, bend: 0.16, x: 0.2, z: 0.16, rotY: 0.4, lean: 0.26 },
  { h: 1.05, w: 0.2, bend: 0.18, x: -0.2, z: 0.17, rotY: -0.3, lean: 0.28 },
]

export function PottedPlant({ position }: { position: [number, number, number] }) {
  const pot = useMemo(() => new LatheGeometry(POT_PROFILE.map(([r, y]) => new Vector2(r, y)), 48), [])
  const leaves = useMemo(() => LEAVES.map((l) => leafGeometry(l.h, l.w, l.bend)), [])
  const leafTex = snakeLeafTextures()

  // fileira de bolinhas creme na barriga do vaso
  const dots = useMemo(() => {
    const n = 14
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return [Math.sin(a) * 0.535, 0.5, Math.cos(a) * 0.535] as [number, number, number]
    })
  }, [])

  return (
    <group position={position}>
      {/* pratinho creme embaixo */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.56, 0.5, 0.06, 40]} />
        <meshStandardMaterial color={CREAM} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.025, 8, 40]} />
        <meshStandardMaterial color={CREAM} roughness={0.6} />
      </mesh>

      {/* vaso rosa, com um brilhinho de cerâmica esmaltada */}
      <mesh geometry={pot} castShadow receiveShadow>
        <meshStandardMaterial color={PINK} roughness={0.38} side={DoubleSide} />
      </mesh>
      {/* faixa amarela na barriga e bolinhas creme */}
      <mesh position={[0, 0.66, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.535, 0.028, 10, 48]} />
        <meshStandardMaterial color={BUTTER} roughness={0.45} />
      </mesh>
      {dots.map((p, i) => (
        <mesh key={i} position={p} scale={[1, 1, 0.5]} rotation={[0, (i / dots.length) * Math.PI * 2, 0]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshStandardMaterial color={CREAM} roughness={0.45} />
        </mesh>
      ))}
      {/* sombra suave sob a borda */}
      <mesh position={[0, 0.91, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.49, 0.018, 8, 48]} />
        <meshStandardMaterial color={PINK_DEEP} roughness={0.5} />
      </mesh>

      {/* terra */}
      <mesh position={[0, 0.95, 0]} receiveShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.04, 32]} />
        <meshStandardMaterial color={SOIL} roughness={1} />
      </mesh>
      {/* pedrinhas creme por cima da terra */}
      {[
        [0.28, 0.12],
        [-0.3, -0.05],
        [0.05, -0.32],
        [-0.12, 0.3],
        [0.32, -0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.975, z]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshStandardMaterial color={CREAM} roughness={0.9} />
        </mesh>
      ))}

      {/* folhas de espada-de-são-jorge */}
      {LEAVES.map((l, i) => (
        <group key={i} position={[l.x, 0.94, l.z]} rotation={[0, l.rotY, 0]}>
          <mesh geometry={leaves[i]} rotation={[-l.lean, 0, 0]} castShadow>
            <meshStandardMaterial
              map={leafTex.map}
              bumpMap={leafTex.bump}
              bumpScale={0.6}
              roughness={0.55}
              side={DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
