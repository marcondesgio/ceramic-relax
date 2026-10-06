import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

/** Segurar SPACE gira o torno (desktop) */
export function useWheelInput() {
  const setSpaceHeld = useGameStore((s) => s.setSpaceHeld)

  useEffect(() => {
    const isTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    }
    // com o menu de opções aberto, o ESPAÇO volta a ser do teclado (ativar botões)
    const optionsOpen = () => useGameStore.getState().optionsOpen
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTyping(e) || optionsOpen()) return
      e.preventDefault() // evita rolar a página ou "clicar" no botão focado
      if (!e.repeat) setSpaceHeld(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (!optionsOpen()) e.preventDefault()
      setSpaceHeld(false)
    }
    // soltar a tecla fora da janela não pode deixar o torno preso girando
    const release = () => setSpaceHeld(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
    }
  }, [setSpaceHeld])
}
