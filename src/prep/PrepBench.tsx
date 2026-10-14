import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { MeshStandardMaterial, type Group, type Mesh } from 'three'
import { useGameStore } from '../store/useGameStore'
import { SHELF_TOP } from '../kiln/kilnLayout'
import { AMOUNT_REFS, nearestRef } from './prep'
import {
  BLOCK_D,
  BLOCK_H,
  BLOCK_LEN,
  BLOCK_X0,
  BUBBLE_COUNT,
  CUT_DOWN,
  CUT_TIME,
  FOLD_TIME,
  LUMP_R,
  PIN_R,
  READY_TIME,
  SLAB_W,
  amountScale,
  ease,
  prepRuntime as rt,
  slabSize,
  wireXFor,
} from './prepRuntime'

// Bancada do preparo, em cima da mesinha à esquerda do torno:
// bloco + fio de corte → massa com bolhas → placa com rolo → bola lisinha.

const CLAY = '#E3A587'
const WOOD = '#E8C39A'
const WOOD_DARK = '#D9AE82'
const WIRE = '#9A93A6'

/** Direções das bolhas na metade de cima e de frente da massa (sempre as mesmas) */
const BUBBLE_DIRS = Array.from({ length: BUBBLE_COUNT }, (_, i) => {
  const f = (i + 0.5) / BUBBLE_COUNT
  const y = 0.22 + 0.68 * ((i * 0.618) % 1)
  const th = -1.25 + 2.5 * f
  const r = Math.sqrt(1 - y * y)
  return [Math.sin(th) * r, y, Math.cos(th) * r] as const
})
const BUBBLE_SIZES = BUBBLE_DIRS.map((_, i) => 0.026 + ((i * 7) % 5) * 0.004)

