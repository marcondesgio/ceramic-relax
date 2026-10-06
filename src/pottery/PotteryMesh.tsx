import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import { LatheGeometry, MeshStandardMaterial, Vector2, type BufferGeometry, type Group, type Mesh } from 'three'
import { useGameStore } from '../store/useGameStore'
import { WHEEL_TOP_Y, wheelRuntime } from '../wheel/wheelRuntime'
import { createClayTexture } from './clayTexture'
import {
  INNER_POINT_COUNT,
  OUTER_POINT_COUNT,
  writeInnerPoints,
  writeOuterPoints,
  type Profile,
} from './profile'
import { potteryRuntime } from './potteryRuntime'
import { getGlazeMaterials } from '../paint/glazeMaterial'

const SEGMENTS = 64

/** Cria a LatheGeometry uma única vez, com a quantidade fixa de pontos */
function makeLathe(count: number) {
  const pts = Array.from({ length: count }, (_, j) => new Vector2(0.5, j * 0.01))
  return new LatheGeometry(pts, SEGMENTS)
}

// senos e cossenos de cada coluna da revolução (mesma ordem da LatheGeometry)
const SIN = new Float32Array(SEGMENTS + 1)
const COS = new Float32Array(SEGMENTS + 1)
for (let i = 0; i <= SEGMENTS; i++) {
  const phi = (i / SEGMENTS) * Math.PI * 2
  SIN[i] = Math.sin(phi)
  COS[i] = Math.cos(phi)
}

/**
 * Atualiza só o buffer de posições a partir dos pontos (r, y) e recalcula as normais.
 * `firstAxis`/`lastAxis` dão a normal vertical (±1) dos pontos que ficam sobre o eixo.
 */
function updateLathe(geo: BufferGeometry, pts: Float32Array, count: number, firstAxis: number, lastAxis: number) {
  const pos = geo.attributes.position.array as Float32Array
  for (let i = 0; i <= SEGMENTS; i++) {
    for (let j = 0; j < count; j++) {
      const k = (i * count + j) * 3
      const r = pts[j * 2]
      pos[k] = r * SIN[i]
      pos[k + 1] = pts[j * 2 + 1]
      pos[k + 2] = r * COS[i]
    }
  }
  geo.attributes.position.needsUpdate = true
  geo.computeVertexNormals()

  // a costura (coluna 0 = coluna final) precisa da mesma normal dos dois lados
  const nrm = geo.attributes.normal.array as Float32Array
  const last = SEGMENTS * count
  for (let j = 0; j < count; j++) {
    const a = j * 3
    const b = (last + j) * 3
    for (let c = 0; c < 3; c++) {
      const avg = (nrm[a + c] + nrm[b + c]) / 2
      nrm[a + c] = avg
      nrm[b + c] = avg
    }
  }
  for (let i = 0; i <= SEGMENTS; i++) {
    if (firstAxis) nrm.set([0, firstAxis, 0], i * count * 3)
    if (lastAxis) nrm.set([0, lastAxis, 0], (i * count + count - 1) * 3)
  }
  geo.attributes.normal.needsUpdate = true
  geo.computeBoundingSphere()
  geo.computeBoundingBox()
}

/**
 * UV do torno: U = ângulo (já vem da LatheGeometry), V = comprimento ao longo do perfil.
 * Usar o comprimento (e não o índice do ponto) deixa os pincéis com o mesmo tamanho
 * em qualquer altura. `skip` pontos iniciais ficam com V = 0 (o fundo, que não aparece).
 * `reverse` faz V = 1 começar no primeiro ponto (parede interna desce da borda).
 * Retorna o comprimento total do perfil.
 */
function updateUVs(geo: BufferGeometry, pts: Float32Array, count: number, skip: number, reverse: boolean) {
  const along = new Float32Array(count)
  let total = 0
  for (let j = skip + 1; j < count; j++) {
    total += Math.hypot(pts[j * 2] - pts[j * 2 - 2], pts[j * 2 + 1] - pts[j * 2 - 1])
    along[j] = total
  }
  total = Math.max(total, 1e-4)
  const uv = geo.attributes.uv.array as Float32Array
  for (let i = 0; i <= SEGMENTS; i++) {
    for (let j = 0; j < count; j++) {
      const t = along[j] / total
      uv[(i * count + j) * 2 + 1] = reverse ? 1 - t : t
    }
  }
  geo.attributes.uv.needsUpdate = true
  return total
}

