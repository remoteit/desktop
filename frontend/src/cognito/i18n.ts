import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enTranslation from './locales/en/translations.json'

i18n.use(LanguageDetector).init({
  fallbackLng: {
    //'ja-JP': ['ja', 'en'],
    'en-US': ['en'],
    default: ['en'],
  },
  debug: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  resources: { en: enTranslation },
})

export default i18n
