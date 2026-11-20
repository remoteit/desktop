import type { CreateLabels, SignLabels } from '../signer/protocol'

/* Who signs a publisher's release for the portal (presence-server docs/device-apps-new-app.md, "The signer"). Today one
   kind: the key file the publisher holds, opened in the portal's signer — signer.html in a sandboxed frame
   (components/SignerFrame), the one document that ever holds the key. The desktop app may later keep the key in the
   OS keychain and sign over IPC (a "keychain" signer): it answers the same requests with the same results, so the
   pages that ask (Create key, New app's Review and sign) do not change. What any signer gives back is public. */

export type StandingKey = { keyId: string; publicKey: string; revoked?: string | null }

export type CreateRequest = { type: 'create'; publisher: string; labels: CreateLabels }
export type SignRequest = {
  type: 'sign'
  publisher: string
  manifest: Uint8Array
  keys: StandingKey[]
  labels: SignLabels
}

// A new key: its public half (base64 of 32 bytes, what addAppPublisherKey takes) and its id. The private half stays
// with the signer: a file the person downloaded, or a keychain entry.
export type Created = { publicKey: string; keyId: string }
// The manifest's .sig text (base64 of the Ed25519 signature of its exact bytes, and a newline) and the standing key
// that made it.
export type Signed = { signature: string; keyId: string }

export interface ReleaseSigner {
  kind: 'file' | 'keychain'
  available(): Promise<boolean>
  create?(request: CreateRequest): Promise<Created>
  sign(request: SignRequest): Promise<Signed>
}

// The signer's document, beside index.html wherever the portal is served from (the build's base: / on the web, ./ in
// the embedded builds).
export const signerUrl = () => `${import.meta.env.BASE_URL ?? '/'}signer.html`

// A signer's answer is taken only in the shape it must have: base64 of a 32-byte key, 16 hex of id, base64 of a
// 64-byte signature and a newline.
export const isCreated = (m: any): m is Created =>
  typeof m?.publicKey === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(m.publicKey) && /^[0-9a-f]{16}$/.test(m?.keyId)
export const isSigned = (m: any): m is Signed =>
  typeof m?.signature === 'string' && /^[A-Za-z0-9+/]{86}==\n$/.test(m.signature) && /^[0-9a-f]{16}$/.test(m?.keyId)
