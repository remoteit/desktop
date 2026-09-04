#!/usr/bin/env node
// Regenerate frontend/src/platforms/catalogue.generated.json from the API's platform catalogue.
//
//   node scripts/platforms-generate.mjs --cli      # rewrite the snapshot, via the remote.it CLI
//   node scripts/platforms-generate.mjs            # ...or with R3_API_TOKEN set directly
//   node scripts/platforms-generate.mjs --check    # exit 1 if the committed snapshot is stale
//
// `--cli` is the easy path: it shells out to `sudo remoteit exec-gql`, so the CLI supplies the
// credentials and there is nothing to paste. It needs sudo because the CLI runs as root, which is
// fine for an occasional developer refresh and is exactly why this is NOT a CI mechanism.
//
// Env: R3_API_TOKEN — used when --cli is not given: a bearer JWT for the GraphQL API. The Bearer
//      path accepts Cognito and agent JWTs, both short-lived, so there is no static token to
//      configure — take one from a signed-in session (dev tools → Network → any request to
//      api.remote.it/graphql/v1 → copy the Authorization bearer value).
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
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import prettier from 'prettier'

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
const viaCli = process.argv.includes('--cli')

const INSTALLATION =
  'slug name kind commandTemplate description instructions link services { application port name host enabled }'
const QUERY = `{
  platformTypes { id label installations { slug } }
  platformInstallations { ${INSTALLATION} }
}`

// `remoteit exec-gql --json` answers with a status envelope whose data carries the GraphQL
// response — as a string in the versions seen so far, but unwrap an object too rather than
// depending on which.
export function unwrapCli(stdout) {
  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    throw new Error(`remoteit exec-gql did not return JSON: ${stdout.slice(0, 160)}`)
  }

  // Both shapes carry a top-level `data` meaning different things, so `code` is the
  // discriminator: the CLI's status envelope has one, a bare GraphQL response does not.
  const envelope = typeof parsed?.code === 'number' ? parsed : null
  const raw = envelope ? envelope.data : parsed
  if (envelope && raw === undefined)
    throw new Error(`remoteit exec-gql failed: ${envelope.message || stdout.slice(0, 160)}`)

  const body = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (body?.errors?.length) {
    const messages = body.errors.map(e => e.message).join('; ')
    // The catalogue fields ship with graphql-api's platform-catalogue work. Until that is
    // deployed to whichever stage this is pointed at, the schema simply has no such fields, and
    // "Did you mean name?" is a confusing way to learn that.
    if (/platformInstallations|"(label|installations|slug)"/.test(messages)) {
      throw new Error(
        'This stage does not serve the platform catalogue yet — the schema has no `label`, ' +
          '`installations` or `platformInstallations` (graphql-api#209 is not deployed here). ' +
          'Point at a stage that has it, or leave the committed snapshot alone until it ships.\n' +
          `  GraphQL said: ${messages}`
      )
    }
    throw new Error(messages)
  }
  if (!body?.data) throw new Error(`exec-gql returned no data: ${stdout.slice(0, 160)}`)

  return body.data
}

function fromCli() {
  let stdout
  try {
    // stdin/stderr inherited so sudo can prompt and the CLI's own errors reach the terminal.
    stdout = execFileSync('sudo', ['remoteit', 'exec-gql', '--json', '--query', QUERY], {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'inherit'],
    })
  } catch (error) {
    // execFileSync throws an object that prints as an unreadable dump; say what to check instead.
    throw new Error(
      '`sudo remoteit exec-gql` failed (see above). The CLI runs as root, so this needs sudo. ' +
        'Check that the remote.it CLI is installed and signed in, or set R3_API_TOKEN and drop --cli.'
    )
  }
  const data = unwrapCli(stdout)
  if (!data.platformTypes) throw new Error('exec-gql returned no platformTypes')
  return normalise(data.platformTypes, data.platformInstallations || [])
}

async function fromApi() {
  const token = process.env.R3_API_TOKEN
  if (!token)
    throw new Error(
      'R3_API_TOKEN is required (a bearer JWT for the GraphQL API) — or pass --cli to use the remote.it CLI instead'
    )
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`${API} → HTTP ${res.status}`)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`${API} → HTTP ${res.status} but not JSON (edge/WAF page?): ${text.slice(0, 80)}`)
  }
  if (body.errors?.length) throw new Error(body.errors.map(e => e.message).join('; '))
  if (!body.data?.platformTypes) throw new Error(`${API} returned no platformTypes`)
  return normalise(body.data.platformTypes, body.data.platformInstallations || [])
}

