import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, MathUtils, type Group, type Mesh, type MeshStandardMaterial, type PointLight } from 'three'
import { DOOR_CENTER_Y, DOOR_RADIUS, DOOR_Z, KILN_POS, KILN_ROT_Y } from './kilnLayout'
import { kilnRuntime } from './kilnRuntime'

// paleta: corpo em azul céu, acabamentos em amarelo manteiga
const BODY = '#B9DDF2'
const TRIM = '#FBE3A0'
/** interior escuro atrás da porta: o mesmo azul, mais profundo */
const INSIDE = '#8DB4D2'
const CREAM = '#FFF4E6'
const FACE = '#6B4F3F' // marrom suave: nada de preto
const BLUSH = '#F4A08E'
const RED = '#F08A7A'

const BODY_R = 1.18
const BODY_DEPTH = 0.78 // achata o cilindro na frente (fica oval visto de cima)
/** boca atrás da porta: raio e profundidade (logo à frente do ponto mais saliente do corpo) */
const MOUTH_R = DOOR_RADIUS * 0.83 // acima da faixa amarela da base
const MOUTH_Z = BODY_R * BODY_DEPTH + 0.015

const ORANGE = new Color('#FF9A4D')
const GOLD = new Color('#FFD36B')
const COLD = new Color('#F6E7D8')

function Mat({ color, rough = 0.8 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} />
}

/** Rostinho sorridente (olhos, bochechas e sorriso) */
function Face({ y, z, scale = 1, blink }: { y: number; z: number; scale?: number; blink?: React.Ref<Group> }) {
  return (
    <group position={[0, y, z]} scale={scale}>
      <group ref={blink}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.3, 0.1, 0]} scale={[1, 1.2, 0.5]}>
            <sphereGeometry args={[0.065, 16, 12]} />
            <Mat color={FACE} rough={0.5} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.52, -0.04, -0.01]} scale={[1.4, 0.8, 0.3]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial color={BLUSH} transparent opacity={0.65} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.01, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.12, 0.028, 8, 24, Math.PI]} />
        <Mat color={FACE} rough={0.5} />
      </mesh>
    </group>
  )
}

/** Termômetro sorridente ao lado do forno: a coluna sobe e brilha junto com a janelinha */
function Thermometer() {
  const fill = useRef<Mesh>(null)
  const fillMat = useRef<MeshStandardMaterial>(null)
  const bulbMat = useRef<MeshStandardMaterial>(null)
  const glassMat = useRef<MeshStandardMaterial>(null)

  useEffect(() => {
    kilnRuntime.thermoFill = fill.current
  }, [])

  useFrame(({ clock }) => {
    const hot = MathUtils.clamp(kilnRuntime.heat, 0, 1)
    // pulsa de leve enquanto esquenta, como a janelinha "respirando"
    const pulse = 1 + Math.sin(clock.elapsedTime * 6) * 0.12 * hot
    // mesma passagem de cor da janelinha: laranja → dourado
    const k = MathUtils.smoothstep(hot, 0.35, 1)
    for (const m of [fillMat.current, bulbMat.current]) {
      if (!m) continue
      m.emissive.copy(ORANGE).lerp(GOLD, k)
      // um brilhinho mínimo em repouso para o termômetro não parecer apagado
      m.emissiveIntensity = 0.12 + hot * 1.15 * pulse
    }
    if (glassMat.current) {
      glassMat.current.emissive.copy(GOLD)
      glassMat.current.emissiveIntensity = hot * 0.4 * pulse
      glassMat.current.opacity = 0.4 + hot * 0.25
    }
  })

  return (
    <group position={[1.62, 0, 0.45]}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <capsuleGeometry args={[0.11, 1.3, 8, 16]} />
        {/* vidro: transparente o bastante para ver a coluna subir; ganha um halo quente na queima */}
        <meshStandardMaterial ref={glassMat} color={CREAM} roughness={0.3} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* coluna vermelha: a altura acompanha o calor */}
      <mesh ref={fill} position={[0, 0.55, 0.02]}>
        <cylinderGeometry args={[0.055, 0.055, 1, 12]} />
        <meshStandardMaterial ref={fillMat} color={RED} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.22, 24, 16]} />
        <meshStandardMaterial ref={bulbMat} color={RED} roughness={0.5} />
      </mesh>
      <Face y={0.46} z={0.2} scale={0.5} />
    </group>
  )
}

