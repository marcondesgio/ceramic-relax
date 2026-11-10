import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from './pt.json'
import en from './en.json'

export type Lang = 'pt' | 'en'

// Idioma inicial pelo navegador; a escolha salva no aparelho chega pela hidratação (store/saveGame.ts)
export function detectLang(): Lang {
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: detectLang(),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

export default i18n
