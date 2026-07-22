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

export type LanguageMode = 'system' | 'en' | 'ja' | 'de' | 'es'

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map(l => l.value)

// Resolve a stored language preference to a concrete, supported code. 'system'
// (and any unknown value) follows the OS/browser/device language via
// navigator.language, degrading region tags (ja-JP -> ja) and falling back to
// English. Called fresh on every launch so OS language changes are picked up.
export function resolveLanguage(mode?: LanguageMode | string): string {
  if (mode && mode !== 'system' && SUPPORTED_CODES.includes(mode)) return mode
  const base = (navigator.language || 'en').toLowerCase().split('-')[0]
  return SUPPORTED_CODES.includes(base) ? base : 'en'
}

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
