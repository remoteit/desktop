/* A release's archive, made in the browser as the publishing tool makes it (remoteit/apps tools/lib/archive.mjs): a
   gzipped tar of regular files and directories alone — what the daemon unpacks into ${remoteit.dir} — by name, sorted,
   with no owners and no times; ustar headers, and a PAX header for a path ustar cannot hold. And the other way: a
   publisher's own .tar.gz read back, so its files are checked and packed the same way (presence-server
   docs/device-apps-new-app.md, "Files and packaging"). */

export type Entry = { name: string; data?: Uint8Array; exec?: boolean } // a name ending in / is a directory

const BLOCK = 512
const encoder = new TextEncoder()
const byteLength = (text: string) => encoder.encode(text).length

const octal = (n: number, width: number) => `${n.toString(8).padStart(width - 1, '0')}\0`

function write(block: Uint8Array, text: string, at: number, most?: number) {
  const bytes = encoder.encode(text)
  block.set(most === undefined ? bytes : bytes.subarray(0, most), at)
}

function header({ name, size, mode, type }: { name: string; size: number; mode: number; type: string }) {
  const h = new Uint8Array(BLOCK)
  let prefix = ''
  let base = name
  if (byteLength(name) > 100) {
    const cut = name.lastIndexOf('/', name.length - 2)
    prefix = cut > 0 ? name.slice(0, cut) : ''
    base = cut > 0 ? name.slice(cut + 1) : name
  }
  write(h, base, 0, 100)
  write(h, octal(mode, 8), 100)
  write(h, octal(0, 8), 108) // uid
  write(h, octal(0, 8), 116) // gid
  write(h, octal(size, 12), 124)
  write(h, octal(0, 12), 136) // mtime: none
  h.fill(0x20, 148, 156) // the checksum, as spaces while it is summed
  write(h, type, 156)
  write(h, 'ustar\0', 257)
  write(h, '00', 263)
  write(h, prefix, 345, 155)
  const sum = h.reduce((a, b) => a + b, 0)
  write(h, `${sum.toString(8).padStart(6, '0')}\0 `, 148)
  return h
}

const fitsUstar = (name: string) => {
  if (byteLength(name) <= 100) return true
  const cut = name.lastIndexOf('/', name.length - 2)
  return cut > 0 && byteLength(name.slice(0, cut)) <= 155 && byteLength(name.slice(cut + 1)) <= 100
}

const pad = (n: number) => new Uint8Array((BLOCK - (n % BLOCK)) % BLOCK)

function paxRecord(key: string, value: string) {
  const body = ` ${key}=${value}\n`
  let length = byteLength(body) + 1
  while (String(length).length + byteLength(body) !== length) length = String(length).length + byteLength(body)
  return `${length}${body}`
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

// The tar of entries, before gzip.
export function tar(entries: Entry[]): Uint8Array {
  const parts: Uint8Array[] = []
  for (const e of [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const dir = e.name.endsWith('/')
    const size = dir ? 0 : e.data!.length
    const mode = dir || e.exec ? 0o755 : 0o644
    let name = e.name
    if (!fitsUstar(name)) {
      const pax = encoder.encode(paxRecord('path', name))
      parts.push(header({ name: 'PaxHeader', size: pax.length, mode: 0o644, type: 'x' }), pax, pad(pax.length))
      name = name.slice(-99).replace(/^\/+/, '')
    }
    parts.push(header({ name, size, mode, type: dir ? '5' : '0' }))
    if (!dir) parts.push(e.data!, pad(size))
  }
  parts.push(new Uint8Array(BLOCK * 2))
  return concat(parts)
}

async function through(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(
    await new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream)).arrayBuffer()
  )
}

export const tarGz = async (entries: Entry[]) => through(tar(entries), new CompressionStream('gzip'))

