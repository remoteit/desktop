// Built byte by byte: String.fromCharCode(...bytes) overflows the argument list on a
// multi-KB input such as a WebAuthn attestationObject.
export const toBase64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let out = ''
  for (let i = 0; i < a.length; i++) out += String.fromCharCode(a[i])
  return btoa(out).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const fromBase64url = (s: string): Uint8Array =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

export const decodeBase64url = (s: string): string => new TextDecoder().decode(fromBase64url(s))
