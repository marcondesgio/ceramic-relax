import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { ExtrudeGeometry, MeshBasicMaterial, MeshStandardMaterial, Shape, Vector3, type Group, type Mesh } from 'three'
import { useGameStore } from '../store/useGameStore'
import type { AnimalId } from './animals'
import type { AnimalParts } from './AnimalModel'
import { CharacterModel, preloadCharacters } from './CharacterModel'
import { REACT_TIME } from './VillageController'
import { ANIMAL_SCALE, BAG_IN, DOOR, villageRuntime as rt } from './villageRuntime'
import { BAGS, LOOKS } from './animals'

// os modelos finais baixam logo depois da abertura, sem atrasar a primeira tela
setTimeout(preloadCharacters, 2000)

// Porta do ateliê e o bichinho visitante (com as 4 animações: chegar, esperar, reagir, ir embora)
// e a sacolinha em que ele leva a peça entregue.

const DOOR_COLOR = '#AFC8A6'
const FRAME = '#E8C39A'
const OUTSIDE = '#E8F4E4'
const HEART = '#F4A0B5'
const CREAM = '#FFF4E6'
const TISSUE = '#FFFBF5'

/** Sacolinha (unidades de mundo): corpo, alça acima do corpo */
const BAG_W = 0.48
const BAG_H = 0.5
const BAG_D = 0.26
const BAG_HANDLE = 0.15
/** Duração do brilhinho quando a peça entra na sacola */
const PUFF_TIME = 0.7

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

/** Saída com um pouquinho de "mola" (passa de 1 e volta) */
const popOut = (k: number) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2

/**
 * Sacolinha de papel na mão do bichinho: aparece quando ele chega à mesinha para receber a
 * peça, recebe a peça e vai embora com ele, balançando a cada passo. Papel liso, faixa creme,
 * coraçãozinho na frente e papel de seda saindo pela boca depois que a peça entra.
 */
function Bag({ animal }: { animal: AnimalId }) {
  const holder = useRef<Group>(null)
  const pivot = useRef<Group>(null)
  const mouth = useRef<Group>(null)
  const tissue = useRef<Group>(null)
  const { hand, color } = BAGS[animal]
  const h = LOOKS[animal].height * ANIMAL_SCALE
  const at: [number, number, number] = [hand[0] * h, hand[1] * h, hand[2] * h]
  // bichinhos de braço curto: a sacola fica menor para não arrastar no chão
  const size = Math.min(1, (at[1] - 0.05) / (BAG_HANDLE + BAG_H))
  const heart = useMemo(() => new ExtrudeGeometry(heartShape(), { depth: 0.2, bevelEnabled: false }), [])
  const swing = useRef(0)

  useFrame((state, delta) => {
    const g = holder.current
    const p = pivot.current
    if (!g || !p) return
    const s = useGameStore.getState()
    const v = s.visit
    const on = !!v && !v.declined && (v.stage === 'reacting' || v.stage === 'leaving')
    // aparece com um "pop" quando ele chega para receber (direto, com "reduzir animações")
    const k = !on ? 0 : v.stage === 'reacting' && !s.settings.reduceMotion ? Math.min(1, rt.stageT / BAG_IN) : 1
    g.visible = k > 0
    if (!g.visible) return
    g.scale.setScalar(size * Math.max(0.001, popOut(k)))
    // balança para frente e para trás a cada passo; parada, assenta devagar
    const t = state.clock.elapsedTime
    const want = rt.moving && !s.settings.reduceMotion ? Math.sin(t * 9) * 0.2 : 0
    swing.current += (want - swing.current) * Math.min(1, delta * 8)
    // sacudidinha quando a peça cai lá dentro
    const bump = rt.puff.t < 0.4 ? Math.sin((rt.puff.t / 0.4) * Math.PI) * 0.12 : 0
    p.rotation.x = swing.current
    p.position.y = -bump * 0.15
    if (tissue.current) tissue.current.visible = rt.take >= 1
    // a peça mira a boca da sacola (posição do quadro anterior basta)
    mouth.current?.getWorldPosition(rt.bagMouth)
  })

  const top = -BAG_HANDLE
  return (
    <group ref={holder} position={at} visible={false}>
      <group ref={pivot}>
        {/* alças: dois arcos que se encontram na mão */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0, top, side * BAG_D * 0.28]} rotation-x={-side * 0.3} scale={[1, BAG_HANDLE / 0.07, 1]}>
            <mesh>
              <torusGeometry args={[0.07, 0.01, 6, 16, Math.PI]} />
              <meshStandardMaterial color={CREAM} roughness={0.7} />
            </mesh>
          </group>
        ))}
        {/* corpo de papel */}
        <RoundedBox args={[BAG_W, BAG_H, BAG_D]} radius={0.025} smoothness={2} position-y={top - BAG_H / 2} castShadow>
          <meshStandardMaterial color={color} roughness={0.85} />
        </RoundedBox>
        {/* faixa creme na boca */}
        <RoundedBox args={[BAG_W + 0.008, 0.06, BAG_D + 0.008]} radius={0.012} smoothness={2} position-y={top - 0.035}>
          <meshStandardMaterial color={CREAM} roughness={0.8} />
        </RoundedBox>
        {/* coraçãozinho na frente */}
        <mesh geometry={heart} position={[0, top - BAG_H * 0.55, BAG_D / 2 + 0.002]} scale={0.1}>
          <meshStandardMaterial color={HEART} roughness={0.5} />
        </mesh>
        {/* papel de seda: aparece quando a peça já está lá dentro */}
        <group ref={tissue} position-y={top} visible={false}>
          {[-0.09, 0, 0.09].map((x, i) => (
            <mesh key={i} position={[x, 0.05, (i - 1) * 0.03]} rotation-z={-x * 3}>
              <coneGeometry args={[0.06, 0.14, 7]} />
              <meshStandardMaterial color={TISSUE} roughness={0.9} />
            </mesh>
          ))}
        </group>
        <group ref={mouth} position-y={top - 0.04} />
      </group>
    </group>
  )
}

