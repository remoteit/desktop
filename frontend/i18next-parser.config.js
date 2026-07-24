// Extracts t()/<Trans> keys from source into the catalogs so translators always
// have an up-to-date source of truth. Run: npm run i18n:extract
//
// Convention: give every key its English text as the inline default, e.g.
//   t('options.language.label', 'Language')
// The parser writes that default into the English catalog and leaves ja/de/es
// empty for translators. `npm run i18n:check` fails CI on any missing key or
// empty English value.
export default {
  locales: ['en', 'ja', 'de', 'es'],
  defaultNamespace: 'app',
  namespaceSeparator: ':',
  keySeparator: '.',
  input: ['src/**/*.{ts,tsx}'],
  output: 'src/i18n/locales/$LOCALE/$NAMESPACE.json',
  sort: true,
  // Never auto-prune: some keys are built dynamically (e.g. cognito error keys)
  // and the parser can't see them statically. `npm run i18n:check` reports dead
  // keys so they can be removed deliberately.
  keepRemoved: true,
  // English keeps the inline default text (passed as the 4th arg); other locales
  // stay empty until translated.
  defaultValue: (locale, _ns, _key, value) => (locale === 'en' ? value ?? '' : ''),
  createOldCatalogs: false,
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },
}
