// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { untarGz } from './appArchive'
import { buildRelease, Given, ReleaseRefused } from './appRelease'

/* A release built in the browser as the tool's build makes one: the program placed where run.command runs it and made
   executable, a folder's files under its top, a .tar.gz taken as it is; each archive checked against the manifest's
   rules with its files; the same files under several platforms one archive; refused, saying which, where remote.it
   would refuse it. */

const file = (name: string, text: string, relative?: string) => {
  const f = new File([text], name)
  if (relative) Object.defineProperty(f, 'webkitRelativePath', { value: relative })
  return f
}
const source = (more: Record<string, any> = {}) => ({
  contract: 1,
  app: 'acme.panel',
  version: '1.0.0',
  name: 'Panel',
  run: { command: 'bin/panel', args: ['${remoteit.port}'] },
  listen: { type: 'tcp' },
  service: { name: 'Panel', protocol: 'http' },
  ...more,
})
const MAX = 16 << 20
const refused = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    if (error instanceof ReleaseRefused) return [error.code, error.values]
    throw error
  }
  throw new Error('not refused')
}

describe('a release built in the browser', () => {
  it('places the program, executable; one archive for the same files under two platforms', async () => {
    const program: Given = { kind: 'program', file: file('panel', '#!/bin/sh\n') }
    const built = await buildRelease(
      source(),
      { 'linux-amd64': program, 'linux-amd64-any': { kind: 'program', file: file('panel', '#!/bin/sh\n') } },
      MAX
    )
    expect(Object.keys(built.manifest.archives)).toEqual(['linux-amd64', 'linux-amd64-any'])
    expect(built.manifest.archives['linux-amd64']).toEqual(built.manifest.archives['linux-amd64-any'])
    expect(built.archives.map(a => a.name)).toEqual(['acme.panel-1.0.0-linux-amd64.tar.gz'])
    expect(built.manifest.archives['linux-amd64'].sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(await untarGz(built.archives[0].data)).toEqual([
      { name: 'bin/panel', data: new TextEncoder().encode('#!/bin/sh\n'), exec: true },
    ])
    expect(built.text).toBe(`${JSON.stringify(built.manifest, null, 2)}\n`)
    expect(new TextDecoder().decode(built.bytes)).toBe(built.text)
  })

  it('takes a folder’s files under its top, with the rendered templates the manifest names', async () => {
    const m = source({
      run: { command: 'bin/panel', files: { 'panel.conf': 'templates/panel.conf' } },
      settings: { title: { type: 'string' } },
    })
    const folder: Given = {
      kind: 'folder',
      files: [
        file('panel', 'x', 'build/bin/panel'),
        file('panel.conf', 'title=${setting.title}\n', 'build/templates/panel.conf'),
      ],
    }
    const built = await buildRelease(m, { 'linux-arm64': folder }, MAX)
    const entries = await untarGz(built.archives[0].data)
    expect(entries.map(e => [e.name, !!e.exec])).toEqual([
      ['bin/', false],
      ['bin/panel', true],
      ['templates/', false],
      ['templates/panel.conf', false],
    ])
    const missing = await refused(
      buildRelease(m, { 'linux-arm64': { kind: 'folder', files: [file('panel', 'x', 'build/bin/panel')] } }, MAX)
    )
    expect(missing[0]).toBe('rules')
    expect((missing[1] as any).problems).toBe("run.files.panel.conf: templates/panel.conf is not in the app's files")
  })

  it('refuses, saying which: no program, a platform it runs nothing on, too big, nothing given', async () => {
    expect(
      await refused(buildRelease(source(), { 'linux-amd64': { kind: 'folder', files: [file('x', 'x', 'b/x')] } }, MAX))
    ).toEqual(['noProgram', { platform: 'linux-amd64', program: 'bin/panel' }])
    const perOs = source({ run: { command: { linux: 'bin/panel' } } })
    expect(
      await refused(buildRelease(perOs, { 'windows-amd64': { kind: 'program', file: file('p', 'x') } }, MAX))
    ).toEqual(['noCommandFor', { platform: 'windows-amd64' }])
    const big = new File([crypto.getRandomValues(new Uint8Array(4096))], 'panel')
    expect((await refused(buildRelease(source(), { 'linux-amd64': { kind: 'program', file: big } }, 1024)))[0]).toBe(
      'tooBig'
    )
    expect(await refused(buildRelease(source(), {}, MAX))).toEqual(['noPlatform', {}])
    // The program's own path is held to an archive's rule: a Windows path that climbs out is refused.
    const climbs = source({ run: { command: { windows: '..\\panel.exe' } } })
    expect(
      await refused(buildRelease(climbs, { 'windows-amd64': { kind: 'program', file: file('p', 'MZ') } }, MAX))
    ).toEqual(['badPath', { platform: 'windows-amd64', path: '../panel.exe' }])
    // archives are the build's: a source naming some, for files never given, is refused.
    const stock = source({
      run: { command: '/bin/sh' },
      archives: { any: { file: 'x.tar.gz', sha256: '0'.repeat(64) } },
    })
    expect(await refused(buildRelease(stock, {}, MAX))).toEqual(['archivesGiven', {}])
    // So is an icon: the release would name a file the page never uploads.
    const iconed = source({ run: { command: '/bin/sh' }, icon: { file: 'x.png', sha256: '0'.repeat(64) } })
    expect(await refused(buildRelease(iconed, {}, MAX))).toEqual(['archivesGiven', {}])
  })

  it('a stock tool needs no files', async () => {
    const built = await buildRelease(
      source({
        run: { command: '/usr/sbin/sshd', args: ['-i'] },
        listen: { type: 'stdio' },
        service: { name: 'SSH', protocol: 'ssh' },
      }),
      {},
      MAX
    )
    expect([built.archives, built.manifest.archives]).toEqual([[], undefined])
  })
})
