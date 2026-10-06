import { useTranslation } from 'react-i18next'
import { useGameStore, type Finish } from '../store/useGameStore'
import { Button } from './Button'
import { BackIcon, CheckIcon, KilnIcon } from './Icons'
import { TopControls } from './TopControls'
import { useIsTouch } from './useIsTouch'

const FINISHES: Finish[] = ['glossy', 'matte']

/** Cartão de acabamento com a prévia da própria peça */
function FinishCard({ finish }: { finish: Finish }) {
  const { t } = useTranslation()
  const selected = useGameStore((s) => s.finish === finish)
  const preview = useGameStore((s) => s.previews[finish])
  const setFinish = useGameStore((s) => s.setFinish)

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`finish-card finish-card--${finish} card`}
      onClick={() => setFinish(finish)}
    >
      <span className="finish-card__preview">
        {preview ? <img src={preview} alt="" draggable={false} /> : <span className="finish-card__loading" />}
        {finish === 'glossy' && <span className="finish-card__sparkles" aria-hidden="true" />}
      </span>
      <span className="finish-card__text">
        <strong>{t(`kiln.${finish}`)}</strong>
        <span>{t(`kiln.${finish}Desc`)}</span>
      </span>
      <span className="finish-card__check" aria-hidden="true">
        {selected && <CheckIcon size={20} />}
      </span>
    </button>
  )
}

/** Escolha do acabamento: Brilhante ou Fosco, e "Acender o forno" */
export function KilnScreen() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const setPhase = useGameStore((s) => s.setPhase)

  const light = () => setPhase('firing')

  return (
    <div className={`ui-layer kiln-screen ${touch ? 'hud--touch' : 'hud--desktop'}`}>
      <div className="hud__top">
        {touch ? (
          <Button variant="icon" aria-label={t('kiln.back')} icon={<BackIcon />} onClick={() => setPhase('painting')} />
        ) : (
          <Button icon={<BackIcon />} onClick={() => setPhase('painting')}>
            {t('kiln.back')}
          </Button>
        )}
        <span className="hud__spacer" />
        <TopControls />
      </div>
      <div className="kiln-screen__center">
        <h1 className="screen-title">{t('kiln.title')}</h1>
        <p className="screen-subtitle">{touch ? t('kiln.subtitleShort') : t('kiln.subtitle')}</p>
        <div className="finish-cards" role="radiogroup" aria-label={t('kiln.finishLabel')}>
          {FINISHES.map((f) => (
            <FinishCard key={f} finish={f} />
          ))}
        </div>
      </div>
      <div className="kiln-screen__bottom">
        <Button variant="primary" icon={<KilnIcon />} onClick={light}>
          {t('kiln.fire')}
        </Button>
        <p className="kiln-screen__note">{touch ? t('kiln.noteShort') : t('kiln.note')}</p>
      </div>
    </div>
  )
}
