import { Vector2, type Camera, type Raycaster } from 'three'

const ndc = new Vector2()

/** Aponta o raycaster para uma posição de tela (clientX/clientY) do canvas */
export function setRayFromClient(raycaster: Raycaster, camera: Camera, el: HTMLElement, cx: number, cy: number) {
  const rect = el.getBoundingClientRect()
  ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(ndc, camera)
}
