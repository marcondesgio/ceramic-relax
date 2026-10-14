import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { PALETTE } from '../paint/palette'
import { unlockedColors } from '../shop/unlocks'
import { CheckIcon } from './Icons'

/** Paleta de 12 cores (+ as extras compradas na lojinha): linha com o nome da cor (desktop) ou grade de 6 (celular) */
export function Palette({ layout }: { layout: 'row' | 'grid' }) {
  const { t } = useTranslation()
  const selected = useGameStore((s) => s.paint.color)
  const updatePaint = useGameStore((s) => s.updatePaint)
  const purchases = useGameStore((s) => s.purchases)

  return (
    <div className={`palette palette--${layout} ${layout === 'row' ? 'card' : ''}`}>
      <div className="palette__swatches" role="radiogroup" aria-label={t('painting.paletteLabel')}>
        {unlockedColors(purchases).map((i) => {
          const c = PALETTE[i]
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected === i}
              aria-label={t(`painting.colors.${c.id}`)}
              className="swatch"
              style={{ ['--swatch' as string]: c.hex }}
              onClick={() => updatePaint({ color: i })}
            >
              {selected === i && <CheckIcon size={18} />}
            </button>
          )
        })}
      </div>
      {layout === 'row' && (
        <>
          <span className="palette__sep" />
          <strong className="palette__name">{t(`painting.colors.${PALETTE[selected].id}`)}</strong>
        </>
      )}
    </div>
  )
}
