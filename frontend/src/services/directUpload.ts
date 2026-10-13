import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { post } from './post'
import { graphQLGetErrors } from './graphQL'

/* Uploading a file straight to the store (graphql's storage-neutral multipart contract): the API checks the
   name, size and SHA-256 up front, hands out one presigned request per part, and on completion verifies the
   stored bytes against that hash. The part requests go to the store itself, so they carry exactly the headers
   the API names and none of the app's own. An API without the contract answers NOT_ENABLED, and the caller
   uploads through /file/upload instead. */

export const NOT_ENABLED = 'NOT_ENABLED'
export const CANCELLED = 'CANCELLED'

// Error codes graphql answers in errors[].extensions.code.
export const FILE_UPLOAD_NOT_ENABLED = 'FILE_UPLOAD_NOT_ENABLED'

const HASH_CHUNK = 4 * 1024 * 1024
const PARALLEL_PARTS = 4
const PART_RETRIES = 3
const RETRY_DELAY_MS = 1000

export type UploadPhase = 'hashing' | 'uploading'
export type UploadProgress = { phase: UploadPhase; loaded: number; total: number }

export type FileUploadHeader = { name: string; value: string }
export type FileUploadPart = {
  number: number
  method: string
  url: string
  headers: FileUploadHeader[]
  offset: number
  length: number
}
export type FileUpload = {
  uploadId: string
  expiresAt?: string
  partSize: number
  receiptHeader: string
  parts: FileUploadPart[]
}
export type FileUploadReceipt = { number: number; receipt: string }
export type FileUploadResult = {
  fileId: string
  fileVersionId: string
  version: number
  name: string
  size: number
  sha256: string
}

export type CreateFileUploadInput = {
  name: string
  size: number
  sha256: string
  executable?: boolean
  accountId?: string
  shortDesc?: string
  longDesc?: string
  arguments?: IArgumentDefinition[]
}

export class UploadError extends Error {
  code?: string
  // The app has already shown this failure (post() reports transport errors itself).
  reported?: boolean
  constructor(message: string, code?: string, reported?: boolean) {
    super(message)
    this.name = 'UploadError'
    this.code = code
    this.reported = reported
  }
}

export type UploadApi = {
  create: (input: CreateFileUploadInput) => Promise<FileUpload | typeof NOT_ENABLED>
  renew: (uploadId: string) => Promise<FileUpload>
  complete: (uploadId: string, parts: FileUploadReceipt[]) => Promise<FileUploadResult>
  abort: (uploadId: string) => Promise<void>
}

export type PartResponse = { status: number; receipt: string | null }
export type SendPart = (
  part: FileUploadPart,
  body: Blob,
  receiptHeader: string,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal
) => Promise<PartResponse>

export type DirectUploadOptions = {
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
  api?: UploadApi
  sendPart?: SendPart
  delay?: (ms: number) => Promise<void>
}

export type DirectUploadInput = Omit<CreateFileUploadInput, 'size' | 'sha256'> & { file: Blob }

