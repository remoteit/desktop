import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@mui/material'
import { FromSigner } from '../signer/protocol'
import { CreateRequest, Created, isCreated, isSigned, SignRequest, Signed, signerUrl } from '../services/releaseSigner'

/* The key file signer (services/releaseSigner): signer.html in a frame sandboxed without allow-same-origin, so it runs
   at an opaque origin — the portal's scripts, its own and the third parties its policy allows, cannot reach the key
   file, the passphrase or the key it holds, and it cannot reach theirs. The person picks the file and types the
   passphrase in the frame itself. The frame is told what to do once it says it is ready, and only its own window's
   answers are taken, in the shape they must have. Unmounting the frame ends the document, and everything it held. */
type Props =
  | { request: CreateRequest; onCreated: (created: Created) => void; onSigned?: never }
  | { request: SignRequest; onSigned: (signed: Signed) => void; onCreated?: never }

export const SignerFrame: React.FC<Props> = ({ request, onCreated, onSigned }) => {
  const { t } = useTranslation()
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(180)
  const answered = useRef({ onCreated, onSigned })
  answered.current = { onCreated, onSigned }

  useEffect(() => {
    const listen = (event: MessageEvent) => {
      const window = frame.current?.contentWindow
      if (!window || event.source !== window) return
      const message = event.data as FromSigner
      if (message?.type === 'ready') window.postMessage(request, '*')
      else if (message?.type === 'height') setHeight(Math.min(Math.max(Number(message.px) || 0, 80), 900))
      else if (message?.type === 'created' && request.type === 'create' && isCreated(message))
        answered.current.onCreated?.({ publicKey: message.publicKey, keyId: message.keyId })
      else if (message?.type === 'signed' && request.type === 'sign' && isSigned(message))
        answered.current.onSigned?.({ signature: message.signature, keyId: message.keyId })
    }
    window.addEventListener('message', listen)
    return () => window.removeEventListener('message', listen)
  }, [request])

  return (
    <Box
      component="iframe"
      ref={frame}
      src={signerUrl()}
      sandbox="allow-scripts allow-downloads"
      referrerPolicy="no-referrer"
      title={t('signer.title', 'Your key, in a separate secure frame')}
      data-signer-frame={request.type}
      sx={{ border: 0, width: '100%', height, display: 'block' }}
    />
  )
}

// The signer's words, in the person's language: it carries no catalogue of its own.
export function useCreateLabels(): CreateRequest['labels'] {
  const { t } = useTranslation()
  return {
    intro: t(
      'signer.createIntro',
      'Choose a passphrase for your new key. The key is made here, in your browser, and saved to a file encrypted with this passphrase. remote.it never sees the key or the passphrase, and cannot recover either.'
    ),
    passphrase: t('signer.passphrase', 'Passphrase (at least 12 characters)'),
    again: t('signer.again', 'Passphrase again'),
    create: t('signer.create', 'Create key'),
    creating: t('signer.creating', 'Making and encrypting the key…'),
    download: t('signer.download', 'Download key file'),
    downloaded: t('signer.downloaded', 'Saved. Keep the file and its passphrase somewhere safe.'),
    mismatch: t('signer.mismatch', 'The two passphrases differ.'),
    short: t('signer.short', 'A passphrase of at least 12 characters.'),
    keyId: t('signer.keyId', 'Key id'),
    failed: t(
      'signer.createFailed',
      'The key could not be made in this browser. Try a current Chrome, Edge, Firefox or Safari, or the publishing tool.'
    ),
  }
}

export function useSignLabels(): SignRequest['labels'] {
  const { t } = useTranslation()
  return {
    intro: t(
      'signer.signIntro',
      'Choose your key file and type its passphrase. They are used here, in your browser, and never sent to remote.it.'
    ),
    keyFile: t('signer.keyFile', 'Key file'),
    passphrase: t('signer.signPassphrase', 'Passphrase'),
    sign: t('signer.sign', 'Sign'),
    signing: t('signer.signing', 'Signing…'),
    app: t('signer.app', 'App'),
    version: t('signer.version', 'Version'),
    runs: t('signer.runs', 'Runs'),
    root: t('signer.root', 'as root: full control of the device'),
    restricted: t('signer.restricted', 'restricted'),
    platforms: t('signer.platforms', 'Platforms'),
    sha256: t('signer.sha256', 'SHA-256'),
    notStanding: t(
      'signer.notStanding',
      'This key is not one of your publisher’s registered keys, or it was revoked. Choose another key file.'
    ),
    wrongPassphrase: t('signer.wrongPassphrase', 'Wrong passphrase, or not a key file.'),
    failed: t(
      'signer.signFailed',
      'The release could not be signed in this browser. Try a current Chrome, Edge, Firefox or Safari, or the publishing tool.'
    ),
  }
}
