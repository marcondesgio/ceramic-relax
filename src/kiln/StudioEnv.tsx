import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { setGlazeEnvMap } from '../paint/glazeMaterial'

/**
 * Ambiente de estúdio gerado localmente (sem baixar HDR) só para os reflexos do esmalte.
 * Não vai para scene.environment para não clarear o ateliê inteiro.
 */
export function StudioEnv() {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, 0.04).texture
    setGlazeEnvMap(env)
    room.dispose()
    pmrem.dispose()
    return () => {
      setGlazeEnvMap(null)
      env.dispose()
    }
  }, [gl])

  return null
}