/** Marcas P, M e G na beirada da mesa; a mais perto da escolha fica destacada */
function RefTicks() {
  const amount = useGameStore((s) => s.prep.amount)
  const near = nearestRef(amount)
  return (
    <group position={[0, 0.006, BLOCK_D / 2 + 0.12]}>
      {AMOUNT_REFS.map((r) => {
        const on = r.id === near
        const x = wireXFor(r.amount)
        return (
          <mesh key={r.id} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={on ? 1.35 : 1}>
            <circleGeometry args={[0.035, 20]} />
            <meshStandardMaterial color={on ? CLAY : '#B79A86'} roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

export function PrepBench() {
  const visible = useGameStore((s) => s.phase === 'prep')
  const step = useGameStore((s) => s.prep.step)

  const mats = useMemo(
    () => ({
      clay: new MeshStandardMaterial({ color: CLAY, roughness: 0.72, metalness: 0 }),
      slab: new MeshStandardMaterial({ color: CLAY, roughness: 0.75, metalness: 0 }),
      shiny: new MeshStandardMaterial({ color: '#E9A98A', roughness: 0.22, metalness: 0 }),
      wood: new MeshStandardMaterial({ color: WOOD, roughness: 0.7 }),
      woodDark: new MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.7 }),
      wire: new MeshStandardMaterial({ color: WIRE, roughness: 0.35, metalness: 0.4 }),
      bubbles: BUBBLE_DIRS.map(
        () => new MeshStandardMaterial({ color: '#FFF6EE', roughness: 0.15, transparent: true, opacity: 0.8 }),
      ),
    }),
    [],
  )

  const cut = useRef<Group>(null)
  const portion = useRef<Mesh>(null)
  const remainder = useRef<Mesh>(null)
  const wire = useRef<Group>(null)

  const throwGroup = useRef<Group>(null)
  const lump = useRef<Mesh>(null)
  const bubbles = useRef<(Mesh | null)[]>([])

  const rollGroup = useRef<Group>(null)
  const slab = useRef<Group>(null)
  const front = useRef<Mesh>(null)
  const hinge = useRef<Group>(null)
  const back = useRef<Mesh>(null)
  const pin = useRef<Group>(null)

  const ball = useRef<Group>(null)

  useFrame((state) => {
    if (!visible) return
    const s = useGameStore.getState()
    const { prep } = s
    const k = amountScale(prep.amount)
    const m = ease(rt.morph)

    // ---------- corte ----------
    if (cut.current && portion.current && remainder.current && wire.current) {
      cut.current.visible = prep.step === 'cut'
      const wx = rt.wireX
      const len = Math.max(0.01, wx - BLOCK_X0)
      const rem = Math.max(0, BLOCK_X0 + BLOCK_LEN - wx)
      const t = rt.cutT
      const down = t < 0 ? 0 : ease(t / CUT_DOWN)
      const apart = t < 0 ? 0 : ease((t - CUT_DOWN) / (CUT_TIME - CUT_DOWN))

      // a porção desliza para o meio da mesa
      portion.current.scale.x = len
      portion.current.position.x = (BLOCK_X0 + len / 2) * (1 - apart)
      // o resto vai embora para a direita e some
      remainder.current.visible = rem > 0.02
      remainder.current.scale.set(rem * (1 - apart * 0.6), 1 - apart, 1 - apart)
      remainder.current.position.x = wx + rem / 2 + apart * 0.7
      // o fio desce pelo bloco e depois sobe
      wire.current.position.x = wx
      wire.current.position.y = BLOCK_H + 0.03 - down * (BLOCK_H + 0.01) + apart * 0.5
      wire.current.visible = apart < 0.95
    }

    // ---------- arremessos ----------
    if (throwGroup.current && lump.current) {
      throwGroup.current.visible = prep.step === 'throw'
      throwGroup.current.scale.setScalar(k)
      const sq = rt.squash
      const spread = 1 + (1 - sq) * 0.6
      lump.current.position.y = LUMP_R * 0.8 * sq * m + rt.lumpY
      lump.current.scale.set(spread * m, 0.8 * sq * m, spread * m)
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const b = bubbles.current[i]
        if (!b) continue
        const pop = rt.pops.get(i)
        const mat = mats.bubbles[i]
        if (pop !== undefined) {
          b.visible = true
          b.scale.setScalar(1 + pop * 5)
          mat.opacity = 0.8 * Math.max(0, 1 - pop / 0.35)
        } else {
          b.visible = i < prep.bubbles
          // bolhinhas "respiram" de leve
          b.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.08)
          mat.opacity = 0.8
        }
      }
    }

    // ---------- rolo e dobras ----------
    if (rollGroup.current && slab.current && front.current && hinge.current && back.current && pin.current) {
      const ready = prep.step === 'ready' ? ease(rt.readyT / READY_TIME) : 0
      rollGroup.current.visible = prep.step === 'roll' || (prep.step === 'ready' && ready < 1)
      rollGroup.current.scale.setScalar(k)
      const folding = rt.foldT >= 0
      // durante a dobra a placa está no fim do ciclo (achatada)
      const { t, l } = slabSize(folding ? 1 : rt.roll, prep.folds)
      const theta = folding ? Math.PI * ease(rt.foldT / FOLD_TIME) : 0
      const grow = 0.55 + 0.45 * m
      slab.current.position.z = rt.slabShift
      slab.current.scale.set(grow * (1 - ready), grow * (1 - ready), grow * (1 - ready))
      front.current.scale.set(SLAB_W, t, l / 2)
      front.current.position.set(0, t / 2, l / 4)
      hinge.current.position.set(0, t, 0)
      hinge.current.rotation.x = theta
      back.current.scale.set(SLAB_W, t, l / 2)
      back.current.position.set(0, -t / 2, -l / 4)
      // cada dobra deixa a massa mais lisinha
      mats.slab.roughness = 0.75 - prep.folds * 0.12
      pin.current.visible = prep.step === 'roll' && !folding
      pin.current.position.set(0, t + PIN_R, rt.pinZ + rt.slabShift)
      pin.current.rotation.x = rt.pinAngle
    }

    // ---------- pronta: bola lisinha e brilhante ----------
    if (ball.current) {
      const e = prep.step === 'ready' ? ease(rt.readyT / READY_TIME) : 0
      ball.current.visible = e > 0
      ball.current.scale.setScalar(k * Math.max(0.001, e))
      ball.current.rotation.y = state.clock.elapsedTime * 0.4
    }
  })

  if (!visible) return null

  return (
    <group position={SHELF_TOP}>
      {/* corte */}
      <group ref={cut}>
        <RoundedBox ref={portion} args={[1, BLOCK_H, BLOCK_D]} radius={0.05} smoothness={3} position-y={BLOCK_H / 2} castShadow receiveShadow material={mats.clay} />
        <RoundedBox ref={remainder} args={[1, BLOCK_H, BLOCK_D]} radius={0.05} smoothness={3} position-y={BLOCK_H / 2} castShadow receiveShadow material={mats.clay} />
        <group ref={wire}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.wire}>
            <cylinderGeometry args={[0.007, 0.007, BLOCK_D + 0.26, 6]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0, 0.05, side * (BLOCK_D / 2 + 0.14)]} material={mats.wood} castShadow>
              <cylinderGeometry args={[0.032, 0.032, 0.16, 12]} />
            </mesh>
          ))}
        </group>
        {step === 'cut' && <RefTicks />}
      </group>

      {/* arremessos */}
      <group ref={throwGroup}>
        <mesh ref={lump} material={mats.clay} castShadow receiveShadow>
          <sphereGeometry args={[LUMP_R, 32, 24]} />
          {BUBBLE_DIRS.map((d, i) => (
            <mesh
              key={i}
              ref={(el) => {
                bubbles.current[i] = el
              }}
              position={[d[0] * LUMP_R * 0.98, d[1] * LUMP_R * 0.98, d[2] * LUMP_R * 0.98]}
              material={mats.bubbles[i]}
            >
              <sphereGeometry args={[BUBBLE_SIZES[i], 12, 10]} />
            </mesh>
          ))}
        </mesh>
      </group>

      {/* rolo e dobras */}
      <group ref={rollGroup}>
        <group ref={slab}>
          <RoundedBox ref={front} args={[1, 1, 1]} radius={0.12} smoothness={3} castShadow receiveShadow material={mats.slab} />
          <group ref={hinge}>
            <RoundedBox ref={back} args={[1, 1, 1]} radius={0.12} smoothness={3} castShadow receiveShadow material={mats.slab} />
          </group>
        </group>
        <group ref={pin}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mats.wood} castShadow>
            <cylinderGeometry args={[PIN_R, PIN_R, 0.78, 20]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.47, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.woodDark} castShadow>
              <cylinderGeometry args={[0.026, 0.03, 0.16, 12]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* pronta para o torno */}
      <group ref={ball}>
        <mesh position-y={LUMP_R} material={mats.shiny} castShadow receiveShadow>
          <sphereGeometry args={[LUMP_R, 40, 28]} />
        </mesh>
      </group>
    </group>
  )
}