// A gzip's contents, read only up to most bytes: a small archive that unpacks to gigabytes is refused as it is read,
// before the page holds it.
async function gunzip(bytes: Uint8Array, most: number): Promise<Uint8Array> {
  const reader = new Blob([bytes as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
    .getReader()
  const parts: Uint8Array[] = []
  let size = 0
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>
    try {
      chunk = await reader.read()
    } catch {
      throw new ArchiveRefused('not gzip')
    }
    if (chunk.done) return concat(parts)
    size += chunk.value.length
    if (size > most) {
      await reader.cancel()
      throw new ArchiveRefused(`it unpacks to more than ${Math.round(most / 2 ** 20)} MB`)
    }
    parts.push(chunk.value)
  }
}

export class ArchiveRefused extends Error {}

// A path an archive may hold: relative, no . or .. part, no backslash or NUL. Directories end in /.
export function safePath(name: string): string {
  const clean = name.replace(/^(\.\/)+/, '')
  const parts = clean.replace(/\/$/, '').split('/')
  if (
    !clean ||
    clean.startsWith('/') ||
    /[\\\0]/.test(clean) ||
    parts.some(part => part === '' || part === '.' || part === '..')
  )
    throw new ArchiveRefused(name)
  return clean
}

const text = (block: Uint8Array, at: number, length: number) => {
  const field = block.subarray(at, at + length)
  const end = field.indexOf(0)
  return new TextDecoder().decode(end < 0 ? field : field.subarray(0, end))
}
const number = (block: Uint8Array, at: number, length: number) => parseInt(text(block, at, length).trim() || '0', 8)

// A .tar.gz's entries: regular files (with their exec bit) and directories alone, each at a safe path. A link, a
// device, an absolute path or one with .. is refused, saying which: the daemon would unpack none of them. So is an
// archive that is not whole — a header whose checksum fails, an entry cut short, no end — rather than packed again
// as fewer bytes than its author's; and one that unpacks to more than most bytes.
export async function untarGz(bytes: Uint8Array, most = 256 << 20): Promise<Entry[]> {
  const raw = await gunzip(bytes, most)
  const out: Entry[] = []
  let longName: string | undefined
  let ended = false
  for (let at = 0; at + BLOCK <= raw.length; ) {
    const h = raw.subarray(at, at + BLOCK)
    if (h.every(b => b === 0)) {
      ended = true
      break
    }
    const sum = h.reduce((n, b, i) => n + (i >= 148 && i < 156 ? 0x20 : b), 0)
    if (sum !== number(h, 148, 8)) throw new ArchiveRefused('a header is damaged (its checksum fails)')
    const size = number(h, 124, 12)
    if (!Number.isSafeInteger(size) || size < 0 || at + BLOCK + size > raw.length)
      throw new ArchiveRefused(`${text(h, 0, 100)} is cut short: the archive is not whole`)
    const type = String.fromCharCode(h[156] || 0x30)
    const body = raw.subarray(at + BLOCK, at + BLOCK + size)
    at += BLOCK + size + ((BLOCK - (size % BLOCK)) % BLOCK)
    if (type === 'x') {
      longName = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(new TextDecoder().decode(body))?.[1]
      continue
    }
    if (type === 'g') continue
    if (type === 'L') {
      longName = text(body, 0, body.length)
      continue
    }
    const prefix = text(h, 345, 155)
    const name = longName ?? (prefix ? `${prefix}/${text(h, 0, 100)}` : text(h, 0, 100))
    longName = undefined
    if (/^(\.\/)*\.?\/?$/.test(name) && type === '5') continue // the archive's own top, as `tar -C dir .` writes it
    if (type === '5') out.push({ name: `${safePath(name).replace(/\/$/, '')}/` })
    else if (type === '0' || type === '7')
      out.push({ name: safePath(name), data: body.slice(), exec: (number(h, 100, 8) & 0o111) !== 0 })
    else throw new ArchiveRefused(`${name}: not a regular file or a directory`)
  }
  if (!ended) throw new ArchiveRefused('it has no end: the archive is not whole')
  return out
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>))
  return Array.from(digest, b => b.toString(16).padStart(2, '0')).join('')
}
