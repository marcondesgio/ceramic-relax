import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  Color,
  MeshBasicMaterial,
  Object3D,
  Plane,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
} from 'three'
import { timeRuntime } from './timeOfDay'

// Paisagem vista pela janela: céu em degradê, sol/lua, estrelas, montanhas, morros,
// arvorezinhas, uma casinha (janela acesa à noite), nuvens e passarinhos.
// Tudo recortado no vão da janela por planos de corte.

const W = 2.5
const H = 2.7
const EDGE = 1.7 // as formas passam da borda e são recortadas

/** Planos de corte no espaço do mundo para o vão da janela (centro e tamanho) */
export function windowClipPlanes(center: Vector3) {
  return [
    new Plane(new Vector3(1, 0, 0), -(center.x - W / 2)),
    new Plane(new Vector3(-1, 0, 0), center.x + W / 2),
    new Plane(new Vector3(0, 1, 0), -(center.y - H / 2)),
    new Plane(new Vector3(0, -1, 0), center.y + H / 2),
  ]
}

/** Linha de morros: soma de senos (suave, sem quinas) */
function ridgeShape(base: number, amp: number, freq: number, phase: number, bottom = -H) {
  const s = new Shape()
  s.moveTo(-EDGE, bottom)
  for (let i = 0; i <= 48; i++) {
    const x = -EDGE + (i / 48) * EDGE * 2
    const y = base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.35
    s.lineTo(x, y)
  }
  s.lineTo(EDGE, bottom)
  s.closePath()
  return new ShapeGeometry(s, 4)
}

/** Montanhas ao longe com picos arredondados */
function mountainShape() {
  const s = new Shape()
  const base = -0.5
  s.moveTo(-EDGE, base - 1)
  s.lineTo(-EDGE, base)
  const peaks = [
    [-1.2, 0.25],
    [-0.45, 0.05],
    [0.25, 0.32],
    [1.05, 0.1],
  ]
  let x0 = -EDGE
  for (const [px, py] of peaks) {
    // subida e descida com curvas: picos fofos
    s.quadraticCurveTo((x0 + px) / 2, base + (py - base) * 0.2, px - 0.12, py - 0.02)
    s.quadraticCurveTo(px, py + 0.06, px + 0.12, py - 0.02)
    x0 = px + 0.12
  }
  s.quadraticCurveTo((x0 + EDGE) / 2, base, EDGE, base)
  s.lineTo(EDGE, base - 1)
  s.closePath()
  return new ShapeGeometry(s, 8)
}

function circle(r: number) {
  const s = new Shape()
  s.absarc(0, 0, r, 0, Math.PI * 2, false)
  return new ShapeGeometry(s, 24)
}

function triangle(w: number, h: number) {
  const s = new Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(0, h)
  s.closePath()
  return new ShapeGeometry(s)
}

const STAR_COUNT = 34
const CLOUDS = [
  { x: -0.7, y: 0.85, s: 1 },
  { x: 0.55, y: 0.55, s: 0.75 },
  { x: 1.3, y: 1.0, s: 0.6 },
]
const TREES = [
  { x: -1.0, y: -0.62, r: 0.11 },
  { x: -0.78, y: -0.66, r: 0.08 },
  { x: 0.05, y: -0.58, r: 0.12 },
  { x: 1.05, y: -0.66, r: 0.09 },
]

