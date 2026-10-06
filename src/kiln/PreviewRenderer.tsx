import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { DirectionalLight, Group, HemisphereLight, Mesh, PerspectiveCamera, Scene, Vector3 } from 'three'
import { useGameStore, type Finish } from '../store/useGameStore'
import { applyGlazeLook, getGlazeMaterials } from '../paint/glazeMaterial'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { wheelRuntime } from '../wheel/wheelRuntime'
import { pieceSize } from './kilnLayout'
import { renderToCanvas } from './renderToCanvas'

const SIZE = 480
const FINISHES: Finish[] = ['glossy', 'matte']

/**
 * Ao abrir a escolha do forno, fotografa a peça com cada acabamento
 * (cores ainda de esmalte cru) para as prévias dos cartões.
 */
export function PreviewRenderer() {
  const gl = useThree((s) => s.gl)
  const phase = useGameStore((s) => s.phase)

  useEffect(() => {
    if (phase !== 'kiln') return
    // espera um quadro: a malha e as texturas já estão atualizadas
    const id = requestAnimationFrame(() => {
      const { outer, inner } = potteryRuntime
      if (!outer || !inner) return
      const s = useGameStore.getState()
      const profile = s.profile

      const scene = new Scene()
      scene.add(new HemisphereLight('#FFF6EA', '#E8CDB0', 1.25))
      const sun = new DirectionalLight('#FFE6CC', 1.6)
      sun.position.set(-2, 4, 4)
      const fill = new DirectionalLight('#E6DEFF', 0.45)
      fill.position.set(3, 1, 2)
      scene.add(sun, fill)

      const mats = getGlazeMaterials()
      const piece = new Group()
      piece.add(new Mesh(outer.geometry, mats.outer), new Mesh(inner.geometry, mats.inner))
      piece.rotation.y = wheelRuntime.angle
      scene.add(piece)

      // enquadra a peça inteira, vista um pouco de cima
      const cam = new PerspectiveCamera(30, 1, 0.1, 50)
      const center = new Vector3(0, profile.height / 2, 0)
      const dist = (pieceSize(profile) / 2 / Math.tan((15 * Math.PI) / 180)) * 1.3
      cam.position.set(0, center.y + dist * 0.35, dist)
      cam.lookAt(center)

      const previews = {} as Record<Finish, string>
      for (const f of FINISHES) {
        applyGlazeLook(f)
        previews[f] = renderToCanvas(gl, scene, cam, SIZE, SIZE, true).toDataURL('image/png')
      }
      applyGlazeLook('raw')
      s.setPreviews(previews)
    })
    return () => cancelAnimationFrame(id)
  }, [phase, gl])

  return null
}
