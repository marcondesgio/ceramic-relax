import { useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { paintHistorySize, subscribePaintHistory, undoPaint } from '../paint/paintHistory'
import type { Side } from '../paint/paintSurface'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { BackIcon, KilnIcon, SparkleIcon, UndoIcon, WheelIcon } from './Icons'
import { Palette } from './Palette'
import { Pedal } from './Pedal'
import { SIZED_TOOLS, SizeToggle, StampPicker, ToolBar } from './PaintTools'
import { TopControls } from './TopControls'
import { useIsTouch } from './useIsTouch'

/** Alternância Fora / Dentro */
function SideToggle() {
  const { t } = useTranslation()
  const side = useGameStore((s) => s.paint.side)
  const updatePaint = useGameStore((s) => s.updatePaint)
  const sides: { id: Side; key: string }[] = [
    { id: 'outer', key: 'painting.outside' },
    { id: 'inner', key: 'painting.inside' },
  ]
  return (
    <div className="segmented" role="group" aria-label={t('painting.sideLabel')}>
      {sides.map((sd) => (
        <button key={sd.id} type="button" aria-pressed={side === sd.id} onClick={() => updatePaint({ side: sd.id })}>
          {t(sd.key)}
        </button>
      ))}
    </div>
  )
}

/** Dica de como o torno muda a ferramenta (desktop: segurar ESPAÇO) */
function WheelToolHint() {
  const { t } = useTranslation()
  const tool = useGameStore((s) => s.paint.tool)
  return (
    <div className="wheel-hint">
      <WheelIcon size={22} />
      <kbd className="keycap">{t('wheel.key')}</kbd>
      <span>{t(`painting.wheelHint.${tool}`)}</span>
    </div>
  )
}

/** Interface da fase de pintura */
export function PaintingHUD() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const tool = useGameStore((s) => s.paint.tool)
  const hasPaint = useGameStore((s) => s.paint.hasPaint)
  const backToModeling = useGameStore((s) => s.backToModeling)
  const setPhase = useGameStore((s) => s.setPhase)
  const canUndo = useSyncExternalStore(subscribePaintHistory, paintHistorySize) > 0
  const [confirming, setConfirming] = useState(false)

  // só pede confirmação se houver pintura para perder
  const onBack = () => (hasPaint ? setConfirming(true) : backToModeling())
  const undoButton = (
    <Button variant="icon" aria-label={t('common.undo')} icon={<UndoIcon />} disabled={!canUndo} onClick={undoPaint} />
  )

  return (
    <div className={`ui-layer hud paint-hud ${touch ? 'hud--touch' : 'hud--desktop'}`}>
      <div className="hud__top paint-hud__top">
        {touch ? (
          <Button variant="icon" aria-label={t('painting.back')} icon={<BackIcon />} onClick={onBack} />
        ) : (
          <Button icon={<BackIcon />} onClick={onBack}>
            {t('painting.back')}
          </Button>
        )}
        <span className="hud__spacer" />
        {/* no celular o topo é apertado: desfazer + opções (o som fica no menu) */}
        <TopControls before={undoButton} sound={!touch} />
      </div>
      <div className="paint-hud__side">
        <SideToggle />
      </div>

      {touch ? (
        <>
          <div className="hud__hint">
            <div className="hint">
              <SparkleIcon size={18} />
              {t('painting.glazeHintShort')}
            </div>
          </div>
          <div className="paint-hud__pedal">
            <Pedal compact />
          </div>
          <div className="paint-sheet card">
            <ToolBar layout="row" />
            {tool === 'stamp' && <StampPicker />}
            <Palette layout="grid" />
            <div className="paint-sheet__bottom">
              {SIZED_TOOLS.includes(tool) ? <SizeToggle /> : <span />}
              <Button variant="primary" icon={<KilnIcon />} onClick={() => setPhase('kiln')}>
                {t('painting.toKiln')}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="paint-hud__tools">
            <ToolBar layout="column" />
            {tool === 'stamp' && <StampPicker />}
          </div>
          <div className="paint-hud__wheel">
            <WheelToolHint />
          </div>
          <div className="paint-hud__palette">
            <div className="hint">
              <SparkleIcon size={18} />
              {t('painting.glazeHint')}
            </div>
            <Palette layout="row" />
          </div>
          <div className="hud__ready">
            <Button variant="primary" icon={<KilnIcon />} onClick={() => setPhase('kiln')}>
              {t('painting.toKiln')}
            </Button>
          </div>
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title={t('painting.confirm.title')}
          body={t('painting.confirm.body')}
          cancelLabel={t('painting.confirm.cancel')}
          confirmLabel={t('painting.confirm.ok')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            backToModeling()
          }}
        />
      )}
    </div>
  )
}
