#!/usr/bin/env node

// Rewrite the Windows update manifests electron-builder wrote into dist/ so the
// updater's choice of installer no longer depends on build order.
//
// electron-updater picks a Windows installer from `files` in latest.yml:
//   <= 6.6.2  the first `.exe` entry, whatever it is
//   >= 6.6.4  the first entry whose name contains process.arch, else the first `.exe`
// electron-builder orders `files` by build completion, so the first entry changes
// between releases. Every client on <= 3.46.1 shipped 6.6.2 and will install
// whatever is first, so it has to be the one installer that runs on every Windows
// machine: ia32. Newer clients find their own arch by name, and a build running
// under emulation asks for `latest-<arch>.yml` instead (src/backend/updateChannel.ts),
// which this script also writes.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const yaml = require('js-yaml')

const ARCH_ORDER = ['ia32', 'x64', 'arm64']
const CHANNELS = ['latest', 'beta', 'alpha']

const archOf = url => (url.match(/-(ia32|x64|arm64)\.exe$/i) || [])[1]?.toLowerCase()
const sha512 = file => crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64')

function finalize(dir, channel) {
  const manifestPath = path.join(dir, `${channel}.yml`)
  if (!fs.existsSync(manifestPath)) return []

  const info = yaml.load(fs.readFileSync(manifestPath, 'utf8'))
  const byArch = new Map()

  for (const entry of info.files || []) {
    const arch = archOf(entry.url)
    if (!arch) {
      console.warn(`[manifests] ${channel}.yml: dropping ${entry.url} - no architecture in its name`)
      continue
    }
    const file = path.join(dir, entry.url)
    if (!fs.existsSync(file)) throw new Error(`${channel}.yml lists ${entry.url} but it is not in ${dir}`)
    if (sha512(file) !== entry.sha512) throw new Error(`${entry.url}: sha512 in ${channel}.yml does not match the file`)
    if (entry.size != null && fs.statSync(file).size !== entry.size) throw new Error(`${entry.url}: size in ${channel}.yml does not match the file`)
    byArch.set(arch, entry)
  }

  const files = ARCH_ORDER.filter(arch => byArch.has(arch)).map(arch => byArch.get(arch))
  if (files.length === 0) throw new Error(`${channel}.yml has no per-arch installers`)

  const write = (name, list) => {
    const out = { ...info, files: list, path: list[0].url, sha512: list[0].sha512 }
    const target = path.join(dir, name)
    fs.writeFileSync(target, yaml.dump(out, { lineWidth: -1 }))
    return target
  }

  const written = [write(`${channel}.yml`, files)]
  for (const entry of files) written.push(write(`${channel}-${archOf(entry.url)}.yml`, [entry]))
  return written
}

const dir = path.resolve(process.argv[2] || 'dist')
const written = CHANNELS.flatMap(channel => finalize(dir, channel))
if (written.length === 0) {
  console.error(`[manifests] no Windows update manifest (${CHANNELS.map(c => `${c}.yml`).join(', ')}) in ${dir}`)
  process.exit(1)
}
for (const file of written) console.log(path.relative(process.cwd(), file).split(path.sep).join('/'))
