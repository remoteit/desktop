// Vendored from remoteit/apps@7a5c28234aecacdf994e174b5660d05ca1ef0cf5 lib/keyfile.mjs: not edited here (scripts/vendor-remoteit-apps.mjs).
// SPDX-License-Identifier: Apache-2.0
// The publisher key file, format 1: the one file a publisher keeps, read alike by remoteit-app, the portal (which
// vendors this file verbatim: desktop frontend/src/vendor/remoteit-apps) and any later signer (the desktop app's
// keychain). Pure WebCrypto and no imports, so the same code runs in Node (20.11 and later) and in a browser.
//
// What the file is (presence-server docs/device-apps-new-app.md, "The key file"):
//
//   remote.it app publisher key: format 1                    <- the format line: this file's version
//   Publisher: acme                                           <- informational lines, "Name: value": not trusted
//   Key id: 0123456789abcdef
//   Public key: <base64 of the 32-byte Ed25519 public key>
//   Created: 2026-11-18T17:00:00.000Z
//   -----BEGIN ENCRYPTED PRIVATE KEY-----
//   <base64 of a DER EncryptedPrivateKeyInfo (RFC 5958): PBES2 (RFC 8018) with PBKDF2-HMAC-SHA256, a 16-byte salt and
//    600,000 iterations, and AES-256-CBC with a 16-byte IV, over the Ed25519 key's PKCS#8 PrivateKeyInfo (RFC 8410)>
//   -----END ENCRYPTED PRIVATE KEY-----
//
// The block is standard encrypted PKCS#8, which OpenSSL writes and reads (`openssl pkey -in key.pem` asks for the
// passphrase), as Node's createPrivateKey does: PEM readers skip text before the BEGIN line (RFC 7468 section 2), so the
// lines above it are for people and never change what the key is. The passphrase is its UTF-8 bytes, as OpenSSL takes
// it. AES-CBC carries no MAC: a wrong passphrase is told by the padding or the PKCS#8 structure that comes out, and a
// key that is not the publisher's is told by its signature not verifying against the publisher's registered keys,
// which every signer checks before a signature leaves it.
//
// Readers take format 1 and anything a standard tool writes — an encrypted PKCS#8 block with PBES2 (PBKDF2 with
// HMAC-SHA1/256/384/512, AES-128/192/256-CBC), or a plain PKCS#8 PRIVATE KEY block such as `remoteit-app key new` and
// `openssl genpkey -algorithm ed25519` write — and refuse a format line naming a later format, so a reader never
// guesses at a file a newer remote.it wrote.

export const KEY_FILE_FORMAT = 1
export const KEY_FILE_ITERATIONS = 600_000
const FORMAT_LINE = /^remote\.it app publisher key: format (\d+)\s*$/
const ITERATIONS_MOST = 10_000_000 // a file asking for more is refused rather than spun on
const PASSPHRASE_LEAST = 12

// ---- DER, as much of it as PKCS#8 and PBES2 need

const OID = {
  pbes2: '1.2.840.113549.1.5.13',
  pbkdf2: '1.2.840.113549.1.5.12',
  hmacWithSHA1: '1.2.840.113549.2.7',
  hmacWithSHA256: '1.2.840.113549.2.9',
  hmacWithSHA384: '1.2.840.113549.2.10',
  hmacWithSHA512: '1.2.840.113549.2.11',
  aes128CBC: '2.16.840.1.101.3.4.1.2',
  aes192CBC: '2.16.840.1.101.3.4.1.22',
  aes256CBC: '2.16.840.1.101.3.4.1.42',
  ed25519: '1.3.101.112',
}
const PRF_HASH = {[OID.hmacWithSHA1]: 'SHA-1', [OID.hmacWithSHA256]: 'SHA-256', [OID.hmacWithSHA384]: 'SHA-384', [OID.hmacWithSHA512]: 'SHA-512'}
const AES_BITS = {[OID.aes128CBC]: 128, [OID.aes192CBC]: 192, [OID.aes256CBC]: 256}

const concat = parts => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

function tlv(tag, body) {
  const n = body.length
  const len = n < 0x80 ? [n] : n < 0x100 ? [0x81, n] : n < 0x10000 ? [0x82, n >> 8, n & 0xff] : [0x83, n >> 16, (n >> 8) & 0xff, n & 0xff]
  return concat([Uint8Array.of(tag, ...len), body])
}
const seq = (...items) => tlv(0x30, concat(items))
const octets = bytes => tlv(0x04, bytes)
const nul = () => Uint8Array.of(0x05, 0x00)
function integer(value) {
  const bytes = []
  for (let v = value; v > 0; v = Math.floor(v / 256)) bytes.unshift(v & 0xff)
  if (!bytes.length || bytes[0] & 0x80) bytes.unshift(0)
  return tlv(0x02, Uint8Array.from(bytes))
}
function oid(dotted) {
  const [a, b, ...rest] = dotted.split('.').map(Number)
  const out = [a * 40 + b]
  for (const arc of rest) {
    const groups = []
    for (let v = arc; ; v = Math.floor(v / 128)) {
      groups.unshift(v & 0x7f)
      if (v < 128) break
    }
    out.push(...groups.map((g, i) => (i < groups.length - 1 ? g | 0x80 : g)))
  }
  return tlv(0x06, Uint8Array.from(out))
}

