import { ArchiveRefused, Entry, safePath, sha256Hex, tarGz, untarGz } from './appArchive'
import { manifestProblems, manifestText } from './appManifest'

/* New app's release, built in the browser as the publishing tool's `build` makes one (remoteit/apps
   tools/lib/build.mjs; presence-server docs/device-apps-new-app.md, "Files and packaging"): an archive a platform from
   what the publisher gives for it — the program, a folder, or a .tar.gz —, the program made executable, the same files
   under several platforms one archive; each archive checked as the build checks it (the program and every rendered
   template in it, the contract's rules over its files); and the manifest with `archives` added, its text exactly the
   bytes that are signed and uploaded. Within what remote.it takes: graphql's fileMax a file, 32 files with the
   manifest and its signature. */

// The platforms the portal offers, as archive keys: <goos>-<goarch>, on Linux with its C library, or one for all.
export const PLATFORMS = [
  'linux-amd64',
  'linux-arm64',
  'linux-arm',
  'linux-amd64-musl',
  'linux-arm64-musl',
  'linux-arm-musl',
  'linux-amd64-any',
  'linux-arm64-any',
  'linux-arm-any',
  'darwin-arm64',
  'darwin-amd64',
  'windows-amd64',
  'windows-arm64',
  'any',
]
export const COMMAND_OSES = ['linux', 'darwin', 'windows']
export const FILES_MOST = 32 // with manifest.json and manifest.json.sig (graphql UPLOAD_FILES_MAX)
export const READ_MOST = 256 << 20 // what the page reads in all: a mistaken folder fails at once

export type Given =
  | { kind: 'program'; file: File }
  | { kind: 'folder'; files: File[] } // from <input webkitdirectory>: each with its webkitRelativePath
  | { kind: 'archive'; file: File } // a .tar.gz

export type ReleaseFile = { name: string; data: Uint8Array }
export type Built = { manifest: Record<string, any>; text: string; bytes: Uint8Array; archives: ReleaseFile[] }

// Why a release cannot be built, in words the page shows (each a key and its values, so the page translates it).
export class ReleaseRefused extends Error {
  constructor(public code: string, public values: Record<string, string | number> = {}) {
    super(code)
  }
}

const osesOf = (key: string) => (key === 'any' ? COMMAND_OSES : [key.split('-')[0]])

// The program an OS runs where it is one of the app's files: its path in the archive; none for a stock tool (an
// absolute path, by the target OS's rule) or an OS the manifest names no program for.
export function ownProgram(m: Record<string, any>, os: string): string | undefined {
  const c = typeof m.run?.command === 'string' ? m.run.command : m.run?.command?.[os]
  if (c === undefined) return undefined
  const absolute = os === 'windows' ? /^([a-zA-Z]:[\\/]|[\\/])/.test(c) : c.startsWith('/')
  if (absolute) return undefined
  return (os === 'windows' ? c.replaceAll('\\', '/') : c).replace(/^(\.\/)+/, '')
}

// An archive's file name, as the tool names it.
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
export function archiveName(id: string, version: string, key: string) {
  const named = `${id}-${version.replace(/[^A-Za-z0-9._-]/g, '_')}-${key}.tar.gz`
  return FILE_NAME.test(named) ? named : `${id}-${key}.tar.gz`
}

const bytesOf = async (file: File) => new Uint8Array(await file.arrayBuffer())

// What a platform's given files are, as archive entries.
async function entriesOf(key: string, given: Given, program: string | undefined, several: boolean): Promise<Entry[]> {
  if (given.kind === 'program') {
    if (!program) throw new ReleaseRefused(several ? 'oneFileSeveral' : 'oneFileNoProgram', { platform: key })
    return [{ name: program, data: await bytesOf(given.file), exec: true }]
  }
  if (given.kind === 'archive') {
    try {
      return await untarGz(await bytesOf(given.file))
    } catch (error) {
      if (error instanceof ArchiveRefused) throw new ReleaseRefused('badArchive', { platform: key, why: error.message })
      throw error
    }
  }
  const out: Entry[] = []
  const dirs = new Set<string>()
  for (const file of given.files) {
    // A folder's files are named under the folder itself: its contents are the archive's top.
    const relative = ((file as any).webkitRelativePath || file.name)
      .split('/')
      .slice((file as any).webkitRelativePath ? 1 : 0)
      .join('/')
    let name: string
    try {
      name = safePath(relative)
    } catch {
      throw new ReleaseRefused('badPath', { platform: key, path: relative })
    }
    const parts = name.split('/')
    for (let i = 1; i < parts.length; i++) dirs.add(`${parts.slice(0, i).join('/')}/`)
    out.push({ name, data: await bytesOf(file) })
  }
  if (!out.length) throw new ReleaseRefused('emptyFolder', { platform: key })
  return [...[...dirs].map(name => ({ name })), ...out]
}

