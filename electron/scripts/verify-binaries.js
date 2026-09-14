const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const binRoot = path.join(root, 'bin')
const build = require(path.join(root, 'package.json')).build
const binaryNames = ['remoteit', 'connectd', 'demuxer', 'muxer']

// downloads.remote.it answers a missing key with its HTML download page and HTTP 200, so the
// `curl -f` in binary-installer.sh cannot tell a binary from a 404; only the bytes can.
const platforms = {
  darwin: { config: 'mac', ext: '', format: 'Mach-O', magic: ['cffaedfe', 'cefaedfe', 'cafebabe'] },
  linux: { config: 'linux', ext: '', format: 'ELF', magic: ['7f454c46'] },
  win32: { config: 'win', ext: '.exe', format: 'PE', magic: ['4d5a'] },
}

const archsOf = config => [...new Set(build[config].target.flatMap(target => target.arch))]

function describe(platform, filePath) {
  let stat
  try {
    stat = fs.statSync(filePath)
  } catch {
    return 'missing'
  }
  if (!stat.isFile() || stat.size === 0) return 'empty'
  const fd = fs.openSync(filePath, 'r')
  const head = Buffer.alloc(64)
  const read = fs.readSync(fd, head, 0, 64, 0)
  fs.closeSync(fd)
  const hex = head.subarray(0, read).toString('hex')
  if (platform.magic.some(magic => hex.startsWith(magic))) return null
  const text = head.subarray(0, read).toString('latin1').trimStart().toLowerCase()
  if (text.startsWith('<!doctype') || text.startsWith('<html'))
    return 'is an HTML page - the download URL resolved to the download page, not a binary'
  return `is not ${platform.format} (starts with ${hex.slice(0, 8)})`
}

function main() {
  const platform = platforms[process.platform]
  if (!platform) {
    console.log(`[verify-binaries] No checks defined for platform '${process.platform}', skipping.`)
    return 0
  }

  const archs = archsOf(platform.config)
  const problems = []
  for (const arch of archs) {
    for (const name of binaryNames) {
      const filePath = path.join(binRoot, arch, `${name}${platform.ext}`)
      const problem = describe(platform, filePath)
      if (problem) problems.push(`${filePath} ${problem}`)
    }
  }

  if (problems.length > 0) {
    console.error('[verify-binaries] Bundled binaries are not usable:')
    for (const entry of problems) console.error(`  - ${entry}`)
    console.error('[verify-binaries] Run `npm run install-binaries` in electron/ and retry.')
    return 1
  }

  console.log(`[verify-binaries] OK (${archs.join(', ')})`)
  return 0
}

module.exports = { archsOf, binaryNames }
if (require.main === module) process.exit(main())
