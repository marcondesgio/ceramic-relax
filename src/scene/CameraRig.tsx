import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { useGameStore, type Phase } from '../store/useGameStore'
import { WHEEL_TOP_Y } from '../wheel/wheelRuntime'
import { KILN_POS, SHELF_TOP, pieceSize, shelfScale } from '../kiln/kilnLayout'
import { kilnRuntime } from '../kiln/kilnRuntime'
import { T } from '../kiln/firing'
import type { Profile } from '../pottery/profile'

const UP_DIR = new Vector3(0, 0.62, 1).normalize()
// pintando "Dentro": câmera bem mais alta para enxergar a cavidade
const INSIDE_DIR = new Vector3(0, 1.6, 1).normalize()
// forno: vê o torno e o forno juntos (a peça viaja de um para o outro)
const KILN_LOOK = new Vector3(2.1, 1.35, -0.4)
const KILN_DIR = new Vector3(-0.22, 0.42, 1).normalize()
// escolha do acabamento: forno à direita dos cartões (desktop) ou embaixo deles (celular)
const CHOOSE_LOOK = new Vector3(0.2, 1.7, -0.6)
const CHOOSE_LOOK_PORTRAIT = new Vector3(KILN_POS.x, 2.9, KILN_POS.z)
// prateleira: de frente, um pouco acima
const SHELF_DIR = new Vector3(0, 0.28, 1).normalize()

/** Calcula para onde a câmera olha e de onde, conforme a fase e o formato da tela */
function framing(
  phase: Phase,
  profile: Profile,
  aspect: number,
  inside: boolean,
  outLook: Vector3,
  outPos: Vector3,
) {
  const height = profile.height
  const portrait = aspect < 0.9
  // em retrato a tela é estreita: afasta para a peça caber na largura
  const widthFactor = portrait ? MathUtils.clamp(0.95 / aspect, 1, 2.2) : 1

  if (phase === 'home') {
    outLook.set(0, 1.7, -0.5)
    outPos.set(0, 2.9, portrait ? 13 : 8.4)
    return
  }
  if (phase === 'kiln') {
    outLook.copy(portrait ? CHOOSE_LOOK_PORTRAIT : CHOOSE_LOOK)
    outPos.copy(KILN_DIR).multiplyScalar(portrait ? 8 : 9).add(outLook)
    return
  }
  // na saída do forno a câmera já vai acompanhando a peça até a prateleira
  if (phase === 'firing' && kilnRuntime.time > T.outAtDoor) phase = 'result'
  if (phase === 'firing') {
    outLook.copy(KILN_LOOK)
    if (portrait) outLook.y -= 0.3
    outPos.copy(KILN_DIR).multiplyScalar(8.4 * (portrait ? widthFactor * 0.85 : 1)).add(outLook)
    return
  }
  if (phase === 'result') {
    const shown = pieceSize(profile) * shelfScale(profile)
    const h = height * shelfScale(profile)
    // no celular a peça fica um pouco acima do meio (botões embaixo)
    outLook.set(SHELF_TOP.x, SHELF_TOP.y + h * 0.5 - (portrait ? h * 0.15 + 0.2 : 0.05), SHELF_TOP.z)
    outPos.copy(SHELF_DIR).multiplyScalar((2.2 + shown * 1.5) * (portrait ? widthFactor * 0.8 : 1)).add(outLook)
    return
  }
  if (inside) {
    // olha para a boca da peça, de cima
    const lookY = WHEEL_TOP_Y + height * 0.75 - (portrait ? 0.35 : 0)
    outLook.set(0, lookY, 0)
    outPos.copy(INSIDE_DIR).multiplyScalar((2.6 + height * 0.5) * widthFactor).add(outLook)
    return
  }
  // modelagem e pintura: perto da peça. No celular a pintura tem uma folha
  // de ferramentas mais alta embaixo, então a peça sobe mais na tela.
  const portraitShift = phase === 'painting' ? 1.0 : 0.55
  const lookY = WHEEL_TOP_Y + height * 0.5 - (portrait ? portraitShift : 0.1)
  const dist = (3.4 + height * 0.9) * widthFactor
  outLook.set(0, lookY, 0)
  outPos.copy(UP_DIR).multiplyScalar(dist).add(outLook)
}

/** Move a câmera suavemente entre as fases e acompanha a altura da peça */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const look = useRef(new Vector3(0, 1.7, -0.5))
  const first = useRef(true)
  const goal = useMemo(() => ({ look: new Vector3(), pos: new Vector3() }), [])

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const inside = s.phase === 'painting' && s.paint.side === 'inner'
    framing(s.phase, s.profile, size.width / size.height, inside, goal.look, goal.pos)

    // na primeira vez (ou com animações reduzidas) vai direto
    const lambda = first.current || s.settings.reduceMotion ? 1000 : 2.4
    first.current = false
    const dt = Math.min(delta, 0.1)
    camera.position.x = MathUtils.damp(camera.position.x, goal.pos.x, lambda, dt)
    camera.position.y = MathUtils.damp(camera.position.y, goal.pos.y, lambda, dt)
    camera.position.z = MathUtils.damp(camera.position.z, goal.pos.z, lambda, dt)
    look.current.x = MathUtils.damp(look.current.x, goal.look.x, lambda, dt)
    look.current.y = MathUtils.damp(look.current.y, goal.look.y, lambda, dt)
    look.current.z = MathUtils.damp(look.current.z, goal.look.z, lambda, dt)
    camera.lookAt(look.current)
  })

  return null
}