export function PotteryMesh() {
  const spinner = useRef<Group>(null)
  const outer = useRef<Mesh>(null)
  const inner = useRef<Mesh>(null)
  const lastVersion = useRef(-1)
  const lastProfile = useRef<Profile | null>(null)

  const pieceId = useGameStore((s) => s.pieceId)
  // na tela inicial o torno fica vazio; a bola cai quando o jogador começa
  const visible = useGameStore((s) => s.phase !== 'home')
  const droppedPiece = useRef(-1)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)

  const outerGeo = useMemo(() => makeLathe(OUTER_POINT_COUNT), [])
  const innerGeo = useMemo(() => makeLathe(INNER_POINT_COUNT), [])
  const outerPts = useMemo(() => new Float32Array(OUTER_POINT_COUNT * 2), [])
  const innerPts = useMemo(() => new Float32Array(INNER_POINT_COUNT * 2), [])
  const clayMap = useMemo(() => createClayTexture(), [])
  const clay = useMemo(
    () => ({
      outer: new MeshStandardMaterial({ map: clayMap, roughness: 0.62, metalness: 0 }),
      inner: new MeshStandardMaterial({ map: clayMap, color: '#E7CBBE', roughness: 0.7, metalness: 0 }),
    }),
    [clayMap],
  )
  // da pintura em diante a peça vira biscoito com o esmalte por cima
  const glazed = useGameStore((s) => s.phase !== 'home' && s.phase !== 'modeling')
  const glaze = useMemo(() => getGlazeMaterials(), [])
  const carrier = useRef<Group>(null)

  useEffect(
    () => () => {
      outerGeo.dispose()
      innerGeo.dispose()
      clayMap.dispose()
      // os materiais de esmalte são compartilhados (prévias e foto) e vivem o jogo todo
      for (const m of [clay.outer, clay.inner]) m.dispose()
    },
    [outerGeo, innerGeo, clayMap, clay],
  )

  // "ploft": a bola cai no torno e dá uma achatadinha
  const [drop, api] = useSpring(() => ({ y: 0, squash: 1 }))
  useEffect(() => {
    if (!visible || droppedPiece.current === pieceId) return
    droppedPiece.current = pieceId
    if (reduceMotion) {
      api.set({ y: 0, squash: 1 })
      return
    }
    api.set({ y: 2.6, squash: 1 })
    api.start({
      to: async (next) => {
        await next({ y: 0, config: { tension: 260, friction: 18, clamp: true } })
        await next({ squash: 0.82, config: { tension: 600, friction: 20 } })
        await next({ squash: 1, config: { tension: 220, friction: 9 } })
      },
    })
  }, [pieceId, visible, reduceMotion, api])

  useEffect(() => {
    potteryRuntime.group = spinner.current
    potteryRuntime.outer = outer.current
    potteryRuntime.inner = inner.current
    return () => {
      potteryRuntime.group = null
      potteryRuntime.outer = null
      potteryRuntime.inner = null
    }
  }, [])

  useFrame((state, delta) => {
    const profile = useGameStore.getState().profile
    // só refaz as posições quando o perfil mudou
    if (profile !== lastProfile.current || profile.version !== lastVersion.current) {
      writeOuterPoints(profile, outerPts)
      writeInnerPoints(profile, innerPts)
      updateLathe(outerGeo, outerPts, OUTER_POINT_COUNT, -1, 0)
      updateLathe(innerGeo, innerPts, INNER_POINT_COUNT, 0, 1)
      // o fundo externo (2 primeiros pontos) não recebe pintura
      potteryRuntime.outerLength = updateUVs(outerGeo, outerPts, OUTER_POINT_COUNT, 1, false)
      potteryRuntime.innerLength = updateUVs(innerGeo, innerPts, INNER_POINT_COUNT, 0, true)
      lastVersion.current = profile.version
      lastProfile.current = profile
    }

    // fora do torno (forno e prateleira) quem manda na posição é o FiringController
    const c = carrier.current
    const pose = potteryRuntime.carrier
    if (c) {
      if (pose.override) {
        c.position.copy(pose.position)
        c.scale.setScalar(pose.scale)
        c.visible = pose.visible
      } else {
        c.position.set(0, WHEEL_TOP_Y, 0)
        c.scale.setScalar(1)
        c.visible = true
      }
    }

    if (spinner.current) {
      const phase = useGameStore.getState().phase
      spinner.current.rotation.y =
        phase === 'firing' || phase === 'result' ? potteryRuntime.displayAngle : wheelRuntime.angle
      // tremidinha quando a parede chega no limite
      const j = potteryRuntime.jitter
      spinner.current.position.x = j > 0 ? Math.sin(state.clock.elapsedTime * 80) * 0.012 * j : 0
      potteryRuntime.jitter = Math.max(0, j - delta * 4)
    }
  })

  const spread = (s: number) => 1 + (1 - s) * 0.6

  return (
    <group ref={carrier} visible={visible}>
      <animated.group position-y={drop.y}>
        <animated.group scale-y={drop.squash} scale-x={drop.squash.to(spread)} scale-z={drop.squash.to(spread)}>
        <group ref={spinner}>
          <mesh
            ref={outer}
            geometry={outerGeo}
            material={glazed ? glaze.outer : clay.outer}
            castShadow
            receiveShadow
          />
          <mesh
            ref={inner}
            geometry={innerGeo}
            material={glazed ? glaze.inner : clay.inner}
            castShadow
            receiveShadow
          />
          </group>
        </animated.group>
      </animated.group>
    </group>
  )
}