/** Brilhinho de estrelas onde a peça entrou na sacola (ou sumiu, com "reduzir animações") */
function Puff() {
  const group = useRef<Group>(null)
  const mat = useMemo(() => new MeshBasicMaterial({ color: '#FFD36B', transparent: true, toneMapped: false, depthWrite: false }), [])
  const dirs = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Vector3(Math.cos(i * 0.9) * 0.9, 0.5 + (i % 3) * 0.35, Math.sin(i * 0.9) * 0.6)),
    [],
  )

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    rt.puff.t += Math.min(delta, 0.1)
    const k = rt.puff.t / PUFF_TIME
    g.visible = k < 1
    if (!g.visible) return
    const still = useGameStore.getState().settings.reduceMotion
    g.position.copy(rt.puff.pos)
    if (still) g.position.y += 0.4
    g.children.forEach((m, i) => {
      // com "reduzir animações" as estrelinhas só acendem e apagam, sem voar
      const r = still ? 0.35 : 0.1 + k * 0.45
      m.position.copy(dirs[i]).multiplyScalar(r)
      m.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * Math.min(1, k * 1.2)) * 0.05))
    })
    mat.opacity = 1 - k
  })

  return (
    <group ref={group} visible={false}>
      {dirs.map((_, i) => (
        <mesh key={i} material={mat}>
          <octahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  )
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
    if (p.body) {
      p.body.scale.set(1 + (1 - squash) * 0.4, squash, 1 + (1 - squash) * 0.4)
      // modelo final sem esqueleto: os tiques de cabeça, orelha e rabo viram balanços do corpo todo
      if (!p.head) p.body.rotation.set(headPitch * 0.35, headYaw * 0.5 + tailWag * 0.25, earWiggle * 0.3)
    }
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
        <CharacterModel ref={parts} id={animal} />
      </group>
      <Bag animal={animal} />
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
      <Puff />
      {animal && <Visitor key={animal} animal={animal} />}
    </>
  )
}
