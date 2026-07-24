#!/usr/bin/env node
// Verifies translation-catalog health across all supported locales.
// Fails (exit 1) when:
//   - a non-English catalog is missing a key that English has
//   - a non-English catalog has a key English no longer has (dead key)
//   - an English value is empty (extracted but no source text supplied)
// Run: npm run i18n:check  (also used in CI)
import { readFileSync, readdirSync } from 'node:fs'
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

for (const ns of namespaces) {
  const source = flatten(load(SOURCE, ns))
  const sourceKeys = new Set(Object.keys(source))

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string' && value.trim() === '') report(`[${SOURCE}/${ns}] empty English value: "${key}"`)
  }

  for (const locale of locales) {
    if (locale === SOURCE) continue
    const target = flatten(load(locale, ns))
    const targetKeys = new Set(Object.keys(target))
    for (const key of sourceKeys) if (!targetKeys.has(key)) report(`[${locale}/${ns}] missing key: "${key}"`)
    for (const key of targetKeys) if (!sourceKeys.has(key)) report(`[${locale}/${ns}] dead key (not in ${SOURCE}): "${key}"`)
  }
}

if (errors) {
  console.error(`\ni18n catalog check failed with ${errors} problem(s). Run "npm run i18n:extract" and fill in translations.`)
  process.exit(1)
}
console.log(`i18n catalog check passed (${locales.length} locales, ${namespaces.length} namespaces).`)
