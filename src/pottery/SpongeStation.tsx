import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Vector3,
  type Group,
  type InstancedMesh,
  type RingGeometry,
} from 'three'
import { useGameStore } from '../store/useGameStore'
import { outerRadiusAt } from './profile'
import { potteryRuntime } from './potteryRuntime'
import { BUCKET_POS, MAX_DROPS, STOOL_H, spongeRuntime as sp } from './sponge'

// Balde de água num banquinho ao lado do torno, a esponja e as gotinhas.
// Só aparece na modelagem e no acabamento (as outras fases continuam iguais).

const WOOD = '#E8C39A'
// balde rosa bebê, com a borda, os frisos e a alça num rosa um pouco mais fundo
const BUCKET = '#F8CCD8'
const BUCKET_DARK = '#EDB0C2'
const WATER = '#A9DCF2'
const SPONGE_WET = new Color('#F6D27E')
const SPONGE_DRY = new Color('#FBEFC8')
/** Tamanho da esponja: largura, altura e espessura */
const SPONGE: [number, number, number] = [0.28, 0.2, 0.13]

/** Onde a esponja descansa: na borda do balde */
const REST = new Vector3(BUCKET_POS.x - 0.05, STOOL_H + 0.53, BUCKET_POS.z + 0.05)

/** Superfície da água: disco com vários aros para as ondinhas (só as alturas mudam por quadro) */
const WATER_R = 0.285
const WATER_Y = 0.35

/**
 * Poros da esponja num canvas pequeno: furinhos ovais de tamanhos variados, mais escuros que a
 * massa. Serve de cor (multiplica a cor do material) e de relevo.
 */
function spongeTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  if (g) {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, size, size)
    let seed = 7
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < 700; i++) {
      const r = 1 + rand() ** 2.5 * 4.5
      const x = rand() * size
      const y = rand() * size
      const shade = 196 + Math.floor(rand() * 40)
      g.fillStyle = `rgb(${shade},${shade - 8},${shade - 30})`
      g.beginPath()
      g.ellipse(x, y, r, r * (0.6 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2)
      g.fill()
    }
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

export function SpongeStation() {
  const station = useRef<Group>(null)
  const bucket = useRef<Group>(null)
  const sponge = useRef<Group>(null)
  const drops = useRef<InstancedMesh>(null)
  const water = useRef<RingGeometry>(null)
  const show = useRef(0)
  // ondinha do mergulho (1 = acabou de mergulhar, some até 0)
  const ripple = useRef(0)
  const lastDip = useRef(99)

  const mats = useMemo(() => {
    const pores = spongeTexture()
    return {
      sponge: new MeshStandardMaterial({
        color: SPONGE_WET.clone(),
        roughness: 0.95,
        map: pores,
        bumpMap: pores,
        bumpScale: 2.5,
      }),
      drop: new MeshStandardMaterial({ color: '#D8F0FB', roughness: 0.05, transparent: true, opacity: 0.85 }),
    }
  }, [])
  useEffect(
    () => () => {
      mats.sponge.map?.dispose()
      mats.sponge.dispose()
      mats.drop.dispose()
    },
    [mats],
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
        tmp.goal.copy(sp.point).addScaledVector(sp.normal, SPONGE[2] / 2 + 0.01 - sp.squeeze * 0.045)
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

    // água: balanço calmo o tempo todo e aros que se abrem quando a esponja mergulha
    const wg = water.current
    if (wg && st?.visible) {
      if (sp.dipT < lastDip.current) ripple.current = 1
      lastDip.current = sp.dipT
      ripple.current = Math.max(0, ripple.current - dt * 0.6)
      // "reduzir animações": a água continua viva, só bem mais quietinha
      const calm = s.settings.reduceMotion ? 0.3 : 1
      const t = state.clock.elapsedTime
      const pos = wg.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const r = Math.hypot(x, y) / WATER_R
        // balanço: a superfície inclina devagar para um lado e para o outro
        let h = (x * Math.sin(t * 0.7) + y * Math.cos(t * 0.53)) * 0.03 * calm
        // marolinhas finas que andam do centro para a borda
        h += Math.sin(r * 14 - t * 2.2) * 0.003 * calm * (1 - r * 0.5)
        // mergulho: um aro que corre até a borda e some
        if (ripple.current > 0) {
          const d = r - (1 - ripple.current) * 1.4
          h += Math.exp(-d * d * 30) * Math.sin(d * 30) * 0.014 * ripple.current
        }
        pos.setZ(i, h)
      }
      pos.needsUpdate = true
      wg.computeVertexNormals()
    }
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
          {/* borda */}
          <mesh position-y={0.42} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.3, 0.025, 10, 32]} />
            <meshStandardMaterial color={BUCKET_DARK} roughness={0.5} />
          </mesh>
          {/* frisos na lateral (o raio acompanha o afunilado do balde) */}
          {[0.12, 0.29].map((y) => (
            <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.24 + (0.06 * y) / 0.42 + 0.003, 0.009, 8, 32]} />
              <meshStandardMaterial color={BUCKET_DARK} roughness={0.5} />
            </mesh>
          ))}
          {/* água com ondinhas */}
          <mesh position-y={WATER_Y} rotation-x={-Math.PI / 2}>
            <ringGeometry ref={water} args={[0.001, WATER_R, 40, 10]} />
            <meshStandardMaterial color={WATER} roughness={0.06} transparent opacity={0.9} />
          </mesh>
          {/* alça abaixada: deitada para a frente, encostada na lateral, presa em dois botõezinhos */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.305, 0.4, 0]}>
              <sphereGeometry args={[0.03, 12, 10]} />
              <meshStandardMaterial color={BUCKET_DARK} roughness={0.5} />
            </mesh>
          ))}
          <mesh position-y={0.4} rotation-x={1.8}>
            <torusGeometry args={[0.318, 0.013, 8, 28, Math.PI]} />
            <meshStandardMaterial color={BUCKET_DARK} roughness={0.4} />
          </mesh>
        </group>
      </group>

      <group ref={sponge} position={REST}>
        <RoundedBox args={SPONGE} radius={0.045} smoothness={4} material={mats.sponge} castShadow />
      </group>

      <instancedMesh ref={drops} args={[undefined, undefined, MAX_DROPS]} material={mats.drop} frustumCulled={false}>
        <sphereGeometry args={[0.018, 10, 8]} />
      </instancedMesh>
    </>
  )
}
