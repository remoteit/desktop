import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import {
  fetchFileSizes,
  fetchFileStorage,
  fetchFileVersions,
  megabytes,
  storageLevel,
  uploadRefusal,
  UNSUPPORTED,
} from './fileStorage'
import { formatBytes } from '../helpers/usageHelper'

const MB = 1024 ** 2
const GB = 1024 ** 3
const t = ((_key: string, text: string, values?: any) =>
  text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const answer = (data: any, errors?: any[]) => ({ data: { data, ...(errors ? { errors } : {}) }, headers: {} })
const storage = { used: 1.2 * GB, quota: 2 * GB, maxFileSize: 200 * MB, directUpload: true }

beforeEach(() => {
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('file storage', () => {
  it('reads as "1.2 GB of 2 GB", sizes as the API writes them in its refusals', () => {
    expect([formatBytes(storage.used), formatBytes(storage.quota), formatBytes(150 * MB)]).toEqual(['1.2 GB', '2 GB', '150 MB'])
    expect([megabytes(2003 * MB), megabytes(3.25 * MB)]).toEqual(['2003 MB', '3.3 MB'])
  })

  it('near from 90 %, full at the quota', () => {
    expect(storageLevel(storage)).toBe('ok')
    expect(storageLevel({ ...storage, used: 1.8 * GB })).toBe('near')
    expect(storageLevel({ ...storage, used: 2 * GB })).toBe('full')
  })

  it('refuses a file past the largest, or past what is left, in the API’s words (FILE_TOO_LARGE, STORAGE_QUOTA_EXCEEDED)', () => {
    expect(uploadRefusal(t, storage, 300 * MB)).toBe('A file may be at most 200 MB; this one is 300 MB')
    expect(uploadRefusal(t, { ...storage, used: 2003 * MB, quota: 2048 * MB }, 50 * MB)).toBe(
      'This file would take the account past its file storage quota: 2003 MB of 2048 MB used, and this file is 50 MB. Delete files or old versions of files you no longer need, then try again.'
    )
    expect(uploadRefusal(t, storage, 100 * MB)).toBeUndefined()
  })

  it('refuses nothing where direct uploads are off, or the API has no storage', () => {
    expect(uploadRefusal(t, { ...storage, directUpload: false }, 300 * MB)).toBeUndefined()
    expect(uploadRefusal(t, null, 300 * MB)).toBeUndefined()
  })

  it('an API without fileStorage, storedSize or FileVersion.size: UNSUPPORTED, quietly', async () => {
    for (const [read, field] of [
      [() => fetchFileStorage('A'), 'fileStorage'],
      [() => fetchFileSizes('A'), 'storedSize'],
      [() => fetchFileVersions('A', 'F'), 'size'],
    ] as const) {
      request.mockResolvedValueOnce(answer(null, [{ message: `Cannot query field "${field}" on type "X".` }]))
      expect(await read()).toBe(UNSUPPORTED)
    }
  })

  it('reads the account’s storage, each file’s size, and a file’s versions newest first', async () => {
    request.mockResolvedValueOnce(answer({ login: { account: { fileStorage: storage } } }))
    expect(await fetchFileStorage('A')).toEqual(storage)
    request.mockResolvedValueOnce(
      answer({ login: { account: { files: [{ id: 'F1', storedSize: 5 }, { id: 'F2', storedSize: null }] } } })
    )
    expect(await fetchFileSizes('A')).toEqual({ F1: 5 })
    const v = (version: number) => ({ id: `V${version}`, version, created: '2026-10-13T20:00:00Z', size: version * MB })
    request.mockResolvedValueOnce(answer({ login: { account: { files: [{ id: 'F', versions: { items: [v(1), v(3), v(2)] } }] } } }))
    expect((await fetchFileVersions('A', 'F')) as any[]).toEqual([v(3), v(2), v(1)])
  })
})