class KeyFileError extends Error {}

// One DER value at bytes[at]: {tag, body, end}. Definite lengths only, as DER is.
function read(bytes, at = 0) {
  if (at + 2 > bytes.length) throw new KeyFileError('not a key file: its key is cut short')
  const tag = bytes[at]
  let len = bytes[at + 1]
  let start = at + 2
  if (len & 0x80) {
    const count = len & 0x7f
    if (count < 1 || count > 3 || start + count > bytes.length) throw new KeyFileError('not a key file: a length it cannot hold')
    len = 0
    for (let i = 0; i < count; i++) len = len * 256 + bytes[start + i]
    start += count
  }
  if (start + len > bytes.length) throw new KeyFileError('not a key file: its key is cut short')
  return {tag, body: bytes.subarray(start, start + len), end: start + len}
}
// The values of a constructed one's body, in order.
function items(body, tag = 0x30) {
  const out = []
  for (let at = 0; at < body.length;) {
    const v = read(body, at)
    out.push(v)
    at = v.end
  }
  if (tag !== undefined && !out.length) throw new KeyFileError('not a key file: an empty structure')
  return out
}
function want(v, tag, what) {
  if (!v || v.tag !== tag) throw new KeyFileError(`not a key file: ${what}`)
  return v
}
function readOid(v) {
  want(v, 0x06, 'an algorithm it does not name')
  const b = v.body
  const arcs = [Math.floor(b[0] / 40), b[0] % 40]
  let n = 0
  for (let i = 1; i < b.length; i++) {
    n = n * 128 + (b[i] & 0x7f)
    if (!(b[i] & 0x80)) {
      arcs.push(n)
      n = 0
    }
  }
  return arcs.join('.')
}
function readInt(v) {
  want(v, 0x02, 'a number it does not hold')
  if (v.body.length > 6) throw new KeyFileError('not a key file: a number too large')
  return v.body.reduce((n, b) => n * 256 + b, 0)
}

// ---- PEM

const b64 = bytes => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
const unb64 = text => {
  let s
  try {
    s = atob(text.replace(/\s+/g, ''))
  } catch {
    throw new KeyFileError('not a key file: its key is not base64')
  }
  return Uint8Array.from(s, c => c.charCodeAt(0))
}
const wrap = text => text.match(/.{1,64}/g).join('\n')
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')

// ---- Ed25519's PKCS#8 (RFC 8410): version 0 or 1, the algorithm, the 32-byte seed in an OCTET STRING

const ED25519_PKCS8_HEAD = Uint8Array.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20])

// Throws unless der is an Ed25519 PrivateKeyInfo: what a wrong passphrase almost never comes out as.
function checkEd25519(der) {
  let top
  try {
    top = read(der)
    if (top.tag !== 0x30 || top.end !== der.length) throw new KeyFileError('')
    const [version, algorithm, key] = items(top.body)
    if (readInt(version) > 1) throw new KeyFileError('')
    if (readOid(items(want(algorithm, 0x30, '').body)[0]) !== OID.ed25519) throw new KeyFileError('not an Ed25519 key: remote.it app keys are Ed25519')
    const inner = read(want(key, 0x04, '').body)
    if (inner.tag !== 0x04 || inner.body.length !== 32) throw new KeyFileError('')
  } catch (error) {
    if (error instanceof KeyFileError && error.message) throw error
    throw new KeyFileError('wrong passphrase, or not a key file')
  }
}

// ---- the file

