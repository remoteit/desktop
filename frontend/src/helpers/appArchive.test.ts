// @vitest-environment node
import { createHash } from 'crypto'
import { gzipSync } from 'zlib'
import { describe, expect, it } from 'vitest'
import { ArchiveRefused, Entry, tar, tarGz, untarGz } from './appArchive'

/* The portal packs a release's files as the publishing tool does — the same tar, byte for byte, before gzip —, and
   reads a publisher's own .tar.gz back, refusing what the daemon would never unpack. */

const enc = (text: string) => new TextEncoder().encode(text)
const LONG = 'deep/' + 'd'.repeat(120) + '/' + 'f'.repeat(120) + '.txt'
const ENTRIES: Entry[] = [
  { name: 'bin/' },
  { name: 'bin/panel', data: enc('#!/bin/sh\necho hi\n'), exec: true },
  { name: 'templates/panel.conf', data: enc('title=${setting.title}\n') },
  { name: LONG, data: enc('x') },
  { name: 'templates/' },
  { name: 'deep/' },
]

// A raw tar of one header per entry, as another tool might write it: name, type, mode, and data.
function foreign(items: { name: string; type: string; mode?: number; data?: string; link?: string }[]) {
  const blocks: Buffer[] = []
  for (const item of items) {
    const h = Buffer.alloc(512)
    const data = Buffer.from(item.data ?? '')
    h.write(item.name, 0)
    h.write(`${(item.mode ?? 0o644).toString(8).padStart(7, '0')}\0`, 100)
    h.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124)
    h.write(item.type, 156)
    if (item.link) h.write(item.link, 157)
    h.write('ustar\0', 257)
    blocks.push(h, data, Buffer.alloc((512 - (data.length % 512)) % 512))
  }
  blocks.push(Buffer.alloc(1024))
  return new Uint8Array(gzipSync(Buffer.concat(blocks)))
}

describe('a release archive', () => {
  it('is the tar remoteit/apps tools/lib/archive.mjs makes from the same files', () => {
    const bytes = tar(ENTRIES)
    expect([createHash('sha256').update(bytes).digest('hex'), bytes.length]).toEqual([
      '3cddf10962f57644036c897043a05fad5f5d032dd01c24d5c32a86d25ce9a0ba',
      6656,
    ])
  })

  it('reads back as it was written: names, data, the exec bit, a PAX path', async () => {
    const back = await untarGz(await tarGz(ENTRIES))
    expect(back.map(e => [e.name, e.data && new TextDecoder().decode(e.data), !!e.exec]).sort()).toEqual(
      ENTRIES.map(e => [e.name, e.data && new TextDecoder().decode(e.data), !!e.exec]).sort()
    )
  })

  it('takes another tool’s tar of the folder (./ at its top) and refuses links, .. and absolute paths', async () => {
    expect(
      (
        await untarGz(
          foreign([
            { name: './', type: '5' },
            { name: './run.sh', type: '0', mode: 0o755, data: 'echo' },
          ])
        )
      ).map(e => [e.name, e.exec])
    ).toEqual([['run.sh', true]])
    await expect(untarGz(foreign([{ name: 'link', type: '2', link: '/etc/passwd' }]))).rejects.toThrow(
      /not a regular file/
    )
    await expect(untarGz(foreign([{ name: '../escape', type: '0', data: 'x' }]))).rejects.toBeInstanceOf(ArchiveRefused)
    await expect(untarGz(foreign([{ name: '/etc/x', type: '0', data: 'x' }]))).rejects.toBeInstanceOf(ArchiveRefused)
    await expect(untarGz(enc('not gzip'))).rejects.toThrow(/not gzip/)
  })
})