// Drop null/undefined recursively; keep [] (it means "none", distinct from unset).
const clean = value =>
  Array.isArray(value)
    ? value.map(clean)
    : value && typeof value === 'object'
    ? Object.fromEntries(
        Object.entries(value)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => [k, clean(v)])
      )
    : value

// Three maps: every platform type id to the name to show for it; every onboarding page by slug,
// carrying the type ids it onboards with those same labels; and, for the types that several
// pages onboard, their routes default first — so the registry never has to invert anything, or
// re-derive a name, at startup. Pages are keyed by SLUG: the API's `id` is a surrogate uuid it
// may rename a slug under, and the desktop's logo components are stored by slug. `label` is the
// API's own displayName-or-name rule; it is never recomputed here.
export function normalise(platformTypes, platformInstallations) {
  const types = {}
  const installations = {}
  const routes = {}
  const page = slug => (installations[slug] ??= { types: {} })
  for (const { slug, ...rest } of platformInstallations) installations[slug] = { ...clean(rest), types: {} }
  for (const t of platformTypes) {
    if (typeof t.label !== 'string') continue
    types[t.id] = t.label
    const slugs = (t.installations ?? []).map(route => route.slug)
    for (const slug of slugs) page(slug).types[t.id] = t.label
    if (slugs.length > 1) routes[t.id] = slugs
  }
  return { types, routes, installations }
}

const canonical = data => JSON.stringify(data, null, 2) + '\n'
// What is written goes through the project's prettier, so a regeneration never leaves a file that
// format-on-save would then change. Comparison stays on `canonical`, which parsing makes
// formatting-immune.
const formatted = (file, text) => prettier.format(text, { filepath: file })

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
      ;(merged[slug] ??= {})[field] = locale === 'en' ? value : existing[slug]?.[field] ?? ''
    }
  }
  return { file, merged }
}

function writeCatalogs(installations) {
  const english = catalogFrom(installations)
  const written = []
  for (const locale of fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)) {
    const { file, merged } = mergeCatalog(locale, english)
    const next = canonical(merged)
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== next) {
      fs.writeFileSync(file, formatted(file, next))
      written.push(locale)
    }
  }
  return { keys: Object.values(english).reduce((n, f) => n + Object.keys(f).length, 0), written }
}

// Only run when invoked directly, so the helpers above stay importable (and testable).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = viaCli ? fromCli() : await fromApi()
  const live = Object.keys(data.installations).length > 0
  if (!live) {
    // The API deploy is ahead of the migration: nothing to compare against yet, and writing
    // this would strip every /add page's data from the app.
    console.log(
      `${API} serves no platform catalogue yet (migration pending) — ${
        check ? 'nothing to check' : 'refusing to overwrite the snapshot'
      }`
    )
    process.exit(check ? 0 : 2)
  }
  const next = canonical(data)
  if (check) {
    const current = fs.existsSync(OUT) ? canonical(JSON.parse(fs.readFileSync(OUT, 'utf8'))) : ''
    const englishFile = path.join(LOCALES_DIR, 'en', `${NAMESPACE}.json`)
    const englishCurrent = fs.existsSync(englishFile) ? fs.readFileSync(englishFile, 'utf8') : ''
    if (current !== next || englishCurrent !== canonical(catalogFrom(data.installations))) {
      console.error(
        `STALE: the committed platform snapshot or its English catalog differs from the API. Run: npm run platforms:generate`
      )
      process.exit(1)
    }
    console.log('platform catalogue snapshot is up to date')
  } else {
    fs.writeFileSync(OUT, formatted(OUT, next))
    const { keys, written } = writeCatalogs(data.installations)
    console.log(
      `wrote ${path.relative(process.cwd(), OUT)}: ${Object.keys(data.types).length} types, ${
        Object.keys(data.installations).length
      } installations`
    )
    console.log(
      `wrote ${keys} translatable string(s) to the ${NAMESPACE} catalog${
        written.length ? ` (${written.join(', ')})` : ' (no change)'
      }`
    )
  }
}
