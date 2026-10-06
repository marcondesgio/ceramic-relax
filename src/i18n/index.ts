import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from './pt.json'
import en from './en.json'

export type Lang = 'pt' | 'en'
const STORAGE_KEY = 'ceramic-relax:lang'

// Idioma inicial: escolha salva no aparelho; senão, o idioma do navegador
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'pt' || saved === 'en') return saved
  } catch {
    /* armazenamento indisponível (aba anônima etc.) */
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignora */
  }
}

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: detectLang(),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

export default i18n