// What a key file says before any passphrase: {format, encrypted, info: {name: value}, der}. Throws KeyFileError.
export function parseKeyFile(text) {
  if (typeof text !== 'string') throw new KeyFileError('not a key file')
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const begin = lines.findIndex(l => /^-----BEGIN (ENCRYPTED )?PRIVATE KEY-----\s*$/.test(l))
  if (begin < 0) {
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) throw new KeyFileError('not a PKCS#8 key: give an Ed25519 key in PKCS#8 (openssl pkey converts one)')
    throw new KeyFileError('not a key file: it has no private key block')
  }
  const encrypted = lines[begin].includes('ENCRYPTED')
  const label = encrypted ? 'ENCRYPTED PRIVATE KEY' : 'PRIVATE KEY'
  const end = lines.findIndex((l, i) => i > begin && l.trim() === `-----END ${label}-----`)
  if (end < 0) throw new KeyFileError('not a key file: its key block has no end')
  let format = 0
  const info = {}
  for (const line of lines.slice(0, begin)) {
    const f = FORMAT_LINE.exec(line)
    if (f) {
      format = Number(f[1])
      continue
    }
    const at = line.indexOf(': ')
    if (at > 0) info[line.slice(0, at).trim()] = line.slice(at + 2).trim()
  }
  if (format > KEY_FILE_FORMAT) throw new KeyFileError(`a key file of format ${format}, which this remote.it does not read yet: update it`)
  return {format, encrypted, info, der: unb64(lines.slice(begin + 1, end).join(''))}
}

// The PBES2 parameters of an EncryptedPrivateKeyInfo: {salt, iterations, hash, iv, bits, data}.
function pbes2Of(der) {
  const top = read(der)
  if (top.tag !== 0x30 || top.end !== der.length) throw new KeyFileError('not a key file: its key is not one structure')
  const [algorithm, data] = items(top.body)
  const [scheme, params] = items(want(algorithm, 0x30, 'no encryption algorithm').body)
  if (readOid(scheme) !== OID.pbes2) throw new KeyFileError('encrypted with a scheme other than PBES2: re-encrypt it (openssl pkcs8 -topk8 -v2 aes-256-cbc)')
  const [kdf, enc] = items(want(params, 0x30, 'no PBES2 parameters').body)
  const [kdfOid, kdfParams] = items(want(kdf, 0x30, 'no key derivation').body)
  if (readOid(kdfOid) !== OID.pbkdf2) throw new KeyFileError('its passphrase is derived other than by PBKDF2: re-encrypt it')
  const [salt, iter, ...rest] = items(want(kdfParams, 0x30, 'no PBKDF2 parameters').body)
  let hash = 'SHA-1' // PBKDF2's default PRF
  for (const v of rest) {
    if (v.tag !== 0x30) continue // keyLength: AES's own
    const prf = readOid(items(v.body)[0])
    hash = PRF_HASH[prf]
    if (!hash) throw new KeyFileError('its PBKDF2 uses a hash this reader does not: re-encrypt it')
  }
  const iterations = readInt(iter)
  if (iterations < 1 || iterations > ITERATIONS_MOST) throw new KeyFileError(`its PBKDF2 asks ${iterations} iterations: 1 to ${ITERATIONS_MOST}`)
  const [encOid, iv] = items(want(enc, 0x30, 'no cipher').body)
  const bits = AES_BITS[readOid(encOid)]
  if (!bits) throw new KeyFileError('encrypted with a cipher other than AES-CBC: re-encrypt it (openssl pkcs8 -topk8 -v2 aes-256-cbc)')
  want(iv, 0x04, 'no IV')
  if (iv.body.length !== 16) throw new KeyFileError('not a key file: an IV that is not 16 bytes')
  return {salt: want(salt, 0x04, 'no salt').body, iterations, hash, iv: iv.body, bits, data: want(data, 0x04, 'no encrypted key').body}
}

async function deriveAes(subtle, passphrase, {salt, iterations, hash, bits}, usage) {
  const base = await subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey({name: 'PBKDF2', salt, iterations, hash}, base, {name: 'AES-CBC', length: bits}, false, [usage])
}

// The Ed25519 PKCS#8 DER of a key file: decrypted with passphrase where it is encrypted. The caller owns the bytes and
// zeroes them (fill(0)) once the key is imported. Throws KeyFileError: a wrong passphrase says so.
export async function openKeyFile(text, passphrase, subtle = globalThis.crypto.subtle) {
  const file = parseKeyFile(text)
  if (!file.encrypted) {
    checkEd25519(file.der)
    return file.der
  }
  if (!passphrase) throw new KeyFileError('the key file is encrypted: give its passphrase')
  const p = pbes2Of(file.der)
  const aes = await deriveAes(subtle, passphrase, p, 'decrypt')
  let der
  try {
    der = new Uint8Array(await subtle.decrypt({name: 'AES-CBC', iv: p.iv}, aes, p.data))
  } catch {
    throw new KeyFileError('wrong passphrase, or not a key file')
  }
  try {
    checkEd25519(der)
  } catch (error) {
    der.fill(0)
    throw error
  }
  return der
}

