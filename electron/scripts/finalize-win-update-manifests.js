#!/usr/bin/env node

// Pin latest.yml's `files` order (ia32 first, the one installer every Windows machine runs)
// and write the latest-<arch>.yml an emulated build asks for. See RELEASE.md, "Windows update manifests".

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const yaml = require('js-yaml')
const { archsOf } = require('./verify-binaries')

const ARCH_ORDER = ['ia32', 'x64', 'arm64']
const unplaced = archsOf('win').filter(arch => !ARCH_ORDER.includes(arch))
if (unplaced.length)
  throw new Error(`ARCH_ORDER has no place for ${unplaced.join(', ')} (package.json build.win.target)`)

const archOf = url => (url.match(new RegExp(`-(${ARCH_ORDER.join('|')})\\.exe$`, 'i')) || [])[1]?.toLowerCase()

function sha512(file) {
  const hash = crypto.createHash('sha512')
  const fd = fs.openSync(file, 'r')
  const chunk = Buffer.alloc(1 << 20)
  try {
    for (let read; (read = fs.readSync(fd, chunk)) > 0; ) hash.update(chunk.subarray(0, read))
  } finally {
    fs.closeSync(fd)
  }
  return hash.digest('base64')
}

const dir = path.resolve(process.argv[2] || 'dist')
const manifestPath = path.join(dir, 'latest.yml')
if (!fs.existsSync(manifestPath)) throw new Error(`no latest.yml in ${dir}`)

const info = yaml.load(fs.readFileSync(manifestPath, 'utf8'))
const byArch = new Map()
for (const entry of info.files || []) {
  const arch = archOf(entry.url)
  if (!arch) {
    console.warn(`[manifests] latest.yml: dropping ${entry.url} - no architecture in its name`)
    continue
  }
  const file = path.join(dir, entry.url)
  if (!fs.existsSync(file)) throw new Error(`latest.yml lists ${entry.url} but it is not in ${dir}`)
  if (entry.size != null && fs.statSync(file).size !== entry.size)
    throw new Error(`${entry.url}: size in latest.yml does not match the file`)
  if (sha512(file) !== entry.sha512) throw new Error(`${entry.url}: sha512 in latest.yml does not match the file`)
  byArch.set(arch, entry)
}

const archs = ARCH_ORDER.filter(arch => byArch.has(arch))
if (archs.length === 0) throw new Error('latest.yml has no per-arch installers')

const write = (name, list) => {
  const out = { ...info, files: list, path: list[0].url, sha512: list[0].sha512 }
  const target = path.join(dir, name)
  fs.writeFileSync(target, yaml.dump(out, { lineWidth: -1 }))
  return target
}

const written = [
  write(
    'latest.yml',
    archs.map(arch => byArch.get(arch))
  ),
]
for (const arch of archs) written.push(write(`latest-${arch}.yml`, [byArch.get(arch)]))
for (const file of written) console.log(path.relative(process.cwd(), file).split(path.sep).join('/'))
