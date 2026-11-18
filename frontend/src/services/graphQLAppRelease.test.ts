// @vitest-environment node
import { readFileSync } from 'fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requests } = vi.hoisted(() => ({ requests: [] as { query: string; variables: any }[] }))
vi.mock('./graphQL', () => ({
  // graphql as the publish sees it: presigned uploads under the stage's downloads, then the release set.
  graphQLRequestWithReason: async (query: string, variables: any) => {
    requests.push({ query, variables })
    if (query.includes('appReleaseUploads'))
      return {
        data: {
          data: {
            appReleaseUploads: variables.files.map((f: any) => ({
              name: f.name,
              url: `https://bucket.s3.test/apps/${variables.app}/${variables.version}/${f.name}?X-Amz-Signature=s`,
              served: `https://downloads.test/apps/${variables.app}/${variables.version}/${f.name}`,
            })),
          },
        },
      }
    return { data: { data: { setAppRelease: 3 } } }
  },
  refusalOf: (result: any) => ('reason' in result ? result.reason : undefined),
}))

import { openKeyFile } from '../vendor/remoteit-apps/keyfile.mjs'
import { signRelease } from '../signer/core'
import { buildRelease } from '../helpers/appRelease'
import { CACHE_CONTROL, publishRelease } from './graphQLAppRelease'

/* The publish end to end, the signer's own code in the loop with the shared TEST-ONLY key file: what leaves the
   browser — every graphql request and every upload — is searched for the private key in every encoding it could
   travel in, and for the passphrase and the key file itself, and holds none of them. And the uploads carry the
   Cache-Control graphql signed for, setAppRelease names the hosted manifest, and a retry resumes. */

const fixture = (name: string) =>
  readFileSync(new URL(`../vendor/remoteit-apps/fixtures/keys/${name}`, import.meta.url))
const expected = JSON.parse(fixture('expected.json').toString())
const keyFile = fixture('TEST-ONLY-publisher-key.pem').toString()

const source = {
  contract: 1,
  app: 'test.panel',
  version: '1.0.0',
  name: 'Panel',
  run: { command: 'bin/panel', args: ['${remoteit.port}'] },
  listen: { type: 'tcp' },
  service: { name: 'Panel', protocol: 'http' },
}

// Every form secret bytes could travel in.
const encodings = (bytes: Uint8Array) => {
  const b = Buffer.from(bytes)
  return [
    b.toString('base64'),
    b.toString('base64url'),
    b.toString('hex'),
    b.toString('hex').toUpperCase(),
    b.toString('latin1'),
  ]
}

beforeEach(() => {
  requests.length = 0
})

describe('publishing a release', () => {
  it('sends the release and its signature, and never the key, the passphrase or the key file', async () => {
    const built = await buildRelease(
      source,
      { 'linux-arm64': { kind: 'program', file: new File(['#!/bin/sh\n'], 'panel') } },
      16 << 20
    )
    const signed = await signRelease(keyFile, expected.passphrase, built.bytes, [
      { keyId: expected.keyId, publicKey: expected.publicKey },
    ])
    expect(signed.keyId).toBe(expected.keyId)
    const files = [
      ...built.archives,
      { name: 'manifest.json', data: built.bytes },
      { name: 'manifest.json.sig', data: new TextEncoder().encode(signed.signature) },
    ]

    const puts: { url: string; body: Uint8Array; headers: Record<string, string> }[] = []
    const fetchImpl = (async (url: string, init: any) => {
      puts.push({ url, body: new Uint8Array(init.body), headers: init.headers })
      return new Response(null, { status: 200 })
    }) as unknown as typeof fetch
    const result = await publishRelease(source.app, source.version, files, new Set(), undefined, fetchImpl)
    expect(result).toEqual({
      ok: { manifest: 'https://downloads.test/apps/test.panel/1.0.0/manifest.json', devices: 3 },
    })

    // What left: graphql's requests and the uploads' bodies, all of it.
    const sent = [
      ...requests.map(r => JSON.stringify(r)),
      ...puts.map(p => Buffer.from(p.body).toString('latin1')),
      ...puts.map(p => p.url),
    ]
    const pkcs8 = await openKeyFile(keyFile, expected.passphrase)
    const secrets = [
      ...encodings(pkcs8),
      ...encodings(pkcs8.slice(16)), // the 32-byte seed itself
      expected.passphrase,
      keyFile.split('-----BEGIN ENCRYPTED PRIVATE KEY-----')[1].split('-----END')[0].replace(/\s+/g, '').slice(0, 40),
    ]
    for (const text of sent) for (const secret of secrets) expect(text.includes(secret)).toBe(false)

    // What was sent: the archive, the manifest's exact bytes and its signature, each with the signed Cache-Control.
    expect(puts.map(p => p.url.split('?')[0].split('/').pop())).toEqual([
      'test.panel-1.0.0-linux-arm64.tar.gz',
      'manifest.json',
      'manifest.json.sig',
    ])
    expect(puts.every(p => p.headers['cache-control'] === CACHE_CONTROL)).toBe(true)
    expect(puts[1].body).toEqual(built.bytes)
    expect(new TextDecoder().decode(puts[2].body)).toBe(signed.signature)
    expect(requests.map(r => r.query.match(/\{ (\w+)\(/)?.[1])).toEqual(['appReleaseUploads', 'setAppRelease'])
    expect(requests[1].variables).toEqual({
      app: 'test.panel',
      version: '1.0.0',
      manifest: 'https://downloads.test/apps/test.panel/1.0.0/manifest.json',
    })
  })

  it('a failed upload says which file; a retry sends only what is not up yet', async () => {
    const files = [
      { name: 'a.tar.gz', data: new Uint8Array([1]) },
      { name: 'manifest.json', data: new Uint8Array([2]) },
      { name: 'manifest.json.sig', data: new Uint8Array([3]) },
    ]
    const done = new Set<string>()
    let fail = true
    const urls: string[] = []
    const fetchImpl = (async (url: string) => {
      urls.push(url.split('?')[0].split('/').pop()!)
      if (fail && url.includes('manifest.json?'))
        return new Response('denied', { status: 403, statusText: 'Forbidden' })
      return new Response(null, { status: 200 })
    }) as unknown as typeof fetch
    expect(await publishRelease('test.panel', '1.0.0', files, done, undefined, fetchImpl)).toEqual({
      reason: 'manifest.json: 403 Forbidden',
    })
    fail = false
    expect('ok' in (await publishRelease('test.panel', '1.0.0', files, done, undefined, fetchImpl))).toBe(true)
    expect(urls).toEqual(['a.tar.gz', 'manifest.json', 'manifest.json', 'manifest.json.sig'])
  })
})
