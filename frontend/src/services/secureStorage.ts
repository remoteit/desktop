/**
 * At-rest encryption for sensitive values persisted to localStorage (the
 * agent's OAuth tokens). The AES-GCM key is generated non-extractable and
 * lives only in IndexedDB: running code on this origin can ask it to
 * encrypt/decrypt, but the key material itself can never be read out — so a
 * copied localStorage (backups, disk images, extensions reading storage)
 * yields ciphertext only. Both app windows (main and chat popout) share the
 * key through the same origin-scoped database.
 */

const DB_NAME = 'remoteit-secure'
const STORE = 'keys'
const KEY_ID = 'at-rest'
const PREFIX = 'enc.v1.'
const IV_LENGTH = 12

export const isEncrypted = (value: string): boolean => value.startsWith(PREFIX)

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/* Get-or-create inside one readwrite transaction so concurrent windows can't
   race two different keys into existence (the freshly generated key is
   discarded when another window won) */
async function loadOrStoreKey(fresh: CryptoKey): Promise<CryptoKey> {
  const db = await openDb()
  try {
    return await new Promise<CryptoKey>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const keys = tx.objectStore(STORE)
      const existing = keys.get(KEY_ID)
      existing.onsuccess = () => {
        if (existing.result) resolve(existing.result as CryptoKey)
        else {
          keys.put(fresh, KEY_ID)
          resolve(fresh)
        }
      }
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

let keyPromise: Promise<CryptoKey> | null = null

function atRestKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle
    .generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    .then(loadOrStoreKey)
    .catch(error => {
      keyPromise = null // e.g. IndexedDB unavailable — let a later call retry
      throw error
    })
  return keyPromise
}

export async function encryptString(plain: string): Promise<string> {
  const key = await atRestKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  const bytes = new Uint8Array(IV_LENGTH + cipher.byteLength)
  bytes.set(iv)
  bytes.set(new Uint8Array(cipher), IV_LENGTH)
  let binary = ''
  bytes.forEach(byte => (binary += String.fromCharCode(byte)))
  return PREFIX + btoa(binary)
}

/* null when the value isn't ours to read: wrong/rotated key, corrupt data,
   or not an encrypted value at all — callers treat it as signed out */
export async function decryptString(value: string): Promise<string | null> {
  if (!isEncrypted(value)) return null
  try {
    const bytes = Uint8Array.from(atob(value.slice(PREFIX.length)), c => c.charCodeAt(0))
    const key = await atRestKey()
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, IV_LENGTH) }, key, bytes.slice(IV_LENGTH))
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}
