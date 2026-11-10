import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from 'three'
import { useGameStore } from '../store/useGameStore'
import { getGlazeMaterials } from '../paint/glazeMaterial'
import { HANDLE_CRACK, applyClayHydration } from '../pottery/crackShader'
import { setFluting } from '../pottery/clayMarks'
import { syncHoles } from '../pottery/holes'
import type { Profile } from '../pottery/profile'
import { MAX_TUBES, buildTube, handleCurve, handlesReach, handlesRuntime, knobPoints, tubeAngles } from './handles'

// Alças da peça: filhas do grupo que gira com a peça (torno, forno, prateleira e foto).
// Um conjunto fixo de malhas é reaproveitado; os tubos só são refeitos quando a alça
// ou a forma da peça mudam (no máximo a cada 3 quadros enquanto a forma muda).

/** Cores dos pontos de controle: altura, abertura, espessura (iguais à legenda da interface) */
export const KNOB_COLORS = ['#B8C3EE', '#AFC8A6', '#F4A08E'] as const

export function PieceHandles({ glazed }: { glazed: boolean }) {
  const clay = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#E3A587', roughness: 0.62, metalness: 0 })
    applyClayHydration(m, HANDLE_CRACK)
    return m
  }, [])
  const glaze = useMemo(() => getGlazeMaterials().handle, [])

  const pool = useMemo(
    () =>
      Array.from({ length: MAX_TUBES }, () => {
        const m = new Mesh(new BufferGeometry(), clay)
        m.castShadow = true
        m.receiveShadow = true
        m.visible = false
        return m
      }),
    [clay],
  )
  const knobs = useMemo(
    () =>
      KNOB_COLORS.map((color) => {
        const m = new Mesh(
          new SphereGeometry(0.05, 18, 14),
          new MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95, toneMapped: false }),
        )
        // sempre por cima da peça, para dar para pegar
        m.renderOrder = 20
        m.visible = false
        return m
      }),
    [],
  )

  const last = useRef({ handles: null as unknown, profile: null as Profile | null, version: -1, frame: 0, glazed: false })

  useEffect(() => {
    handlesRuntime.meshes = pool
    handlesRuntime.knobs = knobs
    return () => {
      handlesRuntime.meshes = []
      handlesRuntime.knobs = []
      for (const m of pool) m.geometry.dispose()
      for (const k of knobs) {
        k.geometry.dispose()
        ;(k.material as MeshBasicMaterial).dispose()
      }
      clay.dispose()
    }
  }, [pool, knobs, clay])

  useFrame(() => {
    const s = useGameStore.getState()
    const p = s.profile
    const l = last.current
    l.frame++
    // furos e ripado vertical acompanham a peça (desfazer, recarregar, peça nova)
    syncHoles(s.holes, p)
    setFluting(s.fluting?.spacing ?? null)
    const shapeChanged = p !== l.profile || p.version !== l.version
    const changed = s.handles !== l.handles || (shapeChanged && l.frame % 3 === 0)

    if (changed) {
      let row = 0
      s.handles.forEach((h, index) => {
        for (const angle of tubeAngles(h)) {
          if (row >= MAX_TUBES) return
          const mesh = pool[row]
          const { geometry, paintLength } = buildTube(handleCurve(h, p, angle), h.thickness, row, h.joint ?? 0)
          mesh.geometry.dispose()
          mesh.geometry = geometry
          mesh.userData = { handleIndex: index, paintLength, thickness: h.thickness }
          mesh.visible = true
          row++
        }
      })
      for (let i = row; i < MAX_TUBES; i++) pool[i].visible = false
      handlesRuntime.reach = handlesReach(s.handles)
      l.handles = s.handles
      l.profile = p
      l.version = p.version
    }

    if (glazed !== l.glazed) {
      for (const m of pool) m.material = glazed ? glaze : clay
      l.glazed = glazed
    }

    // pontos de controle da alça selecionada (só no acabamento)
    const sel = s.phase === 'finishing' && s.selectedHandle !== null ? s.handles[s.selectedHandle] : undefined
    if (sel) {
      const k = knobPoints(sel, p)
      knobs[0].position.copy(k.height)
      knobs[1].position.copy(k.opening)
      knobs[2].position.copy(k.thickness)
    }
    for (const knob of knobs) knob.visible = !!sel
  })

  return (
    <>
      {pool.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {knobs.map((m, i) => (
        <primitive key={`k${i}`} object={m} />
      ))}
    </>
  )
}
