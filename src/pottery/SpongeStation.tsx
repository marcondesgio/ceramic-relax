import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, DoubleSide, MeshStandardMaterial, Object3D, Vector3, type Group, type InstancedMesh } from 'three'
import { useGameStore } from '../store/useGameStore'
import { outerRadiusAt } from './profile'
import { potteryRuntime } from './potteryRuntime'
import { BUCKET_POS, MAX_DROPS, STOOL_H, spongeRuntime as sp } from './sponge'

// Balde de água num banquinho ao lado do torno, a esponja e as gotinhas.
// Só aparece na modelagem e no acabamento (as outras fases continuam iguais).

const WOOD = '#E8C39A'
const BUCKET = '#B9DDF2'
const BUCKET_DARK = '#9CC8E4'
const WATER = '#A9DCF2'
const SPONGE_WET = new Color('#F6D27E')
const SPONGE_DRY = new Color('#FBEFC8')

/** Onde a esponja descansa: na borda do balde */
const REST = new Vector3(BUCKET_POS.x - 0.05, STOOL_H + 0.5, BUCKET_POS.z + 0.05)

export function SpongeStation() {
  const station = useRef<Group>(null)
  const bucket = useRef<Group>(null)
  const sponge = useRef<Group>(null)
  const drops = useRef<InstancedMesh>(null)
  const show = useRef(0)

  const mats = useMemo(
    () => ({
      sponge: new MeshStandardMaterial({ color: SPONGE_WET.clone(), roughness: 0.95 }),
      drop: new MeshStandardMaterial({ color: '#D8F0FB', roughness: 0.05, transparent: true, opacity: 0.85 }),
    }),
    [],
  )
  const dummy = useMemo(() => new Object3D(), [])
  const tmp = useMemo(() => ({ goal: new Vector3(), look: new Vector3() }), [])

  useEffect(() => {
    sp.bucket = bucket.current
    return () => {
      sp.bucket = null
    }
  }, [])

  useFrame((state, delta) => {
    const s = useGameStore.getState()
    const dt = Math.min(delta, 0.1)
    // a esponja serve no torno e no acabamento (a alça precisa de argila úmida)
    const modeling = s.phase === 'modeling' || s.phase === 'finishing'
    // aparece com uma escalinha ao entrar no torno
    show.current += ((modeling ? 1 : 0) - show.current) * Math.min(1, dt * (s.settings.reduceMotion ? 60 : 8))
    const st = station.current
    if (st) {
      st.visible = show.current > 0.01
      st.scale.setScalar(Math.max(0.001, show.current))
    }

    // esponja: na peça (onde o cursor/dedo encosta) ou descansando no balde
    const g = sponge.current
    if (g) {
      const held = s.sponge !== 'off'
      if (held && sp.hit) {
        tmp.goal.copy(sp.point).addScaledVector(sp.normal, 0.075 - sp.squeeze * 0.035)
        tmp.look.copy(sp.point)
      } else {
        // mergulhando: desce na água e volta
        const dip = sp.dipT < 0.5 ? Math.sin((sp.dipT / 0.5) * Math.PI) : 0
        tmp.goal.copy(REST)
        tmp.goal.y -= dip * 0.28
        tmp.look.set(REST.x, 0, REST.z)
      }
      const k = Math.min(1, dt * (held && sp.hit ? 22 : 9))
      g.position.lerp(tmp.goal, k)
      g.lookAt(tmp.look)
      g.scale.set(1 + sp.squeeze * 0.15, 1 + sp.squeeze * 0.15, 1 - sp.squeeze * 0.4)
      g.visible = modeling && (held ? true : show.current > 0.5)
      // cheia de água é mais amarela; espremida, mais clarinha
      mats.sponge.color.lerpColors(SPONGE_DRY, SPONGE_WET, held ? sp.load : 0.6)
    }

    // gotinhas: posição no espaço da peça (giram junto com o torno)
    const im = drops.current
    const group = potteryRuntime.group
    if (im && group) {
      const n = modeling ? Math.min(sp.drops.length, MAX_DROPS) : 0
      for (let i = 0; i < n; i++) {
        const d = sp.drops[i]
        const r = outerRadiusAt(s.profile, d.y) + 0.012
        dummy.position.set(Math.sin(d.angle) * r, d.y, Math.cos(d.angle) * r)
        group.localToWorld(dummy.position)
        const fade = Math.min(1, (3 - d.life) * 2)
        dummy.scale.set(fade, fade * (1.2 + d.speed * 2), fade)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        im.setMatrixAt(i, dummy.matrix)
      }
      im.count = n
      im.instanceMatrix.needsUpdate = true
    }
    // balde: a água balança de leve
    if (bucket.current) bucket.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.03
  })

  return (
    <>
      <group ref={station} position={BUCKET_POS}>
        {/* banquinho */}
        <mesh position-y={STOOL_H - 0.04} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.08, 28]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.4
          return (
            <mesh key={i} position={[Math.sin(a) * 0.26, (STOOL_H - 0.08) / 2, Math.cos(a) * 0.26]} castShadow>
              <cylinderGeometry args={[0.035, 0.045, STOOL_H - 0.08, 10]} />
              <meshStandardMaterial color={WOOD} roughness={0.7} />
            </mesh>
          )
        })}
        {/* balde com água (clicar molha a esponja) */}
        <group ref={bucket} position-y={STOOL_H}>
          <mesh position-y={0.21} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.24, 0.42, 28, 1, true]} />
            <meshStandardMaterial color={BUCKET} roughness={0.5} side={DoubleSide} />
          </mesh>
          <mesh position-y={0.005}>
            <cylinderGeometry args={[0.24, 0.24, 0.01, 28]} />
            <meshStandardMaterial color={BUCKET_DARK} roughness={0.5} />
          </mesh>
          <mesh position-y={0.42} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.3, 0.025, 10, 32]} />
            <meshStandardMaterial color={BUCKET_DARK} roughness={0.5} />
          </mesh>
          <mesh position-y={0.35} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.285, 28]} />
            <meshStandardMaterial color={WATER} roughness={0.08} transparent opacity={0.9} />
          </mesh>
          {/* alça */}
          <mesh position-y={0.42} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.3, 0.012, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#8E9AA8" roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      </group>

      <group ref={sponge} position={REST}>
        <RoundedBox args={[0.2, 0.15, 0.1]} radius={0.035} smoothness={3} material={mats.sponge} castShadow />
      </group>

      <instancedMesh ref={drops} args={[undefined, undefined, MAX_DROPS]} material={mats.drop} frustumCulled={false}>
        <sphereGeometry args={[0.018, 10, 8]} />
      </instancedMesh>
    </>
  )
}
