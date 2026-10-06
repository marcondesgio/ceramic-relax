import { MathUtils, Vector3 } from 'three'
import { WHEEL_TOP_Y } from '../wheel/wheelRuntime'
import { DOOR_CENTER_Y, SHELF_TOP, kilnScale, kilnToWorld, shelfScale } from './kilnLayout'
import type { Profile } from '../pottery/profile'

// Linha do tempo da queima (segundos). Total ≈ 7,4 s.
export const T = {
  doorOpenStart: 0.4,
  atDoor: 1.5, // a peça chega na frente da porta
  inside: 2.0, // entrou
  doorClosed: 2.5,
  heatFull: 4.8, // janelinha dourada
  ding: 5.0,
  doorReopen: 5.15, // porta abre com vapor; o esmalte já está pronto
  doorOpened: 5.65,
  outAtDoor: 6.0, // saiu pela porta
  onShelf: 7.0,
  doorCloseAgain: 6.6,
  end: 7.4,
} as const

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const span = (t: number, a: number, b: number) => MathUtils.clamp((t - a) / (b - a), 0, 1)

/** Pontos fixos do caminho da peça (dependem do tamanho dela) */
export function firingPath(p: Profile) {
  const sKiln = kilnScale(p)
  const sShelf = shelfScale(p)
  const baseAtDoor = DOOR_CENTER_Y - (p.height * sKiln) / 2
  return {
    sKiln,
    sShelf,
    wheel: new Vector3(0, WHEEL_TOP_Y, 0),
    doorFront: kilnToWorld(0, baseAtDoor, 1.7),
    inside: kilnToWorld(0, baseAtDoor, 0),
    shelf: SHELF_TOP.clone(),
  }
}
export type FiringPath = ReturnType<typeof firingPath>

export interface FiringPose {
  position: Vector3
  scale: number
  visible: boolean
  doorOpen: number
  heat: number
  thermo: number
  /** 0 a 1: nuvem de vapor saindo da porta */
  steam: number
  /** 0 a 1: estrelinhas em volta da peça */
  stars: number
}

/** Estado de tudo no instante `t` da queima (função pura: pular = pedir t = fim) */
export function firingPose(t: number, path: FiringPath, out: FiringPose) {
  const pos = out.position
  if (t < T.atDoor) {
    // desliza do torno até a porta, num pulinho
    const k = ease(span(t, 0, T.atDoor))
    pos.lerpVectors(path.wheel, path.doorFront, k)
    pos.y += Math.sin(Math.PI * k) * 1.1
    out.scale = MathUtils.lerp(1, path.sKiln, k)
  } else if (t < T.inside) {
    pos.lerpVectors(path.doorFront, path.inside, ease(span(t, T.atDoor, T.inside)))
    out.scale = path.sKiln
  } else if (t < T.doorReopen + 0.35) {
    pos.copy(path.inside)
    out.scale = path.sKiln
  } else if (t < T.outAtDoor) {
    pos.lerpVectors(path.inside, path.doorFront, ease(span(t, T.doorReopen + 0.35, T.outAtDoor)))
    out.scale = path.sKiln
  } else {
    // pulinho até a prateleira, crescendo de volta
    const k = ease(span(t, T.outAtDoor, T.onShelf))
    pos.lerpVectors(path.doorFront, path.shelf, k)
    pos.y += Math.sin(Math.PI * k) * 0.9
    out.scale = MathUtils.lerp(path.sKiln, path.sShelf, k)
  }
  // escondida enquanto está lá dentro (não atravessa o fundo do forno)
  out.visible = t < T.inside - 0.05 || t > T.doorReopen + 0.3

  // porta: abre para a peça entrar, fecha, abre de novo na saída e fecha no fim
  out.doorOpen =
    t < T.atDoor
      ? ease(span(t, T.doorOpenStart, T.atDoor - 0.2))
      : t < T.doorReopen
        ? 1 - ease(span(t, T.inside, T.doorClosed))
        : t < T.doorCloseAgain
          ? ease(span(t, T.doorReopen, T.doorOpened))
          : 1 - ease(span(t, T.doorCloseAgain, T.end))

  // calor: sobe com a porta fechada, esfria depois do ding
  out.heat = t < T.ding ? ease(span(t, T.doorClosed, T.heatFull)) : 1 - span(t, T.ding, T.outAtDoor + 0.4)
  out.thermo = t < T.ding ? MathUtils.lerp(0.15, 1, ease(span(t, T.doorClosed, T.heatFull))) : MathUtils.lerp(1, 0.15, span(t, T.ding + 0.5, T.end + 1))
  out.steam = t < T.doorReopen ? 0 : span(t, T.doorReopen, T.doorReopen + 1.4)
  out.stars = span(t, T.outAtDoor + 0.2, T.end)
  return out
}
