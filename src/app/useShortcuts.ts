import { useEffect } from 'react'
import { useGameStore, type PaintTool } from '../store/useGameStore'
import { undoPaint } from '../paint/paintHistory'

const TOOL_KEYS: Record<string, PaintTool> = { '1': 'brush', '2': 'bands', '3': 'stamp', '4': 'bucket', '5': 'eraser' }

/** Atalhos globais: Ctrl+Z (ou Cmd+Z) desfaz; teclas 1 a 5 trocam a ferramenta de pintura */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGameStore.getState()
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (s.phase === 'modeling') s.undo()
        else if (s.phase === 'painting') undoPaint()
        else return
        e.preventDefault()
        return
      }
      if (s.phase === 'painting' && !e.ctrlKey && !e.metaKey && !e.altKey && TOOL_KEYS[e.key]) {
        s.updatePaint({ tool: TOOL_KEYS[e.key] })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
