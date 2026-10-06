import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Shape, ShapeGeometry, Vector3, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { useGameStore } from '../store/useGameStore'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { DOOR_CENTER_Y, DOOR_Z, SHELF_TOP, kilnToWorld } from './kilnLayout'
import { kilnRuntime } from './kilnRuntime'
import { firingFx } from './FiringController'

const STEAM_COUNT = 10
const STAR_COUNT = 12

function starGeometry() {
  const s = new Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.11 : 0.05
    const a = Math.PI / 2 + (i * Math.PI) / 5
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return new ShapeGeometry(s)
}

/** Nuvem de vapor que sai da porta quando ela abre */
function Steam() {
  const refs = useRef<(Mesh | null)[]>([])
  const origin = useMemo(() => kilnToWorld(0, DOOR_CENTER_Y, DOOR_Z + 0.3), [])
  const out = useMemo(() => kilnToWorld(0, DOOR_CENTER_Y, DOOR_Z + 1.3).sub(origin), [origin])
  const drift = useMemo(() => new Vector3(), [])
  const seeds = useMemo(
    () => Array.from({ length: STEAM_COUNT }, (_, i) => ({ a: (i / STEAM_COUNT) * Math.PI * 2, d: 0.6 + (i % 3) * 0.25, delay: (i % 4) * 0.06 })),
    [],
  )

  useFrame(() => {
    const k = firingFx.steam
    seeds.forEach((sd, i) => {
      const m = refs.current[i]
      if (!m) return
      const t = Math.max(0, Math.min(1, (k - sd.delay) / (1 - sd.delay)))
      m.visible = k > 0 && t < 1
      if (!m.visible) return
      m.position
        .copy(origin)
        .addScaledVector(out, t * sd.d)
        .add(drift.set(Math.cos(sd.a) * t * 0.6, t * 1.4 + Math.sin(sd.a) * t * 0.4, 0))
      m.scale.setScalar(0.18 + t * 0.55)
      ;(m.material as MeshStandardMaterial).opacity = (1 - t) * 0.8
    })
  })

  return (
    <group>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)} visible={false}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Estrelinhas que estouram em volta da peça quando ela sai do forno */
function StarBurst() {
  const group = useRef<Group>(null)
  const geo = useMemo(() => starGeometry(), [])
  const seeds = useMemo(
    () => Array.from({ length: STAR_COUNT }, (_, i) => ({ a: (i / STAR_COUNT) * Math.PI * 2, r: 0.5 + (i % 3) * 0.2, h: (i % 4) * 0.25 })),
    [],
  )
  const center = useMemo(() => new Vector3(), [])

  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    const k = firingFx.stars
    g.visible = k > 0 && k < 1
    if (!g.visible) return
    const c = potteryRuntime.carrier
    center.copy(c.position)
    g.children.forEach((m, i) => {
      const sd = seeds[i]
      const r = sd.r * (0.4 + k * 0.9)
      m.position.set(center.x + Math.cos(sd.a) * r, center.y + 0.2 + sd.h + k * 0.5, center.z + Math.sin(sd.a) * r)
      m.lookAt(camera.position)
      m.rotateZ(k * 4 + i)
      // aparece, cresce e some
      const pop = Math.sin(Math.min(1, k * 1.3) * Math.PI)
      m.scale.setScalar(0.2 + pop * 1.1)
      ;((m as Mesh).material as MeshBasicMaterial).opacity = pop
    })
  })

  return (
    <group ref={group} visible={false}>
      {seeds.map((_, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial color={i % 3 === 0 ? '#FFFBF5' : '#FFD36B'} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Partículas de calor (janelinha e chaminé) e o brilho de estrelas na prateleira */
export function FiringEffects() {
  const phase = useGameStore((s) => s.phase)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)
  // modo econômico: metade das partículas
  const k = useGameStore((s) => (s.quality === 'high' ? 1 : 0.5))
  const heat = useRef<Group>(null)
  const windowPos = useMemo(() => kilnToWorld(0, DOOR_CENTER_Y, DOOR_Z + 0.25), [])
  const chimneyPos = useMemo(() => kilnToWorld(0.5, 3.3, -0.2), [])

  useFrame(() => {
    if (heat.current) heat.current.visible = kilnRuntime.heat > 0.15
  })

  if (reduceMotion) return null
  return (
    <>
      <group ref={heat} visible={false}>
        <Sparkles position={windowPos} count={Math.round(26 * k)} scale={[1.4, 1.4, 0.6]} size={5} speed={0.8} color="#FFB060" />
        <Sparkles position={chimneyPos} count={Math.round(16 * k)} scale={[0.6, 1.4, 0.6]} size={4} speed={1.2} color="#FFD36B" />
      </group>
      <Steam />
      <StarBurst />
      {phase === 'result' && (
        <Sparkles position={[SHELF_TOP.x, SHELF_TOP.y + 0.9, SHELF_TOP.z]} count={Math.round(18 * k)} scale={[2, 1.8, 1]} size={4} speed={0.3} color="#FFE7A8" />
      )}
    </>
  )
}
