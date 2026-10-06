import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useGameStore } from '../store/useGameStore'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { wheelRuntime } from '../wheel/wheelRuntime'
import { applyGlazeLook, glazeUniforms, resetGlaze } from '../paint/glazeMaterial'
import { playEffect } from '../audio/sounds'
import { T, firingPath, firingPose, type FiringPath, type FiringPose } from './firing'
import { kilnRuntime } from './kilnRuntime'

/** Estado compartilhado com os efeitos (vapor, estrelinhas) */
export const firingFx = { steam: 0, stars: 0 }

/**
 * Conduz a animação do forno (6 a 8 s) e mantém a peça na prateleira no resultado.
 * Fora dessas fases, devolve a peça ao torno e o esmalte ao estado cru.
 */
export function FiringController() {
  const time = useRef(0)
  const path = useRef<FiringPath | null>(null)
  const dinged = useRef(false)
  const glazed = useRef(false)
  const pose = useRef<FiringPose>({
    position: new Vector3(),
    scale: 1,
    visible: true,
    doorOpen: 0,
    heat: 0,
    thermo: 0.15,
    steam: 0,
    stars: 0,
  })

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const carrier = potteryRuntime.carrier
    const dt = Math.min(delta, 0.1)

    if (s.phase === 'firing' || s.phase === 'result') {
      if (!path.current) {
        // começo da queima: guarda o caminho e o ângulo em que a peça estava
        path.current = firingPath(s.profile)
        time.current = s.phase === 'result' ? T.end : 0
        dinged.current = false
        glazed.current = false
        potteryRuntime.displayAngle = wheelRuntime.angle
      }
      if (s.phase === 'firing') {
        if (kilnRuntime.skip) time.current = T.end
        else time.current += dt
        kilnRuntime.skip = false
        potteryRuntime.displayAngle += dt * 0.9
      } else {
        time.current = T.end
      }
      const t = time.current
      kilnRuntime.time = t
      const p = firingPose(t, path.current, pose.current)

      carrier.override = true
      carrier.position.copy(p.position)
      carrier.scale = p.scale
      carrier.visible = p.visible
      kilnRuntime.doorOpen = p.doorOpen
      kilnRuntime.heat = p.heat
      kilnRuntime.thermo = p.thermo
      firingFx.steam = p.steam
      firingFx.stars = s.phase === 'result' ? 0 : p.stars

      // a peça sai do forno com o acabamento escolhido e as cores vivas
      if (t >= T.doorReopen && !glazed.current) {
        applyGlazeLook(s.finish)
        glazeUniforms.glazeOpacity.value = 1
        glazed.current = true
      }
      if (t >= T.ding && !dinged.current) {
        playEffect('ding')
        dinged.current = true
      }
      if (s.phase === 'firing' && t >= T.end) s.setPhase('result')
      return
    }

    // qualquer outra fase: peça no torno, forno em repouso, esmalte cru
    if (path.current) {
      path.current = null
      carrier.override = false
      resetGlaze()
    }
    kilnRuntime.doorOpen = 0
    kilnRuntime.heat = 0
    kilnRuntime.thermo = 0.15
    firingFx.steam = 0
    firingFx.stars = 0
  })

  return null
}
