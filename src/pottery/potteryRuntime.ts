import { Vector3, type Group, type Mesh } from 'three'

// Referências e valores por quadro compartilhados entre a malha e o controle de modelagem.
export const potteryRuntime = {
  group: null as Group | null,
  outer: null as Mesh | null,
  inner: null as Mesh | null,
  /** 0 a 1: a argila está sendo moldada agora (som de argila úmida) */
  deforming: 0,
  /** 0 a 1: tremidinha quando a parede chega no limite */
  jitter: 0,
  /**
   * Posição da base da peça fora do torno (viagem ao forno e prateleira).
   * Com `override` falso a peça fica no torno.
   */
  carrier: { override: false, position: new Vector3(), scale: 1, visible: true },
  /** rotação da peça no forno e na prateleira (o jogador pode girar) */
  displayAngle: 0,
  /** comprimento do perfil de cada lado (mapeia V da pintura em unidades de mundo) */
  outerLength: 1,
  innerLength: 1,
  /** profundidade de boca que ainda falta abrir (abre aos poucos, com o torno girando) */
  mouthPending: 0,
  /** anel que mostra onde o cursor/dedo toca a argila */
  cursor: {
    visible: false,
    active: false,
    point: new Vector3(),
    normal: new Vector3(0, 0, 1),
    /** raio do anel (mundo) e cor; na pintura mostra o tamanho e a cor do pincel */
    radius: 0.0875,
    color: '#FFFBF5',
    /** true: disco cheio com a cor da tinta (pintura); false: só o anel */
    fill: false,
  },
}
