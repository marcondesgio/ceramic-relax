import { useTranslation } from 'react-i18next'
import { useGameStore, wheelLevel } from '../store/useGameStore'
import { WheelIcon } from './Icons'

const LEVEL_KEYS = ['wheel.stopped', 'wheel.slow', 'wheel.medium', 'wheel.fast']

/** Três barrinhas que acendem conforme a velocidade */
function LevelBars({ level }: { level: number }) {
  return (
    <span className="wheel-bars" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= level ? 'on' : ''} style={{ height: 8 + n * 5 }} />
      ))}
    </span>
  )
}

/** Indicador do torno. `compact` é a versão da barra do topo no celular. */
export function WheelIndicator({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  // o seletor devolve só o nível: re-renderiza 4 vezes, não 60 por segundo
  const level = useGameStore((s) => wheelLevel(s.wheelSpeed))
  const label = t(LEVEL_KEYS[level])

  if (compact) {
    return (
      <div className="wheel-ind wheel-ind--compact" role="status" aria-label={`${t('wheel.label')}: ${label}`}>
        <span className="wheel-ind__icon">
          <WheelIcon size={20} />
        </span>
        <strong>{label}</strong>
        <LevelBars level={level} />
      </div>
    )
  }

  return (
    <div className="wheel-ind" role="status" aria-label={`${t('wheel.label')}: ${label}`}>
      <span className="wheel-ind__icon">
        <WheelIcon size={24} />
      </span>
      <span className="wheel-ind__text">
        <span className="caption">{t('wheel.label')}</span>
        <strong>{label}</strong>
      </span>
      <LevelBars level={level} />
      <span className="wheel-ind__sep" />
      <kbd className="keycap">{t('wheel.key')}</kbd>
      <span className="wheel-ind__hold">{t('wheel.hold')}</span>
    </div>
  )
}
