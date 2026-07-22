import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import enApp from './locales/en/app.json'
import enNotices from './locales/en/notices.json'
import enCognito from './locales/en/cognito.json'

// Languages the app ships translations for. English is always the source/fallback.
// Endonyms are shown untranslated in the language picker.
export const SUPPORTED_LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
]

export const NAMESPACES = ['app', 'notices', 'cognito'] as const

// English is bundled eagerly so there is never a flash of translation keys while
// falling back. Other locales are code-split and lazy-loaded on first use.
const lazyBackend = resourcesToBackend(
  (language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)
)

i18n
  .use(lazyBackend)
  .use(initReactI18next)
  .init({
    // The resolved language is driven by redux (ui.setLanguage); 'en' here is a
    // safe boot value overwritten before first paint.
    lng: 'en',
    fallbackLng: 'en',
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'app',
    fallbackNS: 'app',
    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    partialBundledLanguages: true,
    resources: {
      en: { app: enApp, notices: enNotices, cognito: enCognito },
    },
  })

export default i18n
