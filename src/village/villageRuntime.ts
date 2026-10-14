import { Vector3 } from 'three'

// Onde as coisas ficam na sala e o movimento do bichinho a cada quadro (fora do React).
// O torno está na origem (bandeja de raio ~1,9). Os bichinhos são grandes (do tamanho de
// uma pessoa perto da porta), então as rotas passam por trás do torno, longe do forno.

/** Porta na parede do fundo, à direita da janela: vai do chão até a altura do topo da janela */
export const DOOR = { x: 0.9, z: -4.27, width: 2.4, height: 5.1 }

/** Escala dos bichinhos provisórios (o modelo é feito em ~1 unidade de altura) */
export const ANIMAL_SCALE = 2.3

const at = (x: number, z: number) => new Vector3(x, 0, z)

export const SPOTS = {
  /** logo depois da porta */
  door: at(DOOR.x, -3.9),
  hall: at(DOOR.x, -3.3),
  /** esperando atrás do torno, à esquerda (a câmera da modelagem enxerga) */
  wait: at(-2.2, -2.0),
  /** atrás da mesinha onde a peça pronta fica exposta (a câmera do resultado enxerga) */
  shelf: at(-3.9, -1.0),
}

export const ROUTES = {
  arrive: [SPOTS.door, SPOTS.hall, SPOTS.wait],
  toShelf: [SPOTS.wait, SPOTS.shelf],
  leaveFromWait: [SPOTS.wait, SPOTS.hall, SPOTS.door],
  leaveFromShelf: [SPOTS.shelf, SPOTS.wait, SPOTS.hall, SPOTS.door],
}

/** Para onde o bichinho olha parado: para a frente da sala (onde fica a câmera) */
export const FACE_ROOM = new Vector3(0, 0, 6)

export const WALK_SPEED = 2.6 // unidades por segundo (passos de bichinho grande)

export const villageRuntime = {
  pos: SPOTS.door.clone(),
  /** ângulo em y (0 = olhando para +z) */
  heading: 0,
  path: [] as Vector3[],
  index: 0,
  moving: false,
  /** chegou ao fim do caminho neste quadro (o controle troca de etapa) */
  arrived: false,
  /** porta: 0 fechada → 1 aberta; o quadro aproxima `door` de `doorTarget` */
  door: 0,
  doorTarget: 0,
  /** tremidinha da porta no toc-toc */
  knock: 0,
  /** tempo na etapa atual (s) */
  stageT: 0,
  /** último "Agora não" (ms): voltar ao torno logo depois não chama outro na hora */
  lastDeclineAt: 0,
}

/** Começa a andar por um caminho a partir do primeiro ponto */
export function walk(route: Vector3[]) {
  const r = villageRuntime
  r.pos.copy(route[0])
  r.path = route
  r.index = 1
  r.moving = true
  r.arrived = false
}

/** Aparece parado num lugar (pedido que voltou depois de recarregar) */
export function placeAt(spot: Vector3) {
  const r = villageRuntime
  r.pos.copy(spot)
  r.path = []
  r.moving = false
  r.arrived = false
  r.heading = Math.atan2(FACE_ROOM.x - spot.x, FACE_ROOM.z - spot.z)
}

/** Anda um quadro; marca `arrived` no último ponto */
export function stepWalk(dt: number) {
  const r = villageRuntime
  r.arrived = false
  if (!r.moving) return
  const target = r.path[r.index]
  const dx = target.x - r.pos.x
  const dz = target.z - r.pos.z
  const dist = Math.hypot(dx, dz)
  const step = WALK_SPEED * dt
  // vira suavemente para onde está indo
  const want = Math.atan2(dx, dz)
  let d = want - r.heading
  d = Math.atan2(Math.sin(d), Math.cos(d))
  r.heading += d * Math.min(1, dt * 10)
  if (dist <= step) {
    r.pos.set(target.x, 0, target.z)
    r.index++
    if (r.index >= r.path.length) {
      r.moving = false
      r.arrived = true
    }
  } else {
    r.pos.x += (dx / dist) * step
    r.pos.z += (dz / dist) * step
  }
}

/** Está indo para o último ponto do caminho (a porta abre antes de chegar) */
export function onLastLeg() {
  const r = villageRuntime
  return r.moving && r.index === r.path.length - 1
}
