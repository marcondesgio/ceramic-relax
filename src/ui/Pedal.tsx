import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, wheelLevel } from '../store/useGameStore'
import { PedalIcon } from './Icons'

const HANDLE = 56 // px

/**
 * Pedal virtual (celular): deslizar o dedo para cima aumenta a velocidade (0 a 100%).
 * Fica onde o dedo soltou, como um pedal de verdade; deslizar até embaixo para o torno.
 */
export function Pedal({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const track = useRef<HTMLDivElement>(null)
  const value = useGameStore((s) => s.wheelInput.pedal)
  const setPedal = useGameStore((s) => s.setPedal)
  const level = wheelLevel(value)

  const valueFromY = (clientY: number) => {
    const rect = track.current!.getBoundingClientRect()
    const usable = rect.height - HANDLE
    const v = 1 - (clientY - rect.top - HANDLE / 2) / usable
    const clamped = Math.min(1, Math.max(0, v))
    return clamped < 0.06 ? 0 : clamped // zona morta embaixo: parado
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* sem captura o pedal ainda funciona enquanto o dedo está sobre ele */
    }
    setPedal(valueFromY(e.clientY))
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons || e.pointerType === 'touch') setPedal(valueFromY(e.clientY))
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') setPedal(Math.min(1, value + 0.1))
    else if (e.key === 'ArrowDown') setPedal(Math.max(0, value - 0.1))
    else return
    e.preventDefault()
  }

  return (
    <div className={`pedal card ${compact ? 'pedal--compact' : ''}`}>
      <div className="pedal__head">
        <PedalIcon size={20} />
        {!compact && <span className="caption">{t('wheel.pedal')}</span>}
      </div>
      <div
        ref={track}
        className="pedal__track"
        role="slider"
        tabIndex={0}
        aria-label={t('wheel.pedalHint')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={t(['wheel.stopped', 'wheel.slow', 'wheel.medium', 'wheel.fast'][level])}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onKeyDown={onKey}
      >
        <span className={`pedal__zone ${level === 3 ? 'on' : ''}`}>{!compact && t('wheel.fast')}</span>
        <span className={`pedal__zone ${level === 2 ? 'on' : ''}`} />
        <span className={`pedal__zone ${level === 1 ? 'on' : ''}`}>{!compact && t('wheel.slow')}</span>
        <span
          className={`pedal__handle ${value > 0 ? 'on' : ''}`}
          style={{ bottom: `calc(${value} * (100% - ${HANDLE}px))` }}
        >
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  )
}
