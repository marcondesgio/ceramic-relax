import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Object3D,
  PlaneGeometry,
  Vector3,
  type InstancedMesh,
  type MeshBasicMaterial,
} from 'three'
import {
  curtainTextures,
  paintedSlatTextures,
  rugTextures,
  wallpaperTextures,
  woodFloorTextures,
} from './textures'
import { Landscape, windowClipPlanes } from './Landscape'
import { PottedPlant } from './PottedPlant'
import { timeRuntime } from './timeOfDay'
import { WallShelf } from './WallShelf'

// Ateliê provisório com formas simples: usado enquanto não há GLB (ver scene/models.ts)

const WOOD = '#E8C39A'
const PEACH = '#FFD9C0'
const SAGE = '#C9DDC4'

function Mat({ color, rough = 0.92 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} />
}

const FLOOR_SIZE = 30
const WALL_Z = -4.6

/** Ripado do rodapé: ripas de verdade (uma só chamada de desenho com InstancedMesh) */
function Wainscot() {
  const SLAT_W = 0.19
  const GAP = 0.045
  const BOTTOM = 0.22 // altura do rodapé liso embaixo
  const TOP = 1.45 // o friso fica logo acima
  const count = Math.ceil(FLOOR_SIZE / (SLAT_W + GAP))
  const ref = useRef<InstancedMesh>(null)
  const slat = paintedSlatTextures()

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const dummy = new Object3D()
    const tint = new Color()
    for (let i = 0; i < count; i++) {
      dummy.position.set(-FLOOR_SIZE / 2 + SLAT_W / 2 + i * (SLAT_W + GAP), (BOTTOM + TOP) / 2, WALL_Z + 0.13)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      // cada ripa com um tom levemente diferente, como tinta à mão
      const k = 0.96 + ((i * 37) % 9) / 200
      m.setColorAt(i, tint.setScalar(k))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  return (
    <group>
      {/* fundo atrás das ripas, um tom mais escuro: aparece nos vãos */}
      <mesh position={[0, (BOTTOM + TOP) / 2, WALL_Z + 0.05]} receiveShadow>
        <boxGeometry args={[FLOOR_SIZE, TOP - BOTTOM, 0.1]} />
        <Mat color="#EBB89C" />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[SLAT_W, TOP - BOTTOM, 0.06]} />
        <meshStandardMaterial color={PEACH} map={slat.map} bumpMap={slat.bump} bumpScale={0.6} roughness={0.8} />
      </instancedMesh>
      {/* rodapé liso embaixo */}
      <RoundedBox args={[FLOOR_SIZE, BOTTOM, 0.22]} radius={0.04} position={[0, BOTTOM / 2, WALL_Z + 0.12]} receiveShadow>
        <Mat color="#E9AD8E" />
      </RoundedBox>
      {/* friso creme em cima */}
      <RoundedBox args={[FLOOR_SIZE, 0.14, 0.32]} radius={0.06} position={[0, 1.52, WALL_Z + 0.15]} receiveShadow castShadow>
        <Mat color="#F2C9AE" />
      </RoundedBox>
    </group>
  )
}

/** Tapete redondo de lã, com borda arredondada */
function Rug() {
  const rug = rugTextures()
  return (
    <group position={[0, 0, 0.2]}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[2.9, 2.9, 0.04, 96]} />
        {/* lateral, tampa (desenho do tapete) e fundo */}
        <meshStandardMaterial attach="material-0" color="#C3B8E6" roughness={1} />
        <meshStandardMaterial attach="material-1" map={rug.map} bumpMap={rug.bump} bumpScale={1.2} roughness={1} />
        <meshStandardMaterial attach="material-2" color="#C3B8E6" roughness={1} />
      </mesh>
      {/* acabamento da borda (viés) */}
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[2.9, 0.035, 8, 96]} />
        <Mat color="#BDB1E2" rough={1} />
      </mesh>
    </group>
  )
}

function Room() {
  const floor = woodFloorTextures(FLOOR_SIZE)
  const wall = wallpaperTextures(FLOOR_SIZE, 10)
  return (
    <group>
      {/* piso de tábuas de madeira */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial map={floor.map} bumpMap={floor.bump} bumpScale={1.5} roughness={0.75} />
      </mesh>
      {/* parede com papel de parede */}
      <mesh position={[0, 5, WALL_Z]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, 10]} />
        <meshStandardMaterial map={wall.map} bumpMap={wall.bump} bumpScale={0.6} roughness={0.95} />
      </mesh>
      <Wainscot />
      <Rug />
    </group>
  )
}

