// Valores que mudam a cada quadro ficam fora do React para não causar re-renderizações.
export const wheelRuntime = {
  /** ângulo acumulado da cabeça do torno (rad) */
  angle: 0,
}

/** Rotação máxima: ~2 voltas por segundo, como um torno de verdade */
export const MAX_ANGULAR_SPEED = Math.PI * 4

/** Tempo para ir de parado ao máximo segurando SPACE */
export const SPIN_UP_SECONDS = 1
/** Tempo para parar depois de soltar */
export const SPIN_DOWN_SECONDS = 1.5

/** Altura do topo da cabeça do torno, onde a peça se apoia */
export const WHEEL_TOP_Y = 0.86
