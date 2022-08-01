import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enTranslation from './locales/en/translations.json'
import { initReactI18next } from 'react-i18next'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    resources: { en: { translation: enTranslation } },
  })

export default i18n