export function Landscape({ clip }: { clip: Plane[] }) {
  // um material por papel; as cores mudam a cada quadro conforme o horário
  const m = useMemo(() => {
    const make = (opts: ConstructorParameters<typeof MeshBasicMaterial>[0] = {}) =>
      new MeshBasicMaterial({ toneMapped: false, clippingPlanes: clip, ...opts })
    return {
      sky: make({ vertexColors: true }),
      sunGlow: make({ transparent: true, opacity: 0.5, depthWrite: false }),
      sun: make(),
      moonGlow: make({ color: '#FFF4D6', transparent: true, opacity: 0, depthWrite: false }),
      moon: make({ color: '#FFF4D6', transparent: true, opacity: 0 }),
      crater: make({ color: '#EADFC0', transparent: true, opacity: 0 }),
      stars: make({ color: '#FFF4E6', transparent: true, opacity: 0, depthWrite: false }),
      mountains: make(),
      hillFar: make(),
      hillMid: make(),
      hillNear: make(),
      tree: make(),
      trunk: make(),
      house: make(),
      roof: make(),
      houseWindow: make(),
      houseGlow: make({ color: '#FFD98A', transparent: true, opacity: 0, depthWrite: false }),
      cloud: make({ transparent: true, depthWrite: false }),
      bird: make({ color: '#6B4F3F', transparent: true }),
    }
  }, [clip])

  const geo = useMemo(
    () => ({
      sky: new PlaneGeometry(W, H),
      mountains: mountainShape(),
      hillFar: ridgeShape(-0.5, 0.06, 2.1, 0.4),
      hillMid: ridgeShape(-0.66, 0.07, 1.6, 2.1),
      hillNear: ridgeShape(-1.02, 0.09, 1.3, 4.2),
      sun: circle(0.24),
      sunGlow: circle(0.46),
      moon: circle(0.18),
      moonGlow: circle(0.36),
      crater: circle(0.035),
      star: circle(0.016),
      puff: circle(0.13),
      crown: circle(1),
      pine: triangle(0.16, 0.32),
      roof: triangle(0.3, 0.13),
    }),
    [],
  )

  // céu em degradê: cor por vértice (2 de cima, 2 de baixo)
  useLayoutEffect(() => {
    geo.sky.setAttribute('color', new BufferAttribute(new Float32Array(4 * 3), 3))
  }, [geo])

  const sun = useRef<Group>(null)
  const moon = useRef<Group>(null)
  const stars = useRef<InstancedMesh>(null)
  const clouds = useRef<Group>(null)
  const birds = useRef<Group>(null)

  const starSeeds = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        x: ((i * 0.6180339) % 1) * W - W / 2,
        y: 0.05 + ((i * 0.7548776) % 1) * (H / 2 - 0.1),
        s: 0.6 + ((i * 0.33) % 1) * 0.9,
        ph: i * 1.7,
      })),
    [],
  )
  const dummy = useMemo(() => new Object3D(), [])
  const tmp = useMemo(() => new Color(), [])

  useFrame(({ clock }, delta) => {
    const p = timeRuntime.palette
    const t = clock.elapsedTime

    // céu
    const col = geo.sky.attributes.color as BufferAttribute
    // ordem dos vértices do PlaneGeometry: topo-esq, topo-dir, base-esq, base-dir
    col.setXYZ(0, p.skyTop.r, p.skyTop.g, p.skyTop.b)
    col.setXYZ(1, p.skyTop.r, p.skyTop.g, p.skyTop.b)
    col.setXYZ(2, p.skyBottom.r, p.skyBottom.g, p.skyBottom.b)
    col.setXYZ(3, p.skyBottom.r, p.skyBottom.g, p.skyBottom.b)
    col.needsUpdate = true

    // sol (desce atrás dos morros à noite)
    m.sun.color.copy(p.sun)
    m.sunGlow.color.copy(p.sunGlow)
    if (sun.current) sun.current.position.set(p.sunX * (W / 2), p.sunY * (H / 2), 0.044)

    // lua sobe enquanto escurece
    m.moon.opacity = p.moon
    m.crater.opacity = p.moon * 0.8
    m.moonGlow.opacity = p.moon * 0.22
    if (moon.current) moon.current.position.set(0.62, -1.0 + p.moon * 1.75, 0.043)

    // estrelas piscando
    m.stars.opacity = p.stars
    const st = stars.current
    if (st && p.stars > 0.01) {
      starSeeds.forEach((sd, i) => {
        dummy.position.set(sd.x, sd.y, 0)
        dummy.scale.setScalar(sd.s * (0.75 + Math.sin(t * 2 + sd.ph) * 0.25))
        dummy.updateMatrix()
        st.setMatrixAt(i, dummy.matrix)
      })
      st.instanceMatrix.needsUpdate = true
    }

    m.mountains.color.copy(p.mountains)
    m.hillFar.color.copy(p.hillFar)
    m.hillMid.color.copy(p.hillMid)
    m.hillNear.color.copy(p.hillNear)
    m.tree.color.copy(p.tree)
    m.trunk.color.copy(p.trunk)
    m.house.color.copy(p.house)
    m.roof.color.copy(p.roof)
    // janelinha da casa: creme de dia, amarelo quentinho à noite
    m.houseWindow.color.copy(tmp.set('#E9E2D6')).lerp(tmp.set('#FFD36B'), p.houseLight)
    m.houseGlow.opacity = p.houseLight * 0.35

    // nuvens passando devagar
    m.cloud.color.copy(p.cloud)
    m.cloud.opacity = p.cloudOpacity
    const cl = clouds.current
    if (cl) {
      cl.children.forEach((c, i) => {
        c.position.x += Math.min(delta, 0.1) * (0.025 + i * 0.008)
        if (c.position.x > EDGE + 0.3) c.position.x = -EDGE - 0.3
      })
    }

    // passarinhos de manhã e à tarde, batendo as asas
    m.bird.opacity = p.birds
    const b = birds.current
    if (b) {
      b.visible = p.birds > 0.02
      b.position.x += Math.min(delta, 0.1) * 0.06
      if (b.position.x > EDGE) b.position.x = -EDGE
      b.children.forEach((bird, i) => {
        const flap = Math.sin(t * 7 + i * 1.3) * 0.5
        bird.children[0].rotation.z = 0.5 + flap
        bird.children[1].rotation.z = -0.5 - flap
      })
    }
  })

  return (
    <group>
      <mesh geometry={geo.sky} material={m.sky} position={[0, 0, 0.04]} />

      {/* estrelas */}
      <instancedMesh ref={stars} args={[geo.star, m.stars, STAR_COUNT]} position={[0, 0, 0.042]} />

      {/* lua com crateras e brilho */}
      <group ref={moon} position={[0.62, -1, 0.043]}>
        <mesh geometry={geo.moonGlow} material={m.moonGlow} />
        <mesh geometry={geo.moon} material={m.moon} position={[0, 0, 0.001]} />
        <mesh geometry={geo.crater} material={m.crater} position={[-0.05, 0.04, 0.002]} />
        <mesh geometry={geo.crater} material={m.crater} position={[0.06, -0.05, 0.002]} scale={0.7} />
      </group>

      {/* sol com halo */}
      <group ref={sun} position={[0, 0, 0.044]}>
        <mesh geometry={geo.sunGlow} material={m.sunGlow} />
        <mesh geometry={geo.sun} material={m.sun} position={[0, 0, 0.001]} />
      </group>

      {/* nuvens (cada uma com 3 bolinhas) */}
      <group ref={clouds} position={[0, 0, 0.046]}>
        {CLOUDS.map((c, i) => (
          <group key={i} position={[c.x, c.y, 0]} scale={c.s}>
            <mesh geometry={geo.puff} material={m.cloud} position={[-0.15, 0, 0]} />
            <mesh geometry={geo.puff} material={m.cloud} position={[0, 0.07, 0.001]} scale={1.25} />
            <mesh geometry={geo.puff} material={m.cloud} position={[0.16, 0, 0.002]} />
          </group>
        ))}
      </group>

      {/* passarinhos */}
      <group ref={birds} position={[-0.8, 0.45, 0.047]}>
        {[
          [0, 0],
          [0.16, 0.07],
          [0.3, -0.02],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, 0]} scale={0.8 + i * 0.1}>
            <mesh material={m.bird} position={[-0.02, 0, 0]}>
              <planeGeometry args={[0.05, 0.008]} />
            </mesh>
            <mesh material={m.bird} position={[0.02, 0, 0]}>
              <planeGeometry args={[0.05, 0.008]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* camadas: montanhas → morros → árvores/casa → morro da frente */}
      <mesh geometry={geo.mountains} material={m.mountains} position={[0, 0, 0.05]} />
      <mesh geometry={geo.hillFar} material={m.hillFar} position={[0, 0, 0.052]} />

      {/* casinha no morro do fundo */}
      <group position={[0.72, -0.5, 0.054]}>
        <mesh material={m.houseGlow} position={[-0.05, 0.07, 0.003]}>
          <circleGeometry args={[0.07, 24]} />
        </mesh>
        <mesh material={m.house} position={[0, 0.07, 0]}>
          <planeGeometry args={[0.24, 0.15]} />
        </mesh>
        <mesh geometry={geo.roof} material={m.roof} position={[0, 0.145, 0.001]} />
        <mesh material={m.roof} position={[0.07, 0.2, -0.0005]}>
          <planeGeometry args={[0.035, 0.08]} />
        </mesh>
        <mesh material={m.houseWindow} position={[-0.05, 0.07, 0.002]}>
          <planeGeometry args={[0.055, 0.055]} />
        </mesh>
        <mesh material={m.trunk} position={[0.06, 0.045, 0.002]}>
          <planeGeometry args={[0.045, 0.09]} />
        </mesh>
      </group>

      <mesh geometry={geo.hillMid} material={m.hillMid} position={[0, 0, 0.056]} />

      {/* arvorezinhas no morro do meio */}
      {TREES.map((tr, i) => (
        <group key={i} position={[tr.x, tr.y, 0.058]}>
          <mesh material={m.trunk} position={[0, tr.r * 0.8, 0]}>
            <planeGeometry args={[0.025, tr.r * 1.6]} />
          </mesh>
          <mesh geometry={geo.crown} material={m.tree} position={[0, tr.r * 1.9, 0.001]} scale={tr.r} />
        </group>
      ))}
      <mesh geometry={geo.pine} material={m.tree} position={[-0.35, -0.62, 0.058]} />
      <mesh geometry={geo.pine} material={m.tree} position={[0.42, -0.66, 0.058]} scale={0.8} />

      <mesh geometry={geo.hillNear} material={m.hillNear} position={[0, 0, 0.06]} />
    </group>
  )
}
