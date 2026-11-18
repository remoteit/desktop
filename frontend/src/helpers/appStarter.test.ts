// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { untarGz } from './appArchive'
import { manifestProblems } from './appManifest'
import { starterArchive, starterManifest } from './appStarter'

/* The starter is an app remote.it takes as it is: its manifest valid, its program executable. */

describe('the starter', () => {
  it('is a valid app named for the publisher, its program executable', async () => {
    expect(manifestProblems(starterManifest('acme'))).toEqual([])
    const entries = await untarGz(await starterArchive('acme'))
    expect(entries.map(e => [e.name, !!e.exec])).toEqual([
      ['hello/', false],
      ['hello/NOTES.md', false],
      ['hello/hello.py', true],
      ['hello/manifest.json', false],
    ])
    const manifest = JSON.parse(new TextDecoder().decode(entries.find(e => e.name === 'hello/manifest.json')!.data))
    expect(manifest.app).toBe('acme.hello')
  })
})
