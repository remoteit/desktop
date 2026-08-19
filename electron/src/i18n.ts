// Minimal i18n for the Electron main process (tray, menus, native dialogs).
// The renderer owns language selection and syncs the resolved code to the main
// process via the `language` field on IPreferences (see EVENTS.preferences).
// A full i18next instance is unnecessary here — this is a handful of flat strings.
import en from './locales/en.json'
import ja from './locales/ja.json'
import de from './locales/de.json'
import es from './locales/es.json'

type Bundle = typeof en
const BUNDLES: { [code: string]: Bundle } = { en, ja, de, es }
const FALLBACK = 'en'

let current = FALLBACK

export function setLanguage(code?: string) {
  const resolved = code && BUNDLES[code] ? code : FALLBACK
  const changed = resolved !== current
  current = resolved
  return changed
}

// Dotted key lookup with {{var}} interpolation, falling back to English then the key.
export function t(key: string, vars?: { [k: string]: string | number }): string {
  const lookup = (bundle: Bundle) =>
    key.split('.').reduce<any>((node, part) => (node == null ? undefined : node[part]), bundle)
  let value = lookup(BUNDLES[current])
  if (typeof value !== 'string') value = lookup(BUNDLES[FALLBACK])
  if (typeof value !== 'string') return key
  if (vars) for (const [k, v] of Object.entries(vars)) value = value.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v))
  return value
}
