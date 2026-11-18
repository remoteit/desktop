import { graphQLRequestWithReason, refusalOf } from './graphQL'
import { ReleaseFile } from '../helpers/appRelease'

/* A publisher's release published from the portal (presence-server docs/device-apps-new-app.md, "Publish"), as the
   publishing tool publishes one (remoteit/apps tools/remoteit-app.mjs upload, release): graphql's presigned PUTs for
   its files (appReleaseUploads: under apps/<id>/<version>/ of the stage's downloads), each file put there with the
   Cache-Control the URL is signed for, then setAppRelease with the hosted manifest URL — which reads the manifest and
   its signature back, takes them only if the signature is one of the publisher's standing keys', catalogues a new app
   private, and makes the release its stable one. What is sent: the manifest, its signature and the archives — all
   public once published —, never a key: the signature is made in the signer (components/SignerFrame). */

export type Upload = { name: string; url: string; served: string }

// Each step's outcome: done, or graphql's or the store's reason.
export type Step<T> = { ok: T } | { reason: string }

export async function graphQLReleaseUploads(
  app: string,
  version: string,
  files: { name: string; size: number }[]
): Promise<Step<Upload[]>> {
  const result = await graphQLRequestWithReason(
    'mutation AppReleaseUploads($app: String!, $version: String!, $files: [AppReleaseFileInput!]!) { appReleaseUploads(app: $app, version: $version, files: $files) { name url served } }',
    { app, version, files }
  )
  const reason = refusalOf(result)
  if (reason !== undefined) return { reason }
  const uploads = (result as any).data?.data?.appReleaseUploads
  return Array.isArray(uploads) ? { ok: uploads } : { reason: '' }
}

export async function graphQLSetAppRelease(app: string, version: string, manifest: string): Promise<Step<number>> {
  const result = await graphQLRequestWithReason(
    'mutation SetAppRelease($app: String!, $version: String!, $manifest: String!) { setAppRelease(app: $app, version: $version, manifest: $manifest) }',
    { app, version, manifest }
  )
  const reason = refusalOf(result)
  if (reason !== undefined) return { reason }
  return { ok: Number((result as any).data?.data?.setAppRelease ?? 0) }
}

// The headers the publishing tool stores release files with: the length exactly, immutable (a version is written
// once; graphql signs the URL for this Cache-Control), and the type by extension.
const TYPES: [string, string][] = [
  ['.json', 'application/json'],
  ['.sig', 'text/plain'],
  ['.gz', 'application/gzip'],
]
export const CACHE_CONTROL = 'public, max-age=31536000, immutable'

export async function putFile(url: string, file: ReleaseFile, fetchImpl: typeof fetch = fetch): Promise<Step<true>> {
  let res: Response
  try {
    res = await fetchImpl(url, {
      method: 'PUT',
      body: file.data as Uint8Array<ArrayBuffer>,
      headers: {
        'cache-control': CACHE_CONTROL,
        'content-type': TYPES.find(([ext]) => file.name.endsWith(ext))?.[1] ?? 'application/octet-stream',
      },
    })
  } catch (error) {
    return { reason: `${file.name}: ${(error as Error).message}` }
  }
  // The URL carries its signature: a refusal names the file and the store's status alone.
  return res.ok ? { ok: true } : { reason: `${file.name}: ${res.status} ${res.statusText}` }
}

export type Progress = (name: string) => void

// The whole publish: every file uploaded (those already up skipped, so a retry resumes), then the release set.
// done: the files uploaded before, by name. The hosted manifest URL, and the devices it was given to.
export async function publishRelease(
  app: string,
  version: string,
  files: ReleaseFile[],
  done: Set<string>,
  progress: Progress = () => {},
  fetchImpl: typeof fetch = fetch
): Promise<Step<{ manifest: string; devices: number }>> {
  const uploads = await graphQLReleaseUploads(
    app,
    version,
    files.map(file => ({ name: file.name, size: file.data.length }))
  )
  if ('reason' in uploads) return uploads
  const byName = new Map(uploads.ok.map(upload => [upload.name, upload]))
  for (const file of files) {
    if (done.has(file.name)) continue
    const upload = byName.get(file.name)
    if (!upload) return { reason: `${file.name}: graphql gave no upload for it` }
    const put = await putFile(upload.url, file, fetchImpl)
    if ('reason' in put) return put
    done.add(file.name)
    progress(file.name)
  }
  const manifest = byName.get('manifest.json')?.served
  if (!manifest) return { reason: 'manifest.json: graphql gave no hosted URL for it' }
  const set = await graphQLSetAppRelease(app, version, manifest)
  return 'reason' in set ? set : { ok: { manifest, devices: set.ok } }
}