const sizeOf = (given: Given) =>
  given.kind === 'folder' ? given.files.reduce((n, f) => n + f.size, 0) : given.file.size

// The release: source is the checked source manifest (no archives); inputs a Given a platform; fileMax graphql's.
export async function buildRelease(
  source: Record<string, any>,
  inputs: Record<string, Given>,
  fileMax: number
): Promise<Built> {
  const keys = Object.keys(inputs).sort()
  const read = keys.reduce((n, key) => n + sizeOf(inputs[key]), 0)
  if (read > READ_MOST)
    throw new ReleaseRefused('tooMuch', { mb: Math.round(read / 2 ** 20), most: READ_MOST / 2 ** 20 })
  const needsFiles = COMMAND_OSES.some(os => ownProgram(source, os)) || Object.keys(source.run?.files ?? {}).length > 0
  if (!keys.length && needsFiles) throw new ReleaseRefused('noPlatform')
  const archives: Record<string, { file: string; sha256: string }> = {}
  // The same files under several platforms (linux-amd64 and linux-amd64-any) are one archive, as the tool makes them:
  // the same bytes, by their SHA-256.
  const made = new Map<string, { file: string; sha256: string; data: Uint8Array }>()
  for (const key of keys) {
    if (osesOf(key).every(os => commandOf(source, os) === undefined))
      throw new ReleaseRefused('noCommandFor', { platform: key })
    const programs = [
      ...new Set(
        osesOf(key)
          .map(os => ownProgram(source, os))
          .filter(Boolean) as string[]
      ),
    ]
    const entries = await entriesOf(
      key,
      inputs[key],
      programs.length === 1 ? programs[0] : undefined,
      programs.length > 1
    )
    const byName = new Map(entries.map(e => [e.name, e]))
    for (const program of programs) {
      const entry = byName.get(program)
      if (!entry?.data) throw new ReleaseRefused('noProgram', { platform: key, program })
      entry.exec = true
    }
    // The rules once more against this archive's files: every run.files template is in it, its values declared.
    const problems = manifestProblems(source, path => {
      const entry = byName.get(path.replace(/^\.\//, ''))
      if (!entry?.data) throw new Error('missing')
      return new TextDecoder().decode(entry.data)
    })
    if (problems.length) throw new ReleaseRefused('rules', { platform: key, problems: problems.join('; ') })
    const data = await tarGz(entries)
    if (data.length > fileMax)
      throw new ReleaseRefused('tooBig', {
        platform: key,
        mb: (data.length / 2 ** 20).toFixed(1),
        most: (fileMax / 2 ** 20).toFixed(0),
      })
    const sha256 = await sha256Hex(data)
    if (!made.has(sha256)) made.set(sha256, { file: archiveName(source.app, source.version, key), sha256, data })
    archives[key] = { file: made.get(sha256)!.file, sha256 }
  }
  if (made.size + 2 > FILES_MOST) throw new ReleaseRefused('tooMany', { most: FILES_MOST - 2 })
  const manifest = { ...source, ...(keys.length ? { archives } : {}) }
  const problems = manifestProblems(manifest)
  if (problems.length) throw new ReleaseRefused('rules', { platform: '', problems: problems.join('; ') })
  const text = manifestText(manifest)
  const bytes = new TextEncoder().encode(text)
  if (bytes.length > fileMax)
    throw new ReleaseRefused('tooBig', {
      platform: 'manifest.json',
      mb: (bytes.length / 2 ** 20).toFixed(1),
      most: (fileMax / 2 ** 20).toFixed(0),
    })
  return { manifest, text, bytes, archives: [...made.values()].map(({ file, data }) => ({ name: file, data })) }
}

// What an OS runs: its own program or a stock tool; none where the manifest offers the app nothing there.
function commandOf(m: Record<string, any>, os: string): string | undefined {
  return typeof m.run?.command === 'string' ? m.run.command : m.run?.command?.[os]
}
