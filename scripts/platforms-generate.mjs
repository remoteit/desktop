#!/usr/bin/env node
// Regenerate frontend/src/platforms/catalogue.generated.json from the API's platform catalogue.
//
//   node scripts/platforms-generate.mjs            # rewrite the snapshot from the API
//   node scripts/platforms-generate.mjs --check    # exit 1 if the committed snapshot is stale
//
// Env: R3_API_TOKEN — a bearer JWT for the GraphQL API (the API's Bearer path accepts Cognito
//      and agent JWTs, which are short-lived; a long-lived CI credential needs the access-key
//      signature scheme instead — see graphql-api docs/PLATFORM-CATALOGUE.md).
//      R3_GRAPHQL_API | VITE_GRAPHQL_API — endpoint (default: the prod GraphQL API).
//
// The API is the single source of truth for platform names, onboarding routes and install
// commands. The committed JSON is a BUILD-TIME SNAPSHOT of it — the app reads only that file,
// so a catalogue change reaches clients when this is re-run and shipped. The desktop keeps only
// what is code (logo components, one override, a few JSX blocks) in frontend/src/platforms/*/.
//
// NOT WIRED INTO CI, deliberately. Two reasons, and the credential is the smaller one:
//   1. The snapshot is MEANT to lag the database until someone regenerates and ships, so
//      "differs from the API" is the normal state after any row edit, not a fault. As a per-PR
//      gate it would turn every open pull request red for a change none of them made. The right
//      trigger is a scheduled job that regenerates and opens a PR with the diff.
//   2. Auth is enforced at the GATEWAY (`POST /graphql` carries an authorizer), not the
//      resolver, so the request never reaches platformTypes and dropping @Authorized() would
//      change nothing — a public catalogue would mean a new unauthenticated route. The API's
//      Bearer path also takes only short-lived JWTs, so no static CI secret can satisfy it.
//      If this is ever automated, `Authorization: Signature` (access key) is the mechanism that
//      needs no new surface.
// Until then this is a local tool: `npm run platforms:generate` after a catalogue change.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '..', 'frontend', 'src', 'platforms', 'catalogue.generated.json')
const LOCALES_DIR = path.join(here, '..', 'frontend', 'src', 'i18n', 'locales')
const NAMESPACE = 'platforms'
// English comes from the database; the other locales are for translators. The keys are built at
// render time (`platforms:<slug>.description`), so i18next-parser cannot see them statically —
// this script maintains the catalogs instead, the same arrangement the parser config already
// documents for the `columns.<id>` labels.
const TRANSLATABLE = ['name', 'description', 'instructions']
const API = process.env.R3_GRAPHQL_API || process.env.VITE_GRAPHQL_API || 'https://api.remote.it/graphql/v1'
const check = process.argv.includes('--check')

const INSTALLATION = 'id name kind commandTemplate description instructions link services { application port name host enabled }'
const QUERY = `{
  platformTypes { id label installation { ${INSTALLATION} } }
  platformInstallations { ${INSTALLATION} }
}`

async function fromApi() {
  const token = process.env.R3_API_TOKEN
  if (!token) throw new Error('R3_API_TOKEN is required (a bearer JWT for the GraphQL API)')
  const res = await fetch(API, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${token}`},
    body: JSON.stringify({query: QUERY}),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`${API} → HTTP ${res.status}`)
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { throw new Error(`${API} → HTTP ${res.status} but not JSON (edge/WAF page?): ${text.slice(0, 80)}`) }
  if (body.errors?.length) throw new Error(body.errors.map(e => e.message).join('; '))
  if (!body.data?.platformTypes) throw new Error(`${API} returned no platformTypes`)
  return normalise(body.data.platformTypes, body.data.platformInstallations || [])
}

// Drop null/undefined recursively; keep [] (it means "none", distinct from unset).
const clean = value => Array.isArray(value)
  ? value.map(clean)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [k, clean(v)]))
    : value

// Two maps: every platform type id to the name to show for it, and every onboarding page by
// slug, each carrying the type ids it onboards with those same labels — so the registry never
// has to invert anything, or re-derive a name, at startup. `label` is the API's own
// displayName-or-name rule; it is never recomputed here.
export function normalise(platformTypes, platformInstallations) {
  const types = {}
  const installations = {}
  const page = row => {
    const {id, ...rest} = row
    installations[id] ??= {...clean(rest), types: {}}
    return installations[id]
  }
  for (const row of platformInstallations) page(row)
  for (const t of platformTypes) {
    if (typeof t.label !== 'string') continue
    types[t.id] = t.label
    if (t.installation) page(t.installation).types[t.id] = t.label
  }
  return {types, installations}
}

const canonical = data => JSON.stringify(data, null, 2) + '\n'

// Build `<slug>.<field>` entries for every translatable string in the catalogue.
function catalogFrom(installations) {
  const out = {}
  for (const [slug, row] of Object.entries(installations)) {
    for (const field of TRANSLATABLE) {
      if (typeof row[field] === 'string' && row[field].trim()) (out[slug] ??= {})[field] = row[field]
    }
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
}

// English takes the catalogue text. Other locales KEEP whatever has been translated, gain empty
// entries for new keys, and lose entries for keys that no longer exist — so regenerating can
// never discard a translation.
function mergeCatalog(locale, english) {
  const file = path.join(LOCALES_DIR, locale, `${NAMESPACE}.json`)
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  const merged = {}
  for (const [slug, fields] of Object.entries(english)) {
    for (const [field, value] of Object.entries(fields)) {
      (merged[slug] ??= {})[field] = locale === 'en' ? value : existing[slug]?.[field] ?? ''
    }
  }
  return {file, merged}
}

function writeCatalogs(installations) {
  const english = catalogFrom(installations)
  const written = []
  for (const locale of fs.readdirSync(LOCALES_DIR, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name)) {
    const {file, merged} = mergeCatalog(locale, english)
    const next = canonical(merged)
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== next) { fs.writeFileSync(file, next); written.push(locale) }
  }
  return {keys: Object.values(english).reduce((n, f) => n + Object.keys(f).length, 0), written}
}

const data = await fromApi()
const live = Object.keys(data.installations).length > 0
if (!live) {
  // The API deploy is ahead of the migration / the stage's PLATFORM_CATALOGUE flag: nothing to
  // compare against yet, and writing this would strip every /add page's data from the app.
  console.log(`${API} serves no platform catalogue yet (flag off or migration pending) — ${check ? 'nothing to check' : 'refusing to overwrite the snapshot'}`)
  process.exit(check ? 0 : 2)
}
const next = canonical(data)
if (check) {
  const current = fs.existsSync(OUT) ? canonical(JSON.parse(fs.readFileSync(OUT, 'utf8'))) : ''
  const englishFile = path.join(LOCALES_DIR, 'en', `${NAMESPACE}.json`)
  const englishCurrent = fs.existsSync(englishFile) ? fs.readFileSync(englishFile, 'utf8') : ''
  if (current !== next || englishCurrent !== canonical(catalogFrom(data.installations))) {
    console.error(`STALE: the committed platform snapshot or its English catalog differs from the API. Run: npm run platforms:generate`)
    process.exit(1)
  }
  console.log('platform catalogue snapshot is up to date')
} else {
  fs.writeFileSync(OUT, next)
  const {keys, written} = writeCatalogs(data.installations)
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${Object.keys(data.types).length} types, ${Object.keys(data.installations).length} installations`)
  console.log(`wrote ${keys} translatable string(s) to the ${NAMESPACE} catalog${written.length ? ` (${written.join(', ')})` : ' (no change)'}`)
}