const cancelled = () => new UploadError('Upload cancelled', CANCELLED)

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw cancelled()
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// Lowercase hex SHA-256, read a chunk at a time so a large file is never held in memory whole.
export async function sha256Hex(
  blob: Blob,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<string> {
  const hash = sha256.create()
  for (let offset = 0; offset < blob.size; offset += HASH_CHUNK) {
    throwIfAborted(signal)
    const end = Math.min(offset + HASH_CHUNK, blob.size)
    hash.update(new Uint8Array(await blob.slice(offset, end).arrayBuffer()))
    onProgress?.(end, blob.size)
  }
  return bytesToHex(hash.digest())
}

type GraphQLError = { message?: string; extensions?: { code?: string } }

// An API older than the contract refuses the mutation in validation, naming it.
const unknownToSchema = (errors: GraphQLError[], field: string) =>
  errors.some(error => (error.message || '').startsWith(`Cannot query field "${field}"`))

async function request<T>(query: string, variables: ILookup<any>, field: string): Promise<T | typeof NOT_ENABLED> {
  const response = await post({ query, variables })
  if (response === 'ERROR') throw new UploadError('Upload request failed', undefined, true)
  const errors: GraphQLError[] | undefined = graphQLGetErrors(response, true, { query, variables }) as any
  if (errors?.length) {
    if (errors.some(error => error.extensions?.code === FILE_UPLOAD_NOT_ENABLED) || unknownToSchema(errors, field))
      return NOT_ENABLED
    throw new UploadError(errors[0].message || 'Upload failed', errors[0].extensions?.code)
  }
  return response.data?.data?.[field]
}

async function required<T>(query: string, variables: ILookup<any>, field: string): Promise<T> {
  const result = await request<T>(query, variables, field)
  if (result === NOT_ENABLED) throw new UploadError('File upload is not enabled', FILE_UPLOAD_NOT_ENABLED)
  return result
}

const UPLOAD_FIELDS = `uploadId expiresAt partSize receiptHeader parts { number method url headers { name value } offset length }`

export const graphQLUploadApi: UploadApi = {
  create: input =>
    request<FileUpload>(
      `mutation CreateFileUpload($name: String!, $size: Float!, $sha256: String!, $executable: Boolean, $accountId: String, $shortDesc: String, $longDesc: String, $arguments: [FileArgumentDefinition!]) {
        createFileUpload(name: $name, size: $size, sha256: $sha256, executable: $executable, accountId: $accountId, shortDesc: $shortDesc, longDesc: $longDesc, arguments: $arguments) { ${UPLOAD_FIELDS} }
      }`,
      input,
      'createFileUpload'
    ),
  renew: uploadId =>
    required<FileUpload>(
      `mutation RenewFileUpload($uploadId: ID!) { renewFileUpload(uploadId: $uploadId) { ${UPLOAD_FIELDS} } }`,
      { uploadId },
      'renewFileUpload'
    ),
  complete: (uploadId, parts) =>
    required<FileUploadResult>(
      `mutation CompleteFileUpload($uploadId: ID!, $parts: [FileUploadReceipt!]!) {
        completeFileUpload(uploadId: $uploadId, parts: $parts) { fileId fileVersionId version name size sha256 }
      }`,
      { uploadId, parts },
      'completeFileUpload'
    ),
  abort: async uploadId => {
    await request<boolean>(
      `mutation AbortFileUpload($uploadId: ID!) { abortFileUpload(uploadId: $uploadId) }`,
      { uploadId },
      'abortFileUpload'
    )
  },
}

// A plain XMLHttpRequest: the URL is presigned for the store, and the app's auth headers would invalidate it.
export const xhrSendPart: SendPart = (part, body, receiptHeader, onProgress, signal) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const onAbort = () => xhr.abort()
    const done = () => signal?.removeEventListener('abort', onAbort)
    xhr.open(part.method, part.url)
    part.headers.forEach(header => xhr.setRequestHeader(header.name, header.value))
    xhr.upload.onprogress = event => onProgress(event.loaded)
    xhr.onload = () => {
      done()
      resolve({ status: xhr.status, receipt: xhr.getResponseHeader(receiptHeader) })
    }
    xhr.onerror = () => {
      done()
      reject(new Error('Network error uploading part ' + part.number))
    }
    xhr.onabort = () => {
      done()
      reject(cancelled())
    }
    signal?.addEventListener('abort', onAbort)
    xhr.send(body)
  })

