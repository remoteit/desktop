/* The messages between the portal and its signer (signer.html; presence-server docs/device-apps-new-app.md, "The
   signer"). The signer is a separate document in a sandboxed frame, the one part of the portal that ever holds a
   publisher's private key: the portal sends it what to do, and gets back only what is public — a public key and its
   id, or a signature. Nothing the portal sends it is secret either. The words it shows come from the portal, in the
   person's language, so the signer carries no catalogue. */

import type { StandingKey } from '../vendor/remoteit-apps/keyfile.mjs'

export type CreateLabels = {
  intro: string
  passphrase: string
  again: string
  create: string
  creating: string
  download: string
  downloaded: string
  mismatch: string
  short: string
  keyId: string
  failed: string
}

export type SignLabels = {
  intro: string
  keyFile: string
  passphrase: string
  sign: string
  signing: string
  app: string
  version: string
  runs: string
  root: string
  restricted: string
  platforms: string
  sha256: string
  notStanding: string
  wrongPassphrase: string
  failed: string
}

export type ToSigner =
  | { type: 'create'; publisher: string; labels: CreateLabels }
  | { type: 'sign'; publisher: string; manifest: Uint8Array; keys: StandingKey[]; labels: SignLabels }

export type FromSigner =
  | { type: 'ready' }
  | { type: 'height'; px: number }
  | { type: 'created'; publicKey: string; keyId: string }
  | { type: 'signed'; signature: string; keyId: string }

// The signer's own answers: never anything else.
export const FROM_SIGNER = ['ready', 'height', 'created', 'signed']
