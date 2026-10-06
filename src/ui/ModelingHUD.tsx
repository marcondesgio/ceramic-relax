import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, wheelLevel } from '../store/useGameStore'
import { Button } from './Button'
import { BrushIcon, HomeIcon, UndoIcon } from './Icons'
import { Pedal } from './Pedal'
import { WheelIndicator } from './WheelIndicator'
import { TopControls } from './TopControls'
import { useIsTouch } from './useIsTouch'

/** Dica do topo: ensina a girar o torno e depois alterna entre lateral e topo */
function ModelingHint({ touch }: { touch: boolean }) {
  const { t } = useTranslation()
  const spinning = useGameStore((s) => wheelLevel(s.wheelSpeed) > 0)
  const [tip, setTip] = useState(0)

  useEffect(() => {
    if (!spinning) return
    const id = window.setInterval(() => setTip((n) => (n + 1) % 2), 7000)
    return () => window.clearInterval(id)
  }, [spinning])

  const device = touch ? 'Touch' : 'Desktop'
  const key = !spinning ? `stopped${device}` : tip === 0 ? `side${device}` : `top${device}`
  return (
    <div className="hint" key={key} role="status">
      {t(`modeling.hint.${key}`)}
    </div>
  )
}

/** Interface da fase de modelagem */
export function ModelingHUD() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const canUndo = useGameStore((s) => s.undoStack.length > 0)
  const undo = useGameStore((s) => s.undo)
  const setPhase = useGameStore((s) => s.setPhase)

  return (
    <div className={`ui-layer hud ${touch ? 'hud--touch' : 'hud--desktop'}`}>
      <div className="hud__top">
        <Button variant="icon" aria-label={t('common.home')} icon={<HomeIcon />} onClick={() => setPhase('home')} />
        {touch && <WheelIndicator compact />}
        <span className="hud__spacer" />
        <TopControls />
      </div>
      <div className="hud__hint">
        <ModelingHint touch={touch} />
      </div>

      <div className="hud__tools card">
        <button type="button" className="tool" disabled={!canUndo} onClick={undo}>
          <UndoIcon />
          <span>{t('common.undo')}</span>
        </button>
      </div>

      {!touch && (
        <div className="hud__wheel">
          <WheelIndicator />
        </div>
      )}
      {touch && (
        <div className="hud__pedal">
          <Pedal />
        </div>
      )}

      <div className="hud__ready">
        <Button variant="primary" icon={<BrushIcon />} onClick={() => setPhase('painting')}>
          {t('modeling.ready')}
        </Button>
      </div>
    </div>
  )
}
