import type { TFunction } from 'i18next'
import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { withoutDeviceSessions as refusesField, UNSUPPORTED } from './graphQLDaemon'

/* An account's file storage (graphql Account.fileStorage; device-package docs/scripting-plan.md, "Storage and
   uploads"): every stored version of its files, old ones included, against its quota — and the largest file a direct
   upload takes. What each file and each version store (File.storedSize, FileVersion.size) is what deleting it frees.
   Read on their own and silently, like the job runs: an API without them answers UNSUPPORTED and the portal shows
   nothing of storage; one with direct uploads off says directUpload false, and its numbers are not kept. */

export { UNSUPPORTED }

export type FileStorage = { used: number; quota: number; maxFileSize: number; directUpload: boolean }

export type FileVersionEntry = { id: string; version: number; created: string; size: number | null }

const MB = 1024 ** 2

// The API's own (graphql services/file-quota.ts megabytes), so a refusal here reads as the API's would.
export const megabytes = (bytes: number) => `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`

// How full: 'full' at the quota, 'near' from 90 %, else 'ok'.
export function storageLevel(storage: FileStorage): 'ok' | 'near' | 'full' {
  if (!storage.quota) return 'ok'
  const share = storage.used / storage.quota
  return share >= 1 ? 'full' : share >= 0.9 ? 'near' : 'ok'
}

// Why the API would refuse a file of `size` bytes: past the largest file (FILE_TOO_LARGE) or past what the quota has
// left (STORAGE_QUOTA_EXCEEDED), in the API's words. Nothing where direct uploads are off: /file/upload has limits of
// its own, and the API answers for them.
export function uploadRefusal(t: TFunction, storage: FileStorage | null | undefined, size: number): string | undefined {
  if (!storage?.directUpload) return undefined
  if (size > storage.maxFileSize)
    return t('fileStorage.tooLarge', 'A file may be at most {{max}}; this one is {{size}}', {
      max: megabytes(storage.maxFileSize),
      size: megabytes(size),
    })
  if (storage.used + size > storage.quota)
    return t(
      'fileStorage.overQuota',
      'This file would take the account past its file storage quota: {{used}} of {{quota}} used, and this file is {{size}}. Delete files or old versions of files you no longer need, then try again.',
      { used: megabytes(storage.used), quota: megabytes(storage.quota), size: megabytes(size) }
    )
  return undefined
}

type Failed = 'ERROR' | typeof UNSUPPORTED
const failed = (account: any): account is Failed => account === 'ERROR' || account === UNSUPPORTED

async function read(query: string, variables: ILookup<any>, marker: string): Promise<any> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (refusesField(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.login?.account
}

// Null where the person may not script the account (the API answers null then).
export async function fetchFileStorage(accountId: string): Promise<FileStorage | null | 'ERROR' | typeof UNSUPPORTED> {
  const account = await read(
    `query FileStorage($accountId: String) { login { account(id: $accountId) { fileStorage { used quota maxFileSize directUpload } } } }`,
    { accountId },
    'fileStorage'
  )
  return failed(account) ? account : account?.fileStorage ?? null
}

// What each of the account's files stores, all its versions, by file id; a file the API keeps no size for is left out.
export async function fetchFileSizes(accountId: string): Promise<ILookup<number> | 'ERROR' | typeof UNSUPPORTED> {
  const account = await read(
    `query FileSizes($accountId: String) { login { account(id: $accountId) { files { id storedSize } } } }`,
    { accountId },
    'storedSize'
  )
  if (failed(account)) return account
  const sizes: ILookup<number> = {}
  for (const file of account?.files ?? []) if (typeof file.storedSize === 'number') sizes[file.id] = file.storedSize
  return sizes
}

// A file's versions, newest first, each with what it stores (null where the API keeps no sizes).
export async function fetchFileVersions(
  accountId: string,
  fileId: string
): Promise<FileVersionEntry[] | 'ERROR' | typeof UNSUPPORTED> {
  const account = await read(
    `query FileVersions($accountId: String, $ids: [ID!]) { login { account(id: $accountId) { files(ids: $ids) {
      id versions(size: 100) { items { id version created size } } } } } }`,
    { accountId, ids: [fileId] },
    'size'
  )
  if (failed(account)) return account
  const items: FileVersionEntry[] = account?.files?.[0]?.versions?.items ?? []
  return [...items].sort((a, b) => b.version - a.version)
}

// Deleting one version: its bytes freed at once. The API refuses a version an unfinished job uses, naming the jobs —
// shown as any request's error is.
export async function deleteFileVersion(fileVersionId: string): Promise<boolean> {
  const response = await graphQLBasicRequest(
    ` mutation DeleteFileVersion($fileVersionId: String) {
        deleteFileVersion(fileVersionId: $fileVersionId)
      }`,
    { fileVersionId }
  )
  return response !== 'ERROR' && response?.data?.data?.deleteFileVersion === true
}
