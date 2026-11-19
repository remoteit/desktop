// @vitest-environment node
import { createPrivateKey, sign } from 'crypto'
import { readFileSync } from 'fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { openKeyFile, parseKeyFile, signingKey, verifyingKey } from '../vendor/remoteit-apps/keyfile.mjs'
import { createKey, describeManifest, KeyFileError, NotStanding, signRelease } from './core'

/* The signer's work as it runs in signer.html, with Node's WebCrypto: the portal's copy of remoteit/apps' key file code
   verifies what the publishing tool signed (the shared fixture's manifest, signature and public key) and signs exactly
   as Node's own Ed25519 does, what the signer hands back is public, and a key that is not the publisher's never signs
   for it. No private key is vendored: each key here is made by the test. */

const fixture = (name: string) =>
  readFileSync(new URL(`../vendor/remoteit-apps/fixtures/keys/${name}`, import.meta.url))
const tool = JSON.parse(fixture('public.json').toString())
const manifest = new Uint8Array(fixture('manifest.json'))
const PASS = 'a passphrase long enough'
let keyFile: string
let standing: { keyId: string; publicKey: string }[]
beforeAll(async () => {
  const made = await createKey('test', PASS)
  keyFile = made.file
  standing = [{ keyId: made.keyId, publicKey: made.publicKey }]
})

// Every encoding a key's bytes could travel in.
const encodings = (bytes: Uint8Array) => {
  const b = Buffer.from(bytes)
  return [b.toString('base64'), b.toString('base64url'), b.toString('hex'), b.toString('latin1')]
}

describe('the signer', () => {
  it('verifies the signature the publishing tool made, as graphql and the daemon do', async () => {
    expect(await verifyingKey([tool], manifest, fixture('manifest.json.sig').toString())).toBe(tool.keyId)
  })

  it('signs to exactly the bytes Node’s own Ed25519 makes with the same key', async () => {
    const signed = await signRelease(keyFile, PASS, manifest, standing)
    const der = await openKeyFile(keyFile, PASS)
    const node = createPrivateKey({ key: Buffer.from(der), format: 'der', type: 'pkcs8' })
    expect(signed).toEqual({
      signature: `${sign(null, manifest, node).toString('base64')}\n`,
      keyId: standing[0].keyId,
    })
  })

  it('imports the key for signing alone, never extractable', async () => {
    const der = await openKeyFile(keyFile, PASS)
    const key = await signingKey(der)
    expect([key.extractable, key.usages]).toEqual([false, ['sign']])
  })

  it('refuses a key that is not one of the publisher’s standing keys, and a wrong passphrase', async () => {
    await expect(
      signRelease(keyFile, PASS, manifest, [{ ...standing[0], revoked: '2026-11-01' }])
    ).rejects.toBeInstanceOf(NotStanding)
    await expect(signRelease(keyFile, 'not the passphrase', manifest, standing)).rejects.toThrow(/wrong passphrase/)
    await expect(signRelease('not a key', PASS, manifest, standing)).rejects.toBeInstanceOf(KeyFileError)
  })

  it('makes a key file of format 1 holding the key only encrypted, and hands back only its public half', async () => {
    const made = await createKey('acme', PASS)
    expect(made.fileName).toBe(`acme-app-key-${made.keyId}.pem`)
    const parsed = parseKeyFile(made.file)
    expect([parsed.format, parsed.encrypted, parsed.info['Key id'], parsed.info.Publisher]).toEqual([
      1,
      true,
      made.keyId,
      'acme',
    ])
    const pkcs8 = await openKeyFile(made.file, PASS)
    const seed = pkcs8.slice(16)
    for (const text of [...encodings(pkcs8), ...encodings(seed)]) expect(made.file).not.toContain(text)
    // What the page is told: the public key and its id, nothing of the private key or the passphrase.
    const told = JSON.stringify({ publicKey: made.publicKey, keyId: made.keyId })
    for (const text of [...encodings(pkcs8), ...encodings(seed), PASS]) expect(told).not.toContain(text)
    const signed = await signRelease(made.file, PASS, manifest, [{ keyId: made.keyId, publicKey: made.publicKey }])
    expect(signed.keyId).toBe(made.keyId)
  })

  it('describes a manifest from its bytes', async () => {
    expect(await describeManifest(manifest)).toEqual({
      app: 'test.hello',
      version: '1.0.0',
      root: false,
      platforms: [],
      sha256: require('crypto').createHash('sha256').update(manifest).digest('hex'),
    })
  })
})
