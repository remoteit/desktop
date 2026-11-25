import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material'
import { Gutters } from './Gutters'
import { Notice } from './Notice'
import { SignerFrame, useSignLabels } from './SignerFrame'
import { Built } from '../helpers/appRelease'
import { sha256Hex } from '../helpers/appArchive'
import { publishRelease } from '../services/graphQLAppRelease'
import { SignRequest, Signed, StandingKey } from '../services/releaseSigner'

/* New app's Review and sign (presence-server docs/device-apps-new-app.md): the manifest exactly as it will be signed,
   and its SHA-256; for an app that runs as root, the publisher's explicit word before anything is signed; then the
   signer (components/SignerFrame) with the manifest's bytes and the publisher's standing keys — it gives back a
   signature and nothing else —, and the release published: its files uploaded and set as the private app's stable
   release (services/graphQLAppRelease). A failed step says why, and Try again resumes it with the same signature: the
   files already up are not sent again, and nothing is signed twice. */

type Props = {
  built: Built
  publisher: string
  // The account whose publisher it is, where not the person's own: the release is published as its sign-in.
  account?: string
  keys: StandingKey[]
  onPublished: (result: { manifest: string; devices: number }) => void
  // Whether a signature or a publish is under way: the page holds the release still meanwhile.
  onBusy?: (busy: boolean) => void
}

export const NewAppPublish: React.FC<Props> = ({ built, publisher, account, keys, onPublished, onBusy }) => {
  const { t } = useTranslation()
  const labels = useSignLabels()
  const root = built.manifest.run?.as === 'root'
  const [sha, setSha] = useState<string>()
  const [rootOk, setRootOk] = useState(false)
  const [signing, setSigning] = useState<SignRequest>()
  const [signed, setSigned] = useState<Signed>()
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState<string>()
  const [uploaded, setUploaded] = useState<string[]>([])
  const done = useRef(new Set<string>())
  // A publish answers only the review that started it: one left behind says nothing.
  const mounted = useRef(true)
  useEffect(
    () => () => {
      mounted.current = false
    },
    []
  )
  useEffect(() => onBusy?.(busy || !!signing), [busy, signing, onBusy])

  useEffect(() => {
    sha256Hex(built.bytes).then(setSha)
  }, [built])

  const publish = async (signature: Signed) => {
    setBusy(true)
    setReason(undefined)
    const files = [
      ...built.archives,
      { name: 'manifest.json', data: built.bytes },
      { name: 'manifest.json.sig', data: new TextEncoder().encode(signature.signature) },
    ]
    const result = await publishRelease(
      built.manifest.app,
      built.manifest.version,
      files,
      done.current,
      name => mounted.current && setUploaded(names => [...names, name]),
      undefined,
      account
    )
    if (!mounted.current) return
    setBusy(false)
    if ('reason' in result) return setReason(result.reason || t('newApp.publishFailed', 'That did not go through'))
    onPublished(result.ok)
  }

  return (
    <Box data-new-app-review>
      <Gutters>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t(
            'newApp.reviewIntro',
            'This is the manifest you sign, byte for byte. Devices check its signature, and each file by the SHA-256 it names.'
          )}
        </Typography>
        <Box
          component="pre"
          sx={{ fontSize: 12, overflow: 'auto', maxHeight: 360, margin: 0, padding: 1, bgcolor: 'grayLightest.main' }}
          data-review-manifest
        >
          {built.text}
        </Box>
        <Typography
          variant="caption"
          color="textSecondary"
          component="div"
          sx={{ wordBreak: 'break-all' }}
          data-review-sha
        >
          {t('newApp.manifestSha', 'SHA-256 {{sha}}', { sha: sha ?? '…' })}
        </Typography>
        <Typography variant="caption" color="textSecondary" component="div">
          {t('newApp.reviewFiles', 'Files: {{files}}', { files: built.archives.map(a => a.name).join(', ') || '—' })}
        </Typography>
      </Gutters>
      {root && (
        <Gutters>
          <Notice severity="warning">
            <FormControlLabel
              control={<Checkbox checked={rootOk} onChange={e => setRootOk(e.target.checked)} data-root-ok />}
              label={t(
                'newApp.rootConfirm',
                'I am publishing an app with full control of every device it is added to. Each account that adds it must consent too.'
              )}
            />
          </Notice>
        </Gutters>
      )}
      {reason && (
        <Notice severity="error" gutterBottom onClose={() => setReason(undefined)}>
          <span data-publish-refusal>{reason}</span>
        </Notice>
      )}
      <Gutters>
        {signed ? (
          <Button variant="contained" disabled={busy} onClick={() => publish(signed)} data-publish-again>
            {t('newApp.publishAgain', 'Try again')}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={busy || (root && !rootOk) || !keys.length}
            onClick={() => setSigning({ type: 'sign', publisher, manifest: built.bytes, keys, labels })}
            data-sign-publish
          >
            {t('newApp.signPublish', 'Sign and publish')}
          </Button>
        )}
        {busy && (
          <Typography variant="caption" color="textSecondary" component="div" data-publish-progress>
            {uploaded.length
              ? t('newApp.uploaded', 'Uploaded {{files}}', { files: uploaded.join(', ') })
              : t('newApp.publishing', 'Uploading the release…')}
          </Typography>
        )}
      </Gutters>
      <Dialog open={!!signing} onClose={() => setSigning(undefined)} fullWidth maxWidth="sm" data-sign-dialog>
        <DialogTitle>
          {t('newApp.signTitle', 'Sign {{app}} {{version}}', {
            app: built.manifest.app,
            version: built.manifest.version,
          })}
        </DialogTitle>
        <DialogContent>
          {signing && (
            <SignerFrame
              request={signing}
              onSigned={signature => {
                setSigning(undefined)
                setSigned(signature)
                publish(signature)
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSigning(undefined)}>{t('newApp.cancel', 'Cancel')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