/** Forninho redondo e fofo, com porta de janelinha que brilha na queima */
export function Kiln() {
  const body = useRef<Group>(null)
  const door = useRef<Group>(null)
  const windowMat = useRef<MeshStandardMaterial>(null)
  const glow = useRef<PointLight>(null)
  const eyes = useRef<Group>(null)

  useEffect(() => {
    kilnRuntime.body = body.current
    kilnRuntime.door = door.current
    kilnRuntime.windowMat = windowMat.current
    kilnRuntime.glow = glow.current
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const k = kilnRuntime
    // porta: gira na dobradiça da esquerda
    if (door.current) door.current.rotation.y = -k.doorOpen * 1.9
    // janelinha: creme → laranja → dourado conforme o calor
    if (windowMat.current) {
      const m = windowMat.current
      const hot = MathUtils.clamp(k.heat, 0, 1)
      m.emissive.copy(ORANGE).lerp(GOLD, MathUtils.smoothstep(hot, 0.35, 1))
      m.emissiveIntensity = hot * 2.2
      m.color.copy(COLD).lerp(GOLD, hot)
    }
    if (glow.current) glow.current.intensity = k.heat * 6
    if (k.thermoFill) {
      const h = MathUtils.clamp(k.thermo, 0.05, 1) * 1.2
      k.thermoFill.scale.y = h
      k.thermoFill.position.y = 0.55 + h / 2
    }
    // respira devagar; esquentando, treme de leve
    if (body.current) {
      const breathe = 1 + Math.sin(t * 1.6) * 0.008 + k.heat * Math.sin(t * 22) * 0.012
      body.current.scale.set(1 / Math.sqrt(breathe), breathe, 1 / Math.sqrt(breathe))
    }
    // pisca de vez em quando
    if (eyes.current) eyes.current.scale.y = t % 4.2 < 0.12 ? 0.15 : 1
  })

  return (
    <group position={KILN_POS} rotation-y={KILN_ROT_Y}>
      <group ref={body}>
        {/* pezinhos */}
        {[
          [-0.8, 0.55],
          [0.8, 0.55],
          [-0.8, -0.55],
          [0.8, -0.55],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.12, z]} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 0.24, 16]} />
            <Mat color={TRIM} />
          </mesh>
        ))}
        {/* corpo redondo: cilindro achatado na frente + cúpula + borda de baixo arredondada */}
        <group scale={[1, 1, BODY_DEPTH]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[BODY_R, BODY_R, 1.9, 48]} />
            <Mat color={BODY} />
          </mesh>
          <mesh position={[0, 2.15, 0]} castShadow>
            <sphereGeometry args={[BODY_R, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color={BODY} />
          </mesh>
          <mesh position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[BODY_R - 0.1, 0.1, 12, 48]} />
            <Mat color={BODY} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[BODY_R - 0.1, BODY_R - 0.1, 0.12, 48]} />
            <Mat color={BODY} />
          </mesh>
          {/* faixa na base */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[BODY_R + 0.03, BODY_R + 0.03, 0.14, 48]} />
            <Mat color={TRIM} />
          </mesh>
        </group>
        {/* chaminé */}
        <mesh position={[0.45, 3.05, -0.15]} castShadow>
          <cylinderGeometry args={[0.16, 0.19, 0.42, 20]} />
          <Mat color={TRIM} />
        </mesh>

        <Face y={2.12} z={0.98} blink={eyes} />

        {/* porta redonda: o grupo fica na dobradiça (lado esquerdo) */}
        <group ref={door} position={[-DOOR_RADIUS, DOOR_CENTER_Y, DOOR_Z]}>
          <group position={[DOOR_RADIUS, 0, 0.05]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[DOOR_RADIUS, DOOR_RADIUS, 0.1, 40]} />
              <Mat color={CREAM} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <torusGeometry args={[DOOR_RADIUS, 0.08, 12, 48]} />
              <Mat color={TRIM} />
            </mesh>
            {/* janelinha */}
            <mesh position={[0, 0, 0.06]}>
              <circleGeometry args={[0.34, 32]} />
              <meshStandardMaterial ref={windowMat} color={COLD} roughness={0.25} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.07]}>
              <torusGeometry args={[0.34, 0.06, 10, 36]} />
              <Mat color={TRIM} />
            </mesh>
            {/* reflexo fofo no vidro */}
            <mesh position={[-0.12, 0.13, 0.075]} rotation={[0, 0, 0.6]} scale={[1, 0.45, 1]}>
              <circleGeometry args={[0.08, 16]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
            </mesh>
            {/* puxador */}
            <mesh position={[DOOR_RADIUS - 0.16, 0, 0.1]}>
              <sphereGeometry args={[0.07, 12, 10]} />
              <Mat color={TRIM} />
            </mesh>
          </group>
        </group>
        {/*
          Boca escura atrás da porta (aparece quando abre). Fica um pouco à frente da parte
          mais saliente do corpo curvo (z = BODY_R × BODY_DEPTH): se ficasse na mesma
          profundidade, a superfície do corpo atravessaria o disco e desenharia um risco no meio.
          Com a porta fechada, o disco fica escondido dentro da espessura da porta.
        */}
        <mesh position={[0, DOOR_CENTER_Y, MOUTH_Z]}>
          <circleGeometry args={[MOUTH_R, 40]} />
          <meshStandardMaterial color={INSIDE} roughness={1} />
        </mesh>
        {/* aro que liga a boca ao corpo: sem fresta quando vista de lado */}
        <mesh position={[0, DOOR_CENTER_Y, MOUTH_Z - 0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[MOUTH_R, MOUTH_R, 0.26, 40, 1, true]} />
          <meshStandardMaterial color={BODY} roughness={0.8} side={DoubleSide} />
        </mesh>
        {/* luz quente da queima */}
        <pointLight ref={glow} position={[0, DOOR_CENTER_Y, DOOR_Z + 0.6]} color="#FFB060" intensity={0} distance={4} />
      </group>
      <Thermometer />
    </group>
  )
}
