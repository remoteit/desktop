import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHash } from 'node:crypto'
// jsdom's Blob cannot be read (no arrayBuffer/text); the browser's and Node's can.
import { Blob as NodeBlob } from 'node:buffer'

const { uiSet, request } = vi.hoisted(() => ({ uiSet: vi.fn(), request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import {
  CANCELLED,
  NOT_ENABLED,
  FileUpload,
  UploadApi,
  UploadError,
  directUpload,
  graphQLUploadApi,
  sha256Hex,
} from './directUpload'

// A stand-in for the browser's XMLHttpRequest: records each part request and answers it as the test says.
type Sent = { method: string; url: string; headers: Record<string, string>; body: string }
type Answer = { status: number; etag?: string } | 'network-error'
let sent: Sent[]
let answer: (request: Sent, index: number) => Answer

class FakeXHR {
  method = ''
  url = ''
  headers: Record<string, string> = {}
  status = 0
  responseHeaders: Record<string, string> = {}
  upload: { onprogress?: (event: { loaded: number }) => void } = {}
  onload?: () => void
  onerror?: () => void
  onabort?: () => void
  open(method: string, url: string) {
    this.method = method
    this.url = url
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value
  }
  getResponseHeader(name: string) {
    return this.responseHeaders[name.toLowerCase()] ?? null
  }
  abort() {
    this.onabort?.()
  }
  async send(body: Blob) {
    const request = { method: this.method, url: this.url, headers: this.headers, body: await body.text() }
    const index = sent.push(request) - 1
    const reply = answer(request, index)
    this.upload.onprogress?.({ loaded: Math.floor(body.size / 2) })
    if (reply === 'network-error') return this.onerror?.()
    this.status = reply.status
    if (reply.etag) this.responseHeaders.etag = reply.etag
    this.onload?.()
  }
}

const content = 'abcdefghij' // 10 bytes in parts of 4: abcd, efgh, ij
const file = () => new NodeBlob([content]) as unknown as Blob
const part = (number: number, offset: number, length: number, url = `https://store.test/p${number}?sig=1`) => ({
  number,
  method: 'PUT',
  url,
  headers: [{ name: 'Content-Type', value: 'application/octet-stream' }],
  offset,
  length,
})
const created: FileUpload = {
  uploadId: 'u1',
  expiresAt: '2026-10-13T00:00:00.000Z',
  partSize: 4,
  receiptHeader: 'ETag',
  parts: [part(3, 8, 2), part(1, 0, 4), part(2, 4, 4)],
}
const result = { fileId: 'f1', fileVersionId: 'v1', version: 1, name: 'a.txt', size: 10, sha256: 'x' }

let api: { [K in keyof UploadApi]: ReturnType<typeof vi.fn> }
const delay = vi.fn(async () => {})
const upload = (options = {}) =>
  directUpload(
    { file: file(), name: 'a.txt', accountId: 'acct', executable: false },
    { api: api as any, delay, ...options }
  )

beforeEach(() => {
  sent = []
  answer = request => ({ status: 200, etag: `"etag-${request.url.match(/p(\d)/)![1]}"` })
  api = {
    create: vi.fn().mockResolvedValue(created),
    renew: vi.fn(),
    complete: vi.fn().mockResolvedValue(result),
    abort: vi.fn().mockResolvedValue(undefined),
  }
  delay.mockClear()
  request.mockReset()
  uiSet.mockReset()
  vi.stubGlobal('XMLHttpRequest', FakeXHR)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sha256Hex', () => {
  it('hashes a known input', async () => {
    expect(await sha256Hex(new NodeBlob(['abc']) as unknown as Blob)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  it('hashes across chunks and reports progress per chunk', async () => {
    const bytes = new Uint8Array(9 * 1024 * 1024 + 3).map((_, i) => i % 251)
    const progress: number[] = []
    const hex = await sha256Hex(new NodeBlob([bytes]) as unknown as Blob, loaded => progress.push(loaded))
    expect(hex).toBe(createHash('sha256').update(bytes).digest('hex'))
    expect(progress).toEqual([4 * 1024 * 1024, 8 * 1024 * 1024, bytes.length])
  })
})

describe('directUpload', () => {
  it('creates the upload with the file hash, sends each slice with exactly its headers, completes with the receipts', async () => {
    const progress: any[] = []
    expect(await upload({ onProgress: (p: any) => progress.push(p) })).toEqual(result)

    expect(api.create).toHaveBeenCalledWith({
      name: 'a.txt',
      accountId: 'acct',
      executable: false,
      size: 10,
      sha256: createHash('sha256').update(content).digest('hex'),
    })
    const byUrl = Object.fromEntries(sent.map(s => [s.url, s]))
    expect(byUrl['https://store.test/p1?sig=1']).toEqual({
      method: 'PUT',
      url: 'https://store.test/p1?sig=1',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: 'abcd',
    })
    expect(byUrl['https://store.test/p2?sig=1'].body).toBe('efgh')
    expect(byUrl['https://store.test/p3?sig=1'].body).toBe('ij')
    // The store's URL is presigned: the app's API request (and its auth header) is never used for a part.
    expect(request).not.toHaveBeenCalled()
    expect(api.complete).toHaveBeenCalledWith('u1', [
      { number: 1, receipt: '"etag-1"' },
      { number: 2, receipt: '"etag-2"' },
      { number: 3, receipt: '"etag-3"' },
    ])
    expect(progress[0]).toEqual({ phase: 'hashing', loaded: 0, total: 10 })
    expect(progress.at(-1)).toEqual({ phase: 'uploading', loaded: 10, total: 10 })
    expect(api.abort).not.toHaveBeenCalled()
  })

  it('retries a part that failed', async () => {
    answer = (request, index) =>
      request.url.includes('p2') && sent.filter(s => s.url.includes('p2')).length === 1
        ? 'network-error'
        : { status: 200, etag: `"etag-${index}"` }
    expect(await upload()).toEqual(result)
    expect(sent.filter(s => s.url.includes('p2'))).toHaveLength(2)
    expect(delay).toHaveBeenCalledTimes(1)
    expect(api.renew).not.toHaveBeenCalled()
  })

  it('renews the part URLs when the store answers 403, then retries with the new URL', async () => {
    api.renew.mockResolvedValue({
      ...created,
      parts: [
        part(1, 0, 4, 'https://store.test/p1?sig=2'),
        part(2, 4, 4, 'https://store.test/p2?sig=2'),
        part(3, 8, 2, 'https://store.test/p3?sig=2'),
      ],
    })
    answer = request =>
      request.url === 'https://store.test/p1?sig=1' ? { status: 403 } : { status: 200, etag: `"${request.url}"` }
    expect(await upload()).toEqual(result)
    expect(api.renew).toHaveBeenCalledTimes(1)
    expect(api.renew).toHaveBeenCalledWith('u1')
    expect(sent.map(s => s.url)).toContain('https://store.test/p1?sig=2')
    expect(api.complete.mock.calls[0][1][0]).toEqual({ number: 1, receipt: '"https://store.test/p1?sig=2"' })
  })

  it('gives up on a part after three retries and aborts the upload', async () => {
    answer = request => (request.url.includes('p2') ? { status: 500 } : { status: 200, etag: '"e"' })
    await expect(upload()).rejects.toThrow('Part 2 upload failed with HTTP 500')
    expect(sent.filter(s => s.url.includes('p2'))).toHaveLength(4)
    expect(api.complete).not.toHaveBeenCalled()
    expect(api.abort).toHaveBeenCalledWith('u1')
  })

  it('fails without retrying when the store hides the receipt header', async () => {
    answer = () => ({ status: 200 })
    await expect(upload()).rejects.toThrow('did not return the ETag header')
    expect(delay).not.toHaveBeenCalled()
    expect(api.abort).toHaveBeenCalledWith('u1')
  })

  it('aborts the upload when completion is refused', async () => {
    api.complete.mockRejectedValue(new UploadError('The file does not match its hash', 'FILE_UPLOAD_MISMATCH'))
    await expect(upload()).rejects.toMatchObject({ code: 'FILE_UPLOAD_MISMATCH' })
    expect(api.abort).toHaveBeenCalledWith('u1')
  })

  it('stops and aborts the upload when cancelled', async () => {
    const controller = new AbortController()
    answer = () => {
      controller.abort()
      return { status: 200, etag: '"e"' }
    }
    await expect(upload({ signal: controller.signal })).rejects.toMatchObject({ code: CANCELLED })
    expect(api.complete).not.toHaveBeenCalled()
    expect(api.abort).toHaveBeenCalledWith('u1')
  })

  it('answers NOT_ENABLED, sending nothing, when the API does not offer direct uploads', async () => {
    api.create.mockResolvedValue(NOT_ENABLED)
    expect(await upload()).toBe(NOT_ENABLED)
    expect(sent).toHaveLength(0)
    expect(api.abort).not.toHaveBeenCalled()
  })
})

describe('graphQLUploadApi', () => {
  const input = { name: 'a.txt', size: 10, sha256: 'x' }
  const errors = (...list: any[]) => request.mockResolvedValue({ data: { errors: list }, headers: {} })

  it('answers NOT_ENABLED for FILE_UPLOAD_NOT_ENABLED', async () => {
    errors({ message: 'Direct uploads are not enabled', extensions: { code: 'FILE_UPLOAD_NOT_ENABLED' } })
    expect(await graphQLUploadApi.create(input)).toBe(NOT_ENABLED)
  })

  it('answers NOT_ENABLED for an API whose schema has no createFileUpload', async () => {
    errors(
      { message: 'Unknown type "FileArgumentDefinition".' },
      { message: 'Cannot query field "createFileUpload" on type "Mutation".' }
    )
    expect(await graphQLUploadApi.create(input)).toBe(NOT_ENABLED)
  })

  it("throws the server's message and code, and does not raise the app's own GraphQL banner", async () => {
    errors({
      message: 'Storage quota exceeded: 1.9 GB of 2 GB used. Delete old file versions to make room.',
      extensions: { code: 'STORAGE_QUOTA_EXCEEDED' },
    })
    await expect(graphQLUploadApi.create(input)).rejects.toMatchObject({
      code: 'STORAGE_QUOTA_EXCEEDED',
      message: 'Storage quota exceeded: 1.9 GB of 2 GB used. Delete old file versions to make room.',
    })
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('sends the arguments as FileArgumentDefinition input and returns the upload', async () => {
    request.mockResolvedValue({ data: { data: { createFileUpload: created } }, headers: {} })
    const definitions: IArgumentDefinition[] = [{ name: 'host', type: 'StringEntry', desc: 'Host' }]
    expect(await graphQLUploadApi.create({ ...input, arguments: definitions })).toEqual(created)
    const { data } = request.mock.calls[0][0]
    expect(data.query).toContain('$arguments: [FileArgumentDefinition!]')
    expect(data.variables.arguments).toEqual(definitions)
  })

  it('completes with the receipts', async () => {
    request.mockResolvedValue({ data: { data: { completeFileUpload: result } }, headers: {} })
    const parts = [{ number: 1, receipt: '"e"' }]
    expect(await graphQLUploadApi.complete('u1', parts)).toEqual(result)
    expect(request.mock.calls[0][0].data.variables).toEqual({ uploadId: 'u1', parts })
  })
})
