#!/usr/bin/env node
// Vendors what the portal's app publishing runs from remoteit/apps — the same code the publishing tool (remoteit-app)
// and graphql use, so the portal never has rules of its own — into src/vendor/remoteit-apps:
//
//   keyfile.mjs           lib/keyfile.mjs, verbatim: the publisher key file (format 1), sealed, opened and signed with
//   rules.mjs             lib/rules.mjs, verbatim: the contract's rules beyond the schema
//   manifestSchema.mjs    schema/manifest.schema.json compiled by ajv to standalone code: the portal's
//                         Content-Security-Policy has no unsafe-eval, and ajv otherwise compiles with new Function
//   fixtures/             fixtures/manifests and fixtures/keys: what the portal's tests check the copies against
//
// The TypeScript declarations beside them (*.d.mts) are the portal's, kept across a run: update them when an export
// changes.
// Each file names the remoteit/apps commit it came from. Run from frontend/, with a clean remoteit/apps checkout
// that has its packages installed:
//   node scripts/vendor-remoteit-apps.mjs ../../apps
// then commit what it wrote. Never edit the vendored files here.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const apps = resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('usage: node scripts/vendor-remoteit-apps.mjs <remoteit/apps checkout>')
const out = resolve('src/vendor/remoteit-apps')
const git = (...args) => execFileSync('git', ['-C', apps, ...args], { encoding: 'utf8' }).trim()
const sources = [
  'lib/keyfile.mjs',
  'lib/rules.mjs',
  'schema/manifest.schema.json',
  'fixtures/manifests',
  'fixtures/keys',
]
if (git('status', '--porcelain', '--', ...sources))
  throw new Error(`${apps}: ${sources.join(', ')} has changes not committed`)
// The commit that last changed a source, which a reader can find in remoteit/apps.
const commitOf = path => git('log', '-1', '--format=%H', '--', path)
const header = path =>
  `// Vendored from remoteit/apps@${commitOf(path)} ${path}: not edited here (scripts/vendor-remoteit-apps.mjs).\n`

// What it writes, written afresh; the declarations beside them (*.d.mts) are the portal's own and kept.
for (const name of ['keyfile.mjs', 'rules.mjs', 'manifestSchema.mjs', 'fixtures'])
  rmSync(join(out, name), { recursive: true, force: true })
mkdirSync(out, { recursive: true })

for (const [from, to] of [
  ['lib/keyfile.mjs', 'keyfile.mjs'],
  ['lib/rules.mjs', 'rules.mjs'],
]) {
  writeFileSync(join(out, to), header(from) + readFileSync(join(apps, from), 'utf8'))
}

// The schema as standalone validation code, with ajv's two runtime helpers written in so it imports nothing.
const require = createRequire(join(apps, 'package.json'))
const Ajv2020 = require('ajv/dist/2020').default
const standalone = require('ajv/dist/standalone').default
const ajv = new Ajv2020({
  strict: true,
  strictRequired: false,
  allowUnionTypes: true,
  allErrors: true,
  code: { source: true, esm: true, lines: false },
})
const schema = JSON.parse(readFileSync(join(apps, 'schema/manifest.schema.json'), 'utf8'))
let code = standalone(ajv, ajv.compile(schema))
const runtime = {
  'ajv/dist/runtime/ucs2length': `function ucs2length(str) { let length = 0, pos = 0, value; while (pos < str.length) { length++; value = str.charCodeAt(pos++); if (value >= 0xd800 && value <= 0xdbff && pos < str.length) { value = str.charCodeAt(pos); if ((value & 0xfc00) === 0xdc00) pos++ } } return length }`,
  'ajv/dist/runtime/equal': `function equal(a, b) { if (a === b) return true; if (a && b && typeof a == 'object' && typeof b == 'object') { if (a.constructor !== b.constructor) return false; if (Array.isArray(a)) { if (a.length !== b.length) return false; for (let i = a.length; i-- !== 0;) if (!equal(a[i], b[i])) return false; return true } const keys = Object.keys(a); if (keys.length !== Object.keys(b).length) return false; for (const k of keys) if (!Object.prototype.hasOwnProperty.call(b, k) || !equal(a[k], b[k])) return false; return true } return a !== a && b !== b }`,
}
const helpers = []
code = code.replace(/const (\w+) = require\("([^"]+)"\)\.default;?/g, (_, name, module) => {
  if (!runtime[module]) throw new Error(`the standalone code needs ${module}, which this script does not write in`)
  helpers.push(`const ${name} = ${runtime[module].replace(/^function \w+/, 'function')}`)
  return ''
})
if (/require\(/.test(code)) throw new Error('the standalone code still requires a module')
writeFileSync(
  join(out, 'manifestSchema.mjs'),
  `${header('schema/manifest.schema.json')}// The contract-1 manifest schema, compiled by ajv ${
    require('ajv/package.json').version
  } (standalone).\n/* eslint-disable */\n// @ts-nocheck\n${helpers.join('\n')}\n${code}\n`
)

for (const dir of ['fixtures/manifests', 'fixtures/keys']) {
  cpSync(join(apps, dir), join(out, dir), { recursive: true })
  writeFileSync(join(out, dir, 'SOURCE'), `remoteit/apps@${commitOf(dir)} ${dir}\n`)
}
console.log(`wrote ${out} from remoteit/apps ${git('rev-parse', 'HEAD')}`)
