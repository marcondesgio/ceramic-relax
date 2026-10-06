import type { Group, Mesh, MeshStandardMaterial, PointLight } from 'three'

// Peças do forno que a animação de queima mexe a cada quadro
export const kilnRuntime = {
  body: null as Group | null,
  door: null as Group | null,
  windowMat: null as MeshStandardMaterial | null,
  glow: null as PointLight | null,
  thermoFill: null as Mesh | null,
  /** 0 = porta fechada, 1 = aberta */
  doorOpen: 0,
  /** 0 a 1: brilho da janelinha (laranja → dourado) */
  heat: 0,
  /** 0 a 1: termômetro */
  thermo: 0.15,
  /** tempo atual da queima (s), para a câmera acompanhar a peça na saída */
  time: 0,
  /** pedido de pular a animação (toque na tela) */
  skip: false,
}
