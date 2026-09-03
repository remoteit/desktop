#!/usr/bin/env node
// Verifies translation-catalog health across all supported locales.
// Fails (exit 1) when:
//   - a non-English catalog is missing a key that English has
//   - a non-English catalog has a key English no longer has (dead key)
//   - an English value is empty (extracted but no source text supplied)
//   - a translation is STALE: its English source changed after it was translated
// Run: npm run i18n:check  (CI: .github/workflows/typecheck.yml)
//
// Staleness needs a record of the English each translation was made from, because the keys are
// semantic (`options.language.label`), so editing the English text leaves every translation in
// place and silently wrong. That record is scripts/translated-from.json, refreshed by
// `npm run i18n:accept` — run it when new translations land, or to accept an English edit that
// does not invalidate the existing translations (a typo fix, say).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'locales')
const SOURCE = 'en'
const locales = readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
const namespaces = readdirSync(join(root, SOURCE))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace(/\.json$/, ''))

const load = (locale, ns) => JSON.parse(readFileSync(join(root, locale, `${ns}.json`), 'utf8'))

// The English text each non-English translation was made from. Lives OUTSIDE locales/ on
// purpose: that directory is enumerated for namespaces here and lazily imported by i18next, so
// an extra file in it would become a bogus namespace.
const SOURCES_FILE = join(dirname(fileURLToPath(import.meta.url)), 'translated-from.json')
const accept = process.argv.includes('--accept')
const sources = existsSync(SOURCES_FILE) ? JSON.parse(readFileSync(SOURCES_FILE, 'utf8')) : {}
const recorded = {}

// Flatten nested keys to dotted paths, keeping i18next plural suffixes intact.
const flatten = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = v
  }
  return out
}

let errors = 0
const report = msg => {
  errors++
  console.error(`  ✗ ${msg}`)
}

// Plural keys (key_one, key_other, …) expand per-locale: Japanese has only
// `other`, English/German/Spanish have `one`+`other`. So the set of concrete
// keys legitimately differs between locales — compare by plural BASE plus each
// locale's own CLDR categories, not by raw key equality.
const PLURAL_SUFFIX = /^(.*)_(zero|one|two|few|many|other)$/
const splitPlural = key => {
  const m = key.match(PLURAL_SUFFIX)
  return m ? { base: m[1], cat: m[2] } : { base: key, cat: null }
}
const categoriesFor = locale => new Set(new Intl.PluralRules(locale, { type: 'cardinal' }).resolvedOptions().pluralCategories)

for (const ns of namespaces) {
  const source = flatten(load(SOURCE, ns))

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string' && value.trim() === '') report(`[${SOURCE}/${ns}] empty English value: "${key}"`)
  }

  // Split English keys into plain keys and plural bases (a base is "plural" if
  // English carries any plural form of it).
  const sourcePlain = new Set()
  const sourcePluralBases = new Set()
  for (const key of Object.keys(source)) {
    const { base, cat } = splitPlural(key)
    if (cat) sourcePluralBases.add(base)
    else sourcePlain.add(key)
  }

  for (const locale of locales) {
    if (locale === SOURCE) continue
    const target = flatten(load(locale, ns))
    const targetKeys = new Set(Object.keys(target))
    const cats = categoriesFor(locale)

    // Plain keys must match one-for-one.
    for (const key of sourcePlain) if (!targetKeys.has(key)) report(`[${locale}/${ns}] missing key: "${key}"`)

    // Each English plural base must have exactly this locale's plural categories.
    for (const base of sourcePluralBases)
      for (const cat of cats)
        if (!targetKeys.has(`${base}_${cat}`)) report(`[${locale}/${ns}] missing plural form: "${base}_${cat}"`)

    // Stale translations: the English moved after this was translated. Only a NON-EMPTY
    // translation can be stale; an empty one is simply untranslated, which is allowed.
    for (const [key, value] of Object.entries(target)) {
      if (typeof value !== 'string' || !value.trim()) continue
      const english = source[key]
      if (typeof english !== 'string') continue // plural-form/dead-key mismatches are reported below

      ;(recorded[locale] ??= {})[ns] ??= {}
      recorded[locale][ns][key] = english

      const was = sources[locale]?.[ns]?.[key]
      if (was === undefined) continue // never recorded (first run / new translation) — accept it
      if (was !== english)
        report(`[${locale}/${ns}] stale translation: "${key}"\n      English was: ${JSON.stringify(was)}\n      English now: ${JSON.stringify(english)}\n      Update the ${locale} translation, or run "npm run i18n:accept" if it is still correct.`)
    }

    // Dead keys: present here but not accounted for in English.
    for (const key of targetKeys) {
      const { base, cat } = splitPlural(key)
      if (cat) {
        if (!sourcePluralBases.has(base)) report(`[${locale}/${ns}] dead key (not in ${SOURCE}): "${key}"`)
        else if (!cats.has(cat)) report(`[${locale}/${ns}] unexpected plural form for ${locale}: "${key}"`)
      } else if (!sourcePlain.has(key)) {
        report(`[${locale}/${ns}] dead key (not in ${SOURCE}): "${key}"`)
      }
    }
  }
}

if (accept) {
  // Record today's English for every non-empty translation, and drop entries for keys that no
  // longer exist. Says "these translations are current for this English", nothing more.
  writeFileSync(SOURCES_FILE, JSON.stringify(recorded, null, 2) + '\n')
  const count = Object.values(recorded).flatMap(ns => Object.values(ns)).reduce((n, keys) => n + Object.keys(keys).length, 0)
  console.log(`Recorded the English source of ${count} translation(s) in scripts/translated-from.json.`)
  process.exit(0)
}

if (errors) {
  console.error(`\ni18n catalog check failed with ${errors} problem(s). Run "npm run i18n:extract" and fill in translations.`)
  process.exit(1)
}
console.log(`i18n catalog check passed (${locales.length} locales, ${namespaces.length} namespaces).`)
