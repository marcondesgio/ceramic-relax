import { useEffect } from 'react'
import { prepareAudio, startAudio } from './sounds'

/**
 * Os navegadores só deixam tocar som depois de um gesto do jogador.
 * Preparamos os sons em segundo plano e começamos no primeiro toque ou tecla.
 */
export function useAudioUnlock() {
  useEffect(() => {
    // síntese offline não precisa de gesto: adianta o trabalho quando o navegador estiver livre
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200))
    idle(() => void prepareAudio())

    const unlock = () => {
      void startAudio()
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])
}
