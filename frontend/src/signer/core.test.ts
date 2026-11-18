// @vitest-environment node
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { openKeyFile, parseKeyFile, signingKey } from '../vendor/remoteit-apps/keyfile.mjs'
import { createKey, describeManifest, KeyFileError, NotStanding, signRelease } from './core'

/* The signer's work as it runs in signer.html, with Node's WebCrypto: the portal's copy of remoteit/apps' key file code
   signs exactly as the publishing tool does (the shared TEST-ONLY fixture), what the signer hands back is public, and
   a key that is not the publisher's never signs for it. */

const fixture = (name: string) =>
  readFileSync(new URL(`../vendor/remoteit-apps/fixtures/keys/${name}`, import.meta.url))
const expected = JSON.parse(fixture('expected.json').toString())
const keyFile = fixture('TEST-ONLY-publisher-key.pem').toString()
const manifest = new Uint8Array(fixture('manifest.json'))
const standing = [{ keyId: expected.keyId, publicKey: expected.publicKey }]
const PASS = 'a passphrase long enough'

// Every encoding a key's bytes could travel in.
const encodings = (bytes: Uint8Array) => {
  const b = Buffer.from(bytes)
  return [b.toString('base64'), b.toString('base64url'), b.toString('hex'), b.toString('latin1')]
}

describe('the signer', () => {
  it('signs the shared fixture manifest to exactly the .sig the tool makes and the daemon verifies', async () => {
    const signed = await signRelease(keyFile, expected.passphrase, manifest, standing)
    expect(signed).toEqual({ signature: fixture('manifest.json.sig').toString(), keyId: expected.keyId })
  })

  it('imports the key for signing alone, never extractable', async () => {
    const der = await openKeyFile(keyFile, expected.passphrase)
    const key = await signingKey(der)
    expect([key.extractable, key.usages]).toEqual([false, ['sign']])
  })

  it('refuses a key that is not one of the publisher’s standing keys, and a wrong passphrase', async () => {
    await expect(
      signRelease(keyFile, expected.passphrase, manifest, [{ ...standing[0], revoked: '2026-11-01' }])
    ).rejects.toBeInstanceOf(NotStanding)
    await expect(signRelease(keyFile, 'not the passphrase', manifest, standing)).rejects.toThrow(/wrong passphrase/)
    await expect(signRelease('not a key', expected.passphrase, manifest, standing)).rejects.toBeInstanceOf(KeyFileError)
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