// A key file of format 1 holding pkcs8 (an Ed25519 PrivateKeyInfo, DER), encrypted with passphrase. info: {publisher,
// keyId, publicKey, created} for the informational lines.
export async function sealKeyFile(pkcs8, passphrase, info = {}, {iterations = KEY_FILE_ITERATIONS, subtle = globalThis.crypto.subtle, random = b => globalThis.crypto.getRandomValues(b)} = {}) {
  checkEd25519(pkcs8)
  const problem = passphraseProblem(passphrase)
  if (problem) throw new KeyFileError(problem)
  const salt = random(new Uint8Array(16))
  const iv = random(new Uint8Array(16))
  const aes = await deriveAes(subtle, passphrase, {salt, iterations, hash: 'SHA-256', bits: 256}, 'encrypt')
  const data = new Uint8Array(await subtle.encrypt({name: 'AES-CBC', iv}, aes, pkcs8))
  const der = seq(
    seq(oid(OID.pbes2), seq(
      seq(oid(OID.pbkdf2), seq(octets(salt), integer(iterations), seq(oid(OID.hmacWithSHA256), nul()))),
      seq(oid(OID.aes256CBC), octets(iv)))),
    octets(data))
  const lines = [`remote.it app publisher key: format ${KEY_FILE_FORMAT}`]
  if (info.publisher) lines.push(`Publisher: ${info.publisher}`)
  if (info.keyId) lines.push(`Key id: ${info.keyId}`)
  if (info.publicKey) lines.push(`Public key: ${info.publicKey}`)
  lines.push(`Created: ${info.created ?? new Date().toISOString()}`)
  return `${lines.join('\n')}\n-----BEGIN ENCRYPTED PRIVATE KEY-----\n${wrap(b64(der))}\n-----END ENCRYPTED PRIVATE KEY-----\n`
}

// Why a passphrase is not one a key file is sealed with, or undefined.
export function passphraseProblem(passphrase) {
  if (typeof passphrase !== 'string' || [...passphrase].length < PASSPHRASE_LEAST) return `a passphrase of at least ${PASSPHRASE_LEAST} characters`
}

// ---- the key itself

// The public key graphql registers (base64 of its 32 bytes) and its id (the first 16 hex of their SHA-256).
export async function publicKeyId(raw, subtle = globalThis.crypto.subtle) {
  return {publicKey: b64(raw), keyId: hex(new Uint8Array(await subtle.digest('SHA-256', raw))).slice(0, 16)}
}

// A new Ed25519 key: {pkcs8 (DER, the caller zeroes it), publicKey, keyId}. Its CryptoKeys are dropped here.
export async function newKey(subtle = globalThis.crypto.subtle) {
  const pair = await subtle.generateKey({name: 'Ed25519'}, true, ['sign', 'verify'])
  const pkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', pair.privateKey))
  const raw = new Uint8Array(await subtle.exportKey('raw', pair.publicKey))
  return {pkcs8, ...(await publicKeyId(raw, subtle))}
}

// The key a PKCS#8 holds, imported for signing alone and not extractable: its bytes never come back out of WebCrypto.
// Ed25519's PKCS#8 is normalised to version 0 with nothing after the seed, the form every WebCrypto takes.
export async function signingKey(pkcs8, subtle = globalThis.crypto.subtle) {
  checkEd25519(pkcs8)
  const v0 = concat([ED25519_PKCS8_HEAD, read(items(read(pkcs8).body)[2].body).body])
  try {
    return await subtle.importKey('pkcs8', v0, {name: 'Ed25519'}, false, ['sign'])
  } finally {
    v0.fill(0)
  }
}

// A manifest's signature as its .sig file holds it: base64 of the 64-byte Ed25519 signature of its exact bytes, and a
// newline (remoteit-app keys.mjs signManifest; what connectd device/app_publisher.go verifies).
export async function signManifest(key, manifest, subtle = globalThis.crypto.subtle) {
  return `${b64(new Uint8Array(await subtle.sign({name: 'Ed25519'}, key, manifest)))}\n`
}

// The id of the key in keys ([{keyId, publicKey (base64 of 32 bytes), revoked?}]) whose public half verifies sig over
// manifest, or undefined: how a signer learns the file it was given is a standing key of the publisher's.
export async function verifyingKey(keys, manifest, sig, subtle = globalThis.crypto.subtle) {
  const signature = unb64(String(sig).trim())
  if (signature.length !== 64) return undefined
  for (const k of keys) {
    if (k.revoked) continue
    const raw = unb64(k.publicKey)
    if (raw.length !== 32) continue
    const pub = await subtle.importKey('raw', raw, {name: 'Ed25519'}, false, ['verify'])
    if (await subtle.verify({name: 'Ed25519'}, pub, signature, manifest)) return k.keyId
  }
  return undefined
}

export {KeyFileError}
