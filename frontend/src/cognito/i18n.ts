import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enTranslation from './locales/en/translations.json'

i18n.use(LanguageDetector).init({
  fallbackLng: 'en',
  debug: false,
  ns: ['cognito'],
  defaultNS: 'cognito',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  resources: { en: { cognito: enTranslation } },
})

export default i18n
