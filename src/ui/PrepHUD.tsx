import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { AMOUNT_REFS, nearestRef, type PrepStep } from '../prep/prep'
import { prepRuntime } from '../prep/prepRuntime'
import { PREPARED_CLAY } from '../shop/items'
import { Button } from './Button'
import { CutIcon, FoldIcon, HomeIcon, RollIcon, SparkleIcon, WheelIcon } from './Icons'
import { TopControls } from './TopControls'
import { useIsTouch } from './useIsTouch'

const STEPS: PrepStep[] = ['cut', 'throw', 'roll']

/** Dica do topo, conforme a etapa e o aparelho */
function PrepHint({ touch }: { touch: boolean }) {
  const { t } = useTranslation()
  const { step, bubbles, flat } = useGameStore((s) => s.prep)
  const device = touch ? 'Touch' : 'Desktop'
  const key =
    step === 'cut'
      ? `cut${device}`
      : step === 'throw'
        ? bubbles === 0
          ? 'throwDone'
          : `throw${device}`
        : step === 'roll'
          ? flat
            ? `fold${device}`
            : `roll${device}`
          : 'ready'
  return (
    <div className="hint" key={key} role="status">
      {t(`prep.hint.${key}`)}
    </div>
  )
}

/** Quantidade · Bolhas · Rolo */
function PrepSteps() {
  const { t } = useTranslation()
  const step = useGameStore((s) => s.prep.step)
  const current = step === 'ready' ? STEPS.length : STEPS.indexOf(step)
  return (
    <ol className="prep-steps" aria-label={t('prep.stepsLabel')}>
      {STEPS.map((id, i) => (
        <li key={id} className={i === current ? 'is-active' : i < current ? 'is-done' : ''} aria-current={i === current ? 'step' : undefined}>
          {t(`prep.steps.${id}`)}
        </li>
      ))}
    </ol>
  )
}

/** Atalhos para as referências P, M e G (também movem o fio) */
function AmountRefs() {
  const { t } = useTranslation()
  const amount = useGameStore((s) => s.prep.amount)
  const updatePrep = useGameStore((s) => s.updatePrep)
  const near = nearestRef(amount)
  return (
    <div className="segmented prep-refs" role="group" aria-label={t('prep.refsLabel')}>
      {AMOUNT_REFS.map((r) => (
        <button key={r.id} type="button" aria-pressed={near === r.id} onClick={() => updatePrep({ amount: r.amount })}>
          {t(`prep.refs.${r.id}`)}
          <small>{t(`prep.refNames.${r.id}`)}</small>
        </button>
      ))}
    </div>
  )
}

/** Interface do preparo da argila (entre a tela inicial e o torno) */
export function PrepHUD() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const { step, flat } = useGameStore((s) => s.prep)
  const ownsPrepared = useGameStore((s) => s.purchases.includes(PREPARED_CLAY))
  const setPhase = useGameStore((s) => s.setPhase)
  const updatePrep = useGameStore((s) => s.updatePrep)
  const finishPrep = useGameStore((s) => s.finishPrep)

  return (
    <div className={`ui-layer hud prep-hud ${touch ? 'hud--touch' : 'hud--desktop'}`}>
      <div className="hud__top">
        <Button variant="icon" aria-label={t('common.home')} icon={<HomeIcon />} onClick={() => setPhase('home')} />
        <span className="hud__spacer" />
        <TopControls />
      </div>
      <div className="hud__hint">
        <PrepHint touch={touch} />
      </div>

      <div className="prep-hud__bottom">
        <PrepSteps />
        {step === 'cut' && <AmountRefs />}
        <div className="prep-hud__actions">
          {step === 'cut' && (
            <>
              {/* item da lojinha: escolhe a quantidade e pula direto para o torno */}
              {ownsPrepared && (
                <Button icon={<SparkleIcon />} onClick={() => finishPrep(true)}>
                  {t('prep.usePrepared')}
                </Button>
              )}
              <Button variant="primary" icon={<CutIcon />} onClick={() => (prepRuntime.request = 'cut')}>
                {t('prep.cut')}
              </Button>
            </>
          )}
          {/* nunca é obrigatório tirar todas as bolhas: as que sobrarem viram marquinhas */}
          {step === 'throw' && (
            <Button icon={<RollIcon />} onClick={() => updatePrep({ step: 'roll' })}>
              {t('prep.toRoll')}
            </Button>
          )}
          {step === 'roll' && flat && (
            <Button variant="primary" icon={<FoldIcon />} onClick={() => (prepRuntime.request = 'fold')}>
              {t('prep.fold')}
            </Button>
          )}
          {step === 'ready' && (
            <Button variant="primary" icon={<WheelIcon />} onClick={() => finishPrep()}>
              {t('prep.toWheel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
