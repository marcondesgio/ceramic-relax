import { Euler, Vector3 } from 'three'
import { PROFILE_SAMPLES, type Profile } from '../pottery/profile'

// Onde ficam o forno e a prateleira no ateliê (o torno está na origem).

export const KILN_POS = new Vector3(3.6, 0, -1.7)
export const KILN_ROT_Y = -0.55
/** Centro da porta, no espaço do forno */
export const DOOR_CENTER_Y = 1.2
export const DOOR_RADIUS = 0.72
export const DOOR_Z = 0.93

/** Topo da prateleira do resultado (à esquerda do torno): a base da peça fica aqui */
export const SHELF_TOP = new Vector3(-2.9, 1.35, 0.6)

const kilnEuler = new Euler(0, KILN_ROT_Y, 0)

/** Converte um ponto do espaço do forno para o mundo */
export function kilnToWorld(x: number, y: number, z: number, out = new Vector3()) {
  return out.set(x, y, z).applyEuler(kilnEuler).add(KILN_POS)
}

/** Maior medida da peça (altura ou diâmetro), para caber na porta e na prateleira */
export function pieceSize(p: Profile) {
  let r = 0
  for (let i = 0; i < PROFILE_SAMPLES; i++) r = Math.max(r, p.radii[i])
  return Math.max(p.height, r * 2)
}

/** Escala da peça viajando pelo forno (cabe na porta redonda) */
export function kilnScale(p: Profile) {
  return Math.min(0.9, (DOOR_RADIUS * 1.55) / pieceSize(p))
}

/** Escala da peça exposta na prateleira */
export function shelfScale(p: Profile) {
  return Math.min(1, 1.5 / pieceSize(p))
}
