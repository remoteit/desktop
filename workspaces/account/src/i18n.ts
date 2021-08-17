import i18n from 'i18next'
import Locize from 'i18next-locize-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { LOCIZE_API_KEY, LOCIZE_PROJECT_ID } from './constants'

i18n
  .use(Locize)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    load: 'languageOnly',
    //lng: 'en', //remove this when we are ready to use translations

    lng: navigator.language,
    fallbackLng: {
      //'ja-JP': ['ja', 'en'],
      'en-US': ['en'],
      default: ['en'],
    },
    // have a common namespace used around the full app
    ns: ['translations'],
    defaultNS: 'translations',
    debug: true,
    backend: {
      projectId: LOCIZE_PROJECT_ID,
      apiKey: LOCIZE_API_KEY,
      referenceLng: 'en',
    },
    interpolation: {
      escapeValue: false, // not needed for react!!
      // format: function(value, format, lng) {
      //   if (value instanceof Date) return moment(value).format(format)
      //   return value
      // },
    },
    detection: {
      // order and from where user language should be detected
      order: ['navigator', 'cookie'],

      // keys or params to lookup language from
      lookupCookie: 'remoteit.language',

      // cache user language on
      caches: ['cookie'],
    },
    react: {
      wait: true,
    },
  })
//.on('languageChanged', lng => moment.locale(lng))

export default i18n