import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import type { Lang } from '../i18n'

/** Seletor PT / EN */
export function LangToggle() {
  const { t } = useTranslation()
  const lang = useGameStore((s) => s.settings.lang)
  const setLang = useGameStore((s) => s.setLang)
  const langs: Lang[] = ['pt', 'en']

  return (
    <div className="segmented" role="group" aria-label={t('lang.label')}>
      {langs.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  )
}