export async function directUpload(
  input: DirectUploadInput,
  options: DirectUploadOptions = {}
): Promise<FileUploadResult | typeof NOT_ENABLED> {
  const { onProgress, signal, api = graphQLUploadApi, sendPart = xhrSendPart, delay = wait } = options
  const { file, ...metadata } = input
  const total = file.size

  onProgress?.({ phase: 'hashing', loaded: 0, total })
  const hash = await sha256Hex(file, loaded => onProgress?.({ phase: 'hashing', loaded, total }), signal)
  throwIfAborted(signal)

  const created = await api.create({ ...metadata, size: total, sha256: hash })
  if (created === NOT_ENABLED) return NOT_ENABLED

  const uploadId = created.uploadId
  try {
    throwIfAborted(signal)
    const receipts = await uploadParts(file, created, { api, sendPart, delay, signal, onProgress })
    throwIfAborted(signal)
    return await api.complete(uploadId, receipts)
  } catch (error) {
    api.abort(uploadId).catch(abortError => console.warn('ABORT FILE UPLOAD FAILED', abortError))
    throw error
  }
}

async function uploadParts(
  file: Blob,
  upload: FileUpload,
  options: Required<Pick<DirectUploadOptions, 'api' | 'sendPart' | 'delay'>> &
    Pick<DirectUploadOptions, 'signal' | 'onProgress'>
): Promise<FileUploadReceipt[]> {
  const { api, sendPart, delay, onProgress } = options
  const total = file.size
  const stop = new AbortController()
  const onCancel = () => stop.abort()
  if (options.signal?.aborted) stop.abort()
  options.signal?.addEventListener('abort', onCancel)
  const signal = stop.signal
  const queue = [...upload.parts].sort((a, b) => a.number - b.number)
  const current = new Map(queue.map(part => [part.number, part]))
  const loaded = new Map<number, number>()
  const receipts: FileUploadReceipt[] = []

  // One renewal answers every part that found its URL expired with the same set of URLs.
  let generation = 0
  let renewing: Promise<void> | undefined
  const renew = (seen: number) => {
    if (seen !== generation) return Promise.resolve()
    if (!renewing)
      renewing = api
        .renew(upload.uploadId)
        .then(renewed => {
          renewed.parts.forEach(part => current.set(part.number, part))
          generation++
        })
        .finally(() => (renewing = undefined))
    return renewing
  }

  const report = () => {
    let sum = 0
    loaded.forEach(bytes => (sum += bytes))
    onProgress?.({ phase: 'uploading', loaded: Math.min(sum, total), total })
  }

  const sendWithRetry = async (number: number) => {
    for (let attempt = 0; ; attempt++) {
      throwIfAborted(signal)
      const part = current.get(number)!
      const seen = generation
      let failure: Error
      try {
        const body = file.slice(part.offset, part.offset + part.length)
        const response = await sendPart(
          part,
          body,
          upload.receiptHeader,
          bytes => {
            loaded.set(number, bytes)
            report()
          },
          signal
        )
        if (response.status >= 200 && response.status < 300) {
          if (!response.receipt)
            throw new UploadError(`The store did not return the ${upload.receiptHeader} header for part ${number}`)
          loaded.set(number, part.length)
          report()
          return { number, receipt: response.receipt }
        }
        failure = new Error(`Part ${number} upload failed with HTTP ${response.status}`)
        if (response.status === 403 && attempt < PART_RETRIES) await renew(seen)
      } catch (error) {
        if (error instanceof UploadError) throw error
        failure = error as Error
      }
      loaded.set(number, 0)
      report()
      if (attempt >= PART_RETRIES) throw new UploadError(failure.message)
      await delay(RETRY_DELAY_MS * 2 ** attempt)
    }
  }

  // The first failure stops the parts still in flight: the upload is aborted either way.
  let failure: unknown
  const worker = async () => {
    while (queue.length && !failure) {
      const part = queue.shift()!
      try {
        receipts.push(await sendWithRetry(part.number))
      } catch (error) {
        failure ??= error
        stop.abort()
      }
    }
  }

  report()
  await Promise.all(Array.from({ length: Math.min(PARALLEL_PARTS, queue.length) }, worker))
  options.signal?.removeEventListener('abort', onCancel)
  if (failure) throw failure
  return receipts.sort((a, b) => a.number - b.number)
}
