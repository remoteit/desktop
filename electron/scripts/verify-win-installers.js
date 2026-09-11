#!/usr/bin/env node

// nsis7z (built 2019) silently skips payload entries it cannot decode; 3.47.1 and 3.48.1 lost
// every executable on Windows ARM64 that way. See RELEASE.md, "Windows installer payloads".

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const NSIS7Z_CODERS = new Set([
  'LZMA',
  'LZMA2',
  'BCJ',
  'BCJ2',
  'ARM',
  'ARMT',
  'PPC',
  'SPARC',
  'IA64',
  'DELTA',
  'COPY',
  'PPMD',
  'DEFLATE',
  'BZIP2',
])
// Branding renames the product (Remote.It, Telepath, ...) and with it the installer and app exe.
const PRODUCT_NAME = process.env.PRODUCT_NAME || require(path.join(__dirname, '..', 'package.json')).build.productName
const INSTALLER = new RegExp(
  `^${PRODUCT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-Installer-(ia32|x64|arm64)\\.exe$`
)
const REQUIRED = [
  `${PRODUCT_NAME}.exe`,
  'resources/app.asar',
  'resources/remoteit.exe',
  'resources/connectd.exe',
  'resources/muxer.exe',
  'resources/demuxer.exe',
]
const SEVEN_Z_MAGIC = Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])

function sevenZip() {
  if (process.env.SEVEN_ZIP) return process.env.SEVEN_ZIP
  for (const name of ['7z', '7za', '7zz', 'C:\\Program Files\\7-Zip\\7z.exe']) {
    if (!spawnSync(name, [], { stdio: 'ignore' }).error) return name
  }
  throw new Error('no 7-Zip binary found: install 7-Zip or set SEVEN_ZIP to its path')
}

// The payload is stored uncompressed in the NSIS stub, so its 7z start header gives the
// archive length regardless of what NSIS stores after it.
function extractPayload(installer, dir) {
  const data = fs.readFileSync(installer)
  for (let at = data.indexOf(SEVEN_Z_MAGIC); at !== -1; at = data.indexOf(SEVEN_Z_MAGIC, at + 1)) {
    const nextHeaderOffset = Number(data.readBigUInt64LE(at + 12))
    const nextHeaderSize = Number(data.readBigUInt64LE(at + 20))
    const length = 32 + nextHeaderOffset + nextHeaderSize
    if (length <= 32 || at + length > data.length) continue
    const target = path.join(dir, `${path.basename(installer, '.exe')}.payload.7z`)
    fs.writeFileSync(target, data.subarray(at, at + length))
    return target
  }
  throw new Error(`${installer}: no 7z payload found`)
}

function listEntries(tool, archive) {
  const result = spawnSync(tool, ['l', '-slt', archive], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`${tool} l failed for ${archive}: ${result.stderr || result.stdout}`)
  const entries = []
  for (const block of result.stdout.split(/\r?\n----------\r?\n/)[1].split(/\r?\n\r?\n/)) {
    const kv = {}
    for (const line of block.split(/\r?\n/)) {
      const m = line.match(/^([\w ]+) = (.*)$/)
      if (m) kv[m[1].toLowerCase()] = m[2]
    }
    if (kv.path && kv.method) entries.push({ path: kv.path.replace(/\\/g, '/'), method: kv.method })
  }
  return entries
}

function verify(tool, installer, dir) {
  const entries = listEntries(tool, extractPayload(installer, dir))
  const problems = []
  for (const e of entries) {
    const bad = e.method
      .split(' ')
      .map(t => t.split(':')[0].toUpperCase())
      .filter(c => !NSIS7Z_CODERS.has(c))
    if (bad.length) problems.push(`${e.path}: ${e.method}  (${bad.join(', ')} not decodable by nsis7z)`)
  }
  const present = new Set(entries.map(e => e.path))
  for (const f of REQUIRED) if (!present.has(f)) problems.push(`${f}: missing from payload`)
  const coders = [...new Set(entries.flatMap(e => e.method.split(' ').map(t => t.split(':')[0])))].sort().join(' ')
  return { entries: entries.length, coders, problems }
}

const distDir = path.resolve(process.argv[2] || 'dist')
const installers = fs.readdirSync(distDir).filter(f => INSTALLER.test(f))
if (installers.length === 0) {
  console.error(`[verify-win-installers] no ${PRODUCT_NAME}-Installer-*.exe in ${distDir}`)
  process.exit(1)
}

const tool = sevenZip()
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'win-installers-'))
let failed = false
try {
  for (const name of installers) {
    const { entries, coders, problems } = verify(tool, path.join(distDir, name), tmp)
    if (problems.length) {
      failed = true
      console.error(`[verify-win-installers] ${name}: ${entries} entries, coders: ${coders}`)
      for (const p of problems) console.error(`  - ${p}`)
    } else {
      console.log(`[verify-win-installers] ${name}: OK (${entries} entries, coders: ${coders})`)
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
process.exit(failed ? 1 : 0)
