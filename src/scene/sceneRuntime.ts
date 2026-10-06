import type { Scene, WebGLRenderer } from 'three'

/** Renderer e cena principais, para renders fora do loop (foto do resultado) */
export const sceneRuntime = {
  gl: null as WebGLRenderer | null,
  scene: null as Scene | null,
}
