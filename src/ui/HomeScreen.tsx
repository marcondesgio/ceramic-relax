import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { Button } from './Button'
import { SparkleIcon } from './Icons'
import { LangToggle } from './LangToggle'
import { TopControls } from './TopControls'

/** Vasinho sorridente do logo */
function LogoVase() {
  return (
    <svg width="64" height="72" viewBox="0 0 64 72" aria-hidden="true">
      <ellipse cx="32" cy="68" rx="20" ry="3.5" fill="#EBD9C4" />
      <path d="M23 6h18v6c11 5 16 15 16 27 0 16-11 27-25 27S7 55 7 39c0-12 5-22 16-27Z" fill="#E3A587" />
      <ellipse cx="32" cy="7" rx="10" ry="3" fill="#C98B6E" />
      <path d="M44 22c4 4 6 9 6 15" stroke="#F2C3A9" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="38" r="2.4" fill="#6B4F3F" />
      <circle cx="39" cy="38" r="2.4" fill="#6B4F3F" />
      <path d="M28.5 43c2 2 5 2 7 0" stroke="#6B4F3F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="21" cy="44" r="3" fill="#F4A08E" opacity=".6" />
      <circle cx="43" cy="44" r="3" fill="#F4A08E" opacity=".6" />
    </svg>
  )
}

/** Tela inicial: logo, Começar e seletor de idioma, com o ateliê ao fundo */
export function HomeScreen() {
  const { t } = useTranslation()
  const setPhase = useGameStore((s) => s.setPhase)

  return (
    <div className="ui-layer home">
      <div className="home__top">
        <TopControls before={<LangToggle />} />
      </div>
      <div className="home__center">
        <div className="home__card card">
          <LogoVase />
          <h1 className="logo">
            <span>{t('home.title1')}</span>
            <span className="logo__accent">{t('home.title2')}</span>
          </h1>
          <p className="home__tagline">{t('home.tagline')}</p>
        </div>
        <Button variant="primary" className="home__start" icon={<SparkleIcon />} onClick={() => setPhase('modeling')}>
          {t('home.start')}
        </Button>
        <p className="home__note">{t('home.note')}</p>
      </div>
    </div>
  )
}
