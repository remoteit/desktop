import {
  KeyFileError,
  newKey,
  openKeyFile,
  sealKeyFile,
  signingKey,
  signManifest,
  type StandingKey,
  verifyingKey,
} from '../vendor/remoteit-apps/keyfile.mjs'

/* What the signer does, apart from its page (signer/main.ts), so it is tested as it runs: make a publisher key and seal
   it into a key file (format 1, remoteit/apps lib/keyfile.mjs), and sign a release's manifest with a key file. Key
   material lives in one Uint8Array at a time, zeroed as soon as it is used; a signing key is imported non-extractable
   and used once. What leaves here is public: a key file (the key only encrypted), a public key and its id, a
   signature. */

export class NotStanding extends Error {}

export type Created = { file: string; fileName: string; publicKey: string; keyId: string }

// A new key, sealed with passphrase into a key file named for the publisher and the key.
export async function createKey(
  publisher: string,
  passphrase: string,
  subtle: SubtleCrypto = crypto.subtle
): Promise<Created> {
  const made = await newKey(subtle)
  try {
    const file = await sealKeyFile(
      made.pkcs8,
      passphrase,
      { publisher, keyId: made.keyId, publicKey: made.publicKey },
      { subtle }
    )
    return { file, fileName: `${publisher}-app-key-${made.keyId}.pem`, publicKey: made.publicKey, keyId: made.keyId }
  } finally {
    made.pkcs8.fill(0)
  }
}

// manifest signed with the key in a key file: its .sig text, and the id of the standing key it verifies against. A
// key that is none of keys (another publisher's, or revoked) is refused: a signature graphql would not take never
// leaves.
export async function signRelease(
  file: string,
  passphrase: string,
  manifest: Uint8Array,
  keys: StandingKey[],
  subtle: SubtleCrypto = crypto.subtle
): Promise<{ signature: string; keyId: string }> {
  const der = await openKeyFile(file, passphrase, subtle)
  let key: CryptoKey
  try {
    key = await signingKey(der, subtle)
  } finally {
    der.fill(0)
  }
  const signature = await signManifest(key, manifest, subtle)
  const keyId = await verifyingKey(keys, manifest, signature, subtle)
  if (!keyId) throw new NotStanding()
  return { signature, keyId }
}

export type Described = { app: string; version: string; root: boolean; platforms: string[]; sha256: string }

// What a manifest is, read from the bytes the signer is given — not from the portal's words —, for the person to see
// before signing.
export async function describeManifest(manifest: Uint8Array, subtle: SubtleCrypto = crypto.subtle): Promise<Described> {
  const m = JSON.parse(new TextDecoder().decode(manifest))
  const digest = new Uint8Array(await subtle.digest('SHA-256', manifest as Uint8Array<ArrayBuffer>))
  return {
    app: String(m.app),
    version: String(m.version),
    root: m.run?.as === 'root',
    platforms: Object.keys(m.archives ?? {}),
    sha256: Array.from(digest, b => b.toString(16).padStart(2, '0')).join(''),
  }
}

export { KeyFileError }
