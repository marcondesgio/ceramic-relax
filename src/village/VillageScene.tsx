import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { ExtrudeGeometry, MeshStandardMaterial, Shape, type Group, type Mesh } from 'three'
import { useGameStore } from '../store/useGameStore'
import type { AnimalId } from './animals'
import { AnimalModel, type AnimalParts } from './AnimalModel'
import { REACT_TIME } from './VillageController'
import { ANIMAL_SCALE, DOOR, villageRuntime as rt } from './villageRuntime'
import { LOOKS } from './animals'

// Porta do ateliê e o bichinho visitante (com as 4 animações: chegar, esperar, reagir, ir embora).

const DOOR_COLOR = '#AFC8A6'
const FRAME = '#E8C39A'
const OUTSIDE = '#E8F4E4'
const HEART = '#F4A0B5'

/** Tique de espera de cada um (a cada poucos segundos) */
const TIC_EVERY = 4.5
const TIC_LEN = 1.1

function Door() {
  const hinge = useRef<Group>(null)
  const outside = useRef<Mesh>(null)
  const { x, z, width: w, height: h } = DOOR

  useFrame((state) => {
    if (hinge.current) {
      // abre para dentro da sala; no toc-toc, uma tremidinha
      hinge.current.rotation.y = -rt.door * 1.35
      hinge.current.position.x = x - w / 2 + Math.sin(state.clock.elapsedTime * 55) * 0.012 * rt.knock
    }
    if (outside.current) outside.current.visible = rt.door > 0.02
  })

  return (
    <group>
      {/* luz de fora, vista pela porta aberta */}
      <mesh ref={outside} position={[x, h / 2, z - 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={OUTSIDE} emissive={OUTSIDE} emissiveIntensity={0.55} roughness={1} />
      </mesh>
      {/* batente */}
      {[
        { p: [x - w / 2 - 0.1, h / 2, z], s: [0.2, h + 0.14, 0.2] },
        { p: [x + w / 2 + 0.1, h / 2, z], s: [0.2, h + 0.14, 0.2] },
        { p: [x, h + 0.1, z], s: [w + 0.4, 0.2, 0.2] },
      ].map((b, i) => (
        <RoundedBox key={i} args={b.s as [number, number, number]} radius={0.04} position={b.p as [number, number, number]} castShadow receiveShadow>
          <meshStandardMaterial color={FRAME} roughness={0.7} />
        </RoundedBox>
      ))}
      {/* folha da porta, presa na dobradiça da esquerda */}
      <group ref={hinge} position={[x - w / 2, 0, z]}>
        <RoundedBox args={[w - 0.04, h - 0.03, 0.12]} radius={0.08} position={[w / 2, h / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={DOOR_COLOR} roughness={0.8} />
        </RoundedBox>
        {/* janelinha redonda */}
        <mesh position={[w / 2, h * 0.76, 0.065]}>
          <circleGeometry args={[w * 0.17, 32]} />
          <meshStandardMaterial color="#DDEFF7" roughness={0.15} emissive="#DDEFF7" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[w / 2, h * 0.76, 0.07]}>
          <torusGeometry args={[w * 0.17, 0.05, 10, 32]} />
          <meshStandardMaterial color={FRAME} roughness={0.7} />
        </mesh>
        {/* maçaneta */}
        <mesh position={[w - 0.26, h * 0.45, 0.12]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial color="#F6D27E" roughness={0.3} metalness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

function heartShape() {
  const s = new Shape()
  s.moveTo(0, -0.5)
  s.bezierCurveTo(-0.1, -0.35, -0.55, -0.1, -0.5, 0.2)
  s.bezierCurveTo(-0.45, 0.5, -0.1, 0.55, 0, 0.3)
  s.bezierCurveTo(0.1, 0.55, 0.45, 0.5, 0.5, 0.2)
  s.bezierCurveTo(0.55, -0.1, 0.1, -0.35, 0, -0.5)
  return s
}

function Visitor({ animal }: { animal: AnimalId }) {
  const root = useRef<Group>(null)
  const parts = useRef<AnimalParts>(null)
  const hearts = useRef<Group>(null)
  const heart = useMemo(
    () => ({
      geo: new ExtrudeGeometry(heartShape(), { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }),
      mat: new MeshStandardMaterial({ color: HEART, roughness: 0.4, emissive: HEART, emissiveIntensity: 0.2 }),
    }),
    [],
  )

  useFrame((state) => {
    const g = root.current
    const p = parts.current
    const visit = useGameStore.getState().visit
    if (!g || !p || !visit) return
    const t = state.clock.elapsedTime
    g.visible = visit.stage !== 'knocking'
    g.position.copy(rt.pos)
    let y = 0
    let spin = 0
    let headPitch = 0
    let headYaw = 0
    let squash = 1 + Math.sin(t * 2.2) * 0.025
    let earWiggle = 0
    let tailWag = Math.sin(t * 2) * 0.15

    if (rt.moving) {
      // passinhos: sobe e desce e balança de leve
      y = Math.abs(Math.sin(t * 9)) * 0.07
      g.rotation.z = Math.sin(t * 9) * 0.06
    } else {
      g.rotation.z = 0
      // tique de espera de cada bichinho
      const cycle = (t + animal.length) % TIC_EVERY
      const k = cycle < TIC_LEN ? Math.sin((cycle / TIC_LEN) * Math.PI) : 0
      const kp = cycle / TIC_LEN
      if (k > 0 && visit.stage !== 'reacting') {
        if (animal === 'capi') earWiggle = Math.sin(kp * Math.PI * 4) * 0.25
        if (animal === 'soneca') headPitch = -k * 0.4 // bocejo
        if (animal === 'tuco') y = k * 0.25
        if (animal === 'mica') headYaw = Math.sin(kp * Math.PI * 2) * 0.6
        if (animal === 'tata') squash = 1 - k * 0.22 // vira bolinha
        if (animal === 'rosinha') spin = Math.sin(kp * Math.PI * 2) * 0.4
        if (animal === 'guara') tailWag = Math.sin(kp * Math.PI * 6) * 0.6
      }
      if (animal === 'rosinha') y += 0.04 + Math.sin(t * 1.6) * 0.04 // boiando
    }

    // reação à peça entregue
    if (visit.stage === 'reacting' && visit.level) {
      const rtT = rt.stageT
      if (visit.level === 'none') {
        headPitch = Math.sin(rtT * 9) * 0.2 * Math.max(0, 1 - rtT / 1.4) // acena com a cabeça
      } else if (visit.level === 'some') {
        y += rtT < 0.6 ? Math.sin((rtT / 0.6) * Math.PI) * 0.4 : 0 // pulinho de alegria
      } else {
        const j = rtT % 0.7
        y += rtT < 1.4 ? Math.sin((j / 0.7) * Math.PI) * 0.45 : 0 // dois pulos com giro
        spin = rtT < 1.4 ? (rtT / 1.4) * Math.PI * 2 : 0
      }
    }

    g.position.y = y * ANIMAL_SCALE
    g.rotation.y = rt.heading + spin
    if (p.body) p.body.scale.set(1 + (1 - squash) * 0.4, squash, 1 + (1 - squash) * 0.4)
    if (p.head) {
      p.head.rotation.x = headPitch
      p.head.rotation.y = headYaw
    }
    if (p.ears) p.ears.rotation.z = earWiggle
    if (p.tail) p.tail.rotation.y = tailWag
    // piscadinha
    const blink = (t + animal.length * 0.37) % 3.6 < 0.12 ? 0.15 : 1
    for (const e of p.eyes) e.scale.y = blink

    // coraçõezinhos quando é exatamente o que imaginou
    const hg = hearts.current
    const top = LOOKS[animal].height * ANIMAL_SCALE + 0.2
    if (hg) {
      const show = visit.stage === 'reacting' && visit.level === 'all'
      hg.visible = show
      if (show) {
        hg.children.forEach((c, i) => {
          const life = (rt.stageT * 0.8 + i * 0.18) % 1.4
          c.position.set(Math.sin(i * 2.1) * 0.35, top + life * 0.9, Math.cos(i * 2.1) * 0.2)
          const sc = 0.3 * Math.min(1, life * 4) * Math.max(0, 1 - life / 1.4) * Math.min(1, (REACT_TIME - rt.stageT) * 2)
          c.scale.setScalar(Math.max(0.001, sc))
          c.rotation.y = t * 2 + i
        })
      }
    }
  })

  return (
    <group ref={root}>
      <group scale={ANIMAL_SCALE}>
        <AnimalModel ref={parts} id={animal} />
      </group>
      <group ref={hearts} visible={false}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} geometry={heart.geo} material={heart.mat} />
        ))}
      </group>
    </group>
  )
}

export function VillageScene() {
  const animal = useGameStore((s) => s.visit?.animal ?? null)
  return (
    <>
      <Door />
      {animal && <Visitor key={animal} animal={animal} />}
    </>
  )
}
