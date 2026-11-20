// The portal's declarations for keyfile.mjs (vendored from remoteit/apps lib/keyfile.mjs): kept by the vendor script.
export const KEY_FILE_FORMAT: number
export const KEY_FILE_ITERATIONS: number
export class KeyFileError extends Error {}
export type StandingKey = { keyId: string; publicKey: string; revoked?: string | null }
export function parseKeyFile(text: string): {
  format: number
  encrypted: boolean
  info: Record<string, string>
  der: Uint8Array
}
export function openKeyFile(text: string, passphrase?: string, subtle?: SubtleCrypto): Promise<Uint8Array>
export function sealKeyFile(
  pkcs8: Uint8Array,
  passphrase: string,
  info?: { publisher?: string; keyId?: string; publicKey?: string; created?: string },
  options?: { iterations?: number; subtle?: SubtleCrypto; random?: (bytes: Uint8Array) => Uint8Array }
): Promise<string>
export function passphraseProblem(passphrase: string): string | undefined
export function publicKeyId(raw: Uint8Array, subtle?: SubtleCrypto): Promise<{ publicKey: string; keyId: string }>
export function newKey(subtle?: SubtleCrypto): Promise<{ pkcs8: Uint8Array; publicKey: string; keyId: string }>
export function signingKey(pkcs8: Uint8Array, subtle?: SubtleCrypto): Promise<CryptoKey>
export function signManifest(key: CryptoKey, manifest: Uint8Array, subtle?: SubtleCrypto): Promise<string>
export function verifyingKey(
  keys: StandingKey[],
  manifest: Uint8Array,
  sig: string,
  subtle?: SubtleCrypto
): Promise<string | undefined>
