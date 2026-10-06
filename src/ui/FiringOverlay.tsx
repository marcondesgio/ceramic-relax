import { useTranslation } from 'react-i18next'
import { kilnRuntime } from '../kiln/kilnRuntime'

/** Durante a queima: qualquer toque na tela pula a animação */
export function FiringOverlay() {
  const { t } = useTranslation()
  const skip = () => {
    kilnRuntime.skip = true
  }
  return (
    <button
      type="button"
      className="firing-overlay"
      aria-label={t('kiln.skipLabel')}
      onPointerDown={skip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip()
      }}
      autoFocus
    >
      <span className="hint">{t('kiln.skip')}</span>
    </button>
  )
}
