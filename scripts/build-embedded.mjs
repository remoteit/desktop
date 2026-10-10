#!/usr/bin/env node
// node scripts/build-embedded.mjs <stage> [--out DIR] — the portal as an EMBEDDED bundle for a stage (device-package
// docs/one-app-plan.md, "The portal bundle"): the production build with the stage's endpoints, loading from its own
// files with no server behind it — relative paths throughout, the hash router — for a native shell to serve: the menu
// app from its local server on a desktop, Capacitor (webDir) on a phone. Beside index.html, portal-manifest.json says
// what it is: the portal's version and commit, the stage, the bridge interface it was built against (thisDevice.ts
// BRIDGE_VERSION), and the Capacitor core and plugin versions its JavaScript calls. A shell refuses a bundle whose stage,
// bridge major version or plugin versions are not its own.
//
// The stage's settings are the stage's portal's own (r3-infra stage/portal.tf portal_env for solo; the same names on
// every stage): <service>.<stage>.remote.it, prod's without the stage. Every VITE_* a checkout's own .env files name is
// set first — empty where the stage has no value — so a developer's .env.local (another stage's) never reaches the
// bundle. Output: dist/portal-<stage>/ (ignored), or --out.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const stage = args.find(a => !a.startsWith('--'))
const outFlag = args.indexOf('--out')
if (!stage || !/^[a-z][a-z0-9-]{0,19}$/.test(stage)) {
  console.error('usage: node scripts/build-embedded.mjs <stage> [--out DIR]   (stage: prod, dev, solo, a local stack)')
  process.exit(64)
}
const out = path.resolve(outFlag >= 0 ? args[outFlag + 1] : path.join(root, 'dist', `portal-${stage}`))

function stageEnv(stage) {
  const domain = stage === 'prod' ? 'remote.it' : `${stage}.remote.it`
  const cloud = `https://cloud.${domain}/api`
  const env = {
    BRAND: 'remoteit',
    VITE_PORTAL: 'true',
    VITE_EMBEDDED: 'true',
    VITE_PORTAL_URL: `https://app.${domain}`,
    VITE_OAUTH_ISSUER: `https://login.${domain}`,
    // Not used in a shell (it signs in; services/oidc "the SHELL's sign-in") — the portal's, for a bundle opened alone.
    VITE_OAUTH_CLIENT_ID: 'remoteit_portal',
    VITE_OAUTH_GRAPHQL_RESOURCE: cloud,
    VITE_GRAPHQL_API: `${cloud}/graphql`,
    VITE_GRAPHQL_BETA_API: `${cloud}/graphql`,
    VITE_WEBSOCKET_URL: `wss://cloud.${domain}/api/ws`,
    VITE_WEBSOCKET_BETA_URL: `wss://cloud.${domain}/api/ws`,
    VITE_OAUTH_MCP_RESOURCE: `https://cloud.${domain}/mcp`,
    VITE_OAUTH_MCP_DETAIL: 'remoteit_mcp',
    VITE_OAUTH_AGENT_RESOURCE: `https://agent.${domain}`,
    VITE_AGENT_URL: `https://agent.${domain}`,
    VITE_DEVICE_DOWNLOADS_URL: `https://downloads.${domain}/device`,
    // The REST API is not part of a stage (r3-infra portal.tf): a stage's name that answers nothing, never prod's.
    VITE_API_URL: stage === 'prod' ? 'https://api.remote.it/apv/v27' : `https://api.${domain}/apv/v27`,
    // Airbrake off, as on the stages' portals; Zendesk, Segment and Tag Manager unset (each skipped without its key).
    VITE_AIRBRAKE_ID: '1',
    VITE_AIRBRAKE_KEY: `${stage}-none`,
  }
  // solo's API serves device sessions to every account (portal.tf VITE_DEVICE_SESSIONS).
  if (stage === 'solo') env.VITE_DEVICE_SESSIONS = 'on'
  return env
}

const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { stdio: 'inherit', ...opts })
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))

// Every VITE_* the checkout's .env files name, blank, then the stage's.
const blanks = {}
for (const dir of [root, path.join(root, 'frontend')])
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : [])
    if (f.startsWith('.env') && f !== '.env.example')
      for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
        const m = line.match(/^\s*(VITE_[A-Z0-9_]*)\s*=/)
        if (m) blanks[m[1]] = ''
      }
const env = { ...process.env, ...blanks, ...stageEnv(stage), NODE_ENV: 'production' }

const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim()
const dirty = git('status', '--porcelain', '--untracked-files=no') !== ''
const commit = git('rev-parse', '--short=12', 'HEAD') + (dirty ? '-dirty' : '')

console.log(`building the embedded portal for ${stage} (${commit}) into ${out}`)
run('bash', [path.join(root, 'scripts/brand-web.sh'), 'remoteit'], { cwd: root, env, stdio: 'ignore' })
run('npx', ['vite', 'build', '--mode', 'production', '--outDir', out, '--emptyOutDir'], {
  cwd: path.join(root, 'frontend'),
  env: { ...env, NODE_OPTIONS: '--max-old-space-size=4096' },
})

// Loads from its own files: nothing in index.html may point at the server's root.
const index = fs.readFileSync(path.join(out, 'index.html'), 'utf8')
const rooted = [...index.matchAll(/(?:src|href)="(\/[^/"][^"]*)"/g)].map(m => m[1])
if (rooted.length) {
  console.error(`build-embedded: index.html points at the server's root: ${rooted.join(', ')}`)
  process.exit(1)
}

// The manifest. Capacitor's core and every plugin the portal depends on, at the versions installed — what its
// JavaScript calls, and what a Capacitor shell must carry natively.
const frontend = read(path.join(root, 'frontend/package.json'))
const installed = name => {
  for (const dir of [path.join(root, 'frontend/node_modules'), path.join(root, 'node_modules')]) {
    const f = path.join(dir, name, 'package.json')
    if (fs.existsSync(f)) return read(f).version
  }
  return null
}
const capacitorNames = Object.keys(frontend.dependencies).filter(n => /^@capacitor(-community)?\/|^capacitor-/.test(n))
const thisDevice = fs.readFileSync(path.join(root, 'frontend/src/services/thisDevice.ts'), 'utf8')
const bridgeVersion = thisDevice.match(/export const BRIDGE_VERSION = '([^']+)'/)?.[1]
if (!bridgeVersion) throw new Error('no BRIDGE_VERSION in thisDevice.ts')
const manifest = {
  name: 'remoteit-portal',
  version: frontend.version,
  commit,
  stage,
  bridgeVersion,
  capacitor: {
    core: installed('@capacitor/core'),
    plugins: Object.fromEntries(capacitorNames.filter(n => n !== '@capacitor/core').map(n => [n, installed(n)])),
  },
  builtAt: new Date().toISOString(),
}
fs.writeFileSync(path.join(out, 'portal-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`portal-manifest.json: ${JSON.stringify({ stage, version: manifest.version, commit, bridgeVersion })}`)