/** Cortina de tecido com dobras de verdade (a luz marca cada prega) e varão de madeira */
function Curtain() {
  const fabric = curtainTextures()
  const geometry = useMemo(() => {
    const W = 0.95
    const H = 3.3
    const g = new PlaneGeometry(W, H, 40, 8)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // pregas: mais fundas embaixo, franzidas perto do varão
      const t = (x / W + 0.5) * Math.PI * 2 * 3.5
      const depth = 0.05 + (0.5 - y / H) * 0.04
      pos.setZ(i, Math.sin(t) * depth)
    }
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <group>
      <mesh geometry={geometry} position={[-1.78, -0.02, 0.32]} castShadow receiveShadow>
        <meshStandardMaterial map={fabric.map} bumpMap={fabric.bump} bumpScale={0.8} roughness={0.95} side={DoubleSide} />
      </mesh>
      {/* varão com ponteiras */}
      <mesh position={[-0.3, 1.66, 0.36]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 3.6, 12]} />
        <Mat color={WOOD} rough={0.6} />
      </mesh>
      {[-2.1, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.66, 0.36]} castShadow>
          <sphereGeometry args={[0.07, 16, 12]} />
          <Mat color={WOOD} rough={0.6} />
        </mesh>
      ))}
      {/* argolinhas segurando a cortina */}
      {[-2.15, -1.95, -1.75, -1.55, -1.35].map((x) => (
        <mesh key={x} position={[x + 0.02, 1.66, 0.36]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.05, 0.012, 6, 16]} />
          <Mat color="#D9AE82" rough={0.6} />
        </mesh>
      ))}
    </group>
  )
}

const WINDOW_POS = new Vector3(-2.6, 3.7, -4.5)
const WINDOW_CLIP = windowClipPlanes(WINDOW_POS)

/**
 * Feixe de luz suave entrando pela janela até o chão (cor e força seguem o horário).
 * Mistura aditiva: só clareia, nunca escurece o que está atrás.
 */
function LightBeam() {
  const mat = useRef<MeshBasicMaterial>(null)
  const geometry = useMemo(() => {
    // trapézio: largura da janela em cima, mais largo e mais perto da câmera no chão
    const g = new BufferGeometry()
    const v = new Float32Array([
      -3.75, 4.9, -4.42, -1.45, 4.9, -4.42, -0.6, 0.02, -0.9, -3.3, 0.02, -0.4,
    ])
    g.setAttribute('position', new BufferAttribute(v, 3))
    // alfa por vértice via uv: forte em cima, some no chão
    g.setAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), 2))
    g.setIndex([0, 3, 1, 1, 3, 2])
    return g
  }, [])
  const fade = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 128
    const ctx = c.getContext('2d')!
    const v = ctx.createLinearGradient(0, 0, 0, 128)
    v.addColorStop(0, 'rgba(255,255,255,0.9)')
    v.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, 64, 128)
    // bordas laterais suaves
    const h = ctx.createLinearGradient(0, 0, 64, 0)
    h.addColorStop(0, 'rgba(0,0,0,1)')
    h.addColorStop(0.25, 'rgba(0,0,0,0)')
    h.addColorStop(0.75, 'rgba(0,0,0,0)')
    h.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = h
    ctx.fillRect(0, 0, 64, 128)
    return new CanvasTexture(c)
  }, [])

  useFrame(() => {
    const m = mat.current
    if (!m) return
    const p = timeRuntime.palette
    m.color.copy(p.beam)
    m.opacity = p.beamOpacity
  })

  return (
    <mesh geometry={geometry} renderOrder={5}>
      <meshBasicMaterial
        ref={mat}
        map={fade}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

function Window() {
  return (
    <group position={WINDOW_POS}>
      {/* paisagem que muda com o horário (recortada no vão da janela) */}
      <Landscape clip={WINDOW_CLIP} />
      {/* moldura e travessas em sálvia */}
      {[
        { p: [0, 1.4, 0.12], s: [2.8, 0.18, 0.2] },
        { p: [0, -1.4, 0.16], s: [3.1, 0.2, 0.36] },
        { p: [-1.32, 0, 0.12], s: [0.18, 2.95, 0.2] },
        { p: [1.32, 0, 0.12], s: [0.18, 2.95, 0.2] },
        { p: [0, 0, 0.1], s: [0.1, 2.7, 0.12] },
        { p: [0, 0.2, 0.1], s: [2.5, 0.1, 0.12] },
      ].map((b, i) => (
        <RoundedBox
          key={i}
          args={b.s as [number, number, number]}
          radius={0.04}
          position={b.p as [number, number, number]}
          castShadow
          receiveShadow
        >
          <Mat color={SAGE} />
        </RoundedBox>
      ))}
      <Curtain />
    </group>
  )
}

export function PlaceholderAtelier() {
  return (
    <group>
      <Room />
      <Window />
      <LightBeam />
      {/* entre a janela e o forno, onde a câmera enxerga */}
      <WallShelf position={[1.1, 0, -4.2]} />
      <PottedPlant position={[-5.7, 0, -3.6]} />
    </group>
  )
}
