import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Typography } from '@mui/material'
import { JOIN_KEY_ENV, JOIN_KEY_FILE_ENV } from '../constants'
import { downloadJoinKey } from '../helpers/joinKeyFile'
import { CopyCodeBlock } from './CopyCodeBlock'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  name: string // the key's, or its device's: what the copy is labelled and the file named
  joinKey: string
  children?: React.ReactNode // where it goes, where that is particular: "install it on the copy and restart it"
}

/* A device join key, shown this once (graphql-api docs/PROXY-GROUPS.md §11, "Externally held identity"): the key, and
   the line that gives it to the device — the join key setting a product's key goes in; the daemon tells the two apart
   by the key's prefix. The dialog showing it keeps it in its own state alone, and only Done closes it. */
export const DeviceJoinKeyOnce: React.FC<Props> = ({ name, joinKey, children }) => {
  const { t } = useTranslation()
  return (
    <>
      <Notice severity="warning" fullWidth gutterBottom>
        <strong>{t('deviceJoinKeyOnce.title', 'Copy or download this key now')}</strong>
        <em>
          {t(
            'deviceJoinKeyOnce.body',
            'It will not be shown again: remote.it keeps only its public half. If it is lost, revoke it and issue another.'
          )}
        </em>
      </Notice>
      {children && (
        <Typography variant="body2" fontWeight={500} gutterBottom>
          {children}
        </Typography>
      )}
      <CopyCodeBlock label={name} value={joinKey} sx={{ marginBottom: 2 }} />
      <CopyCodeBlock
        label={t('deviceJoinKeyOnce.line', 'Install line')}
        value={`${JOIN_KEY_ENV}=${joinKey}`}
        sx={{ marginBottom: 2 }}
      />
      <Typography variant="body2" color="textSecondary">
        {t('deviceJoinKeyOnce.use', {
          env: JOIN_KEY_ENV,
          file: JOIN_KEY_FILE_ENV,
          defaultValue:
            'Give it to the device at every boot as {{env}}, or in a file named by {{file}}: from a secret store, a USB stick, or an image built for this device. It then comes back as itself — the same ID, settings, access and history — with new session keys each boot.',
        })}
      </Typography>
    </>
  )
}

// The key as a file, for REMOTEIT_JOIN_KEY_FILE.
export const DownloadJoinKeyButton: React.FC<{ name: string; joinKey: string }> = ({ name, joinKey }) => {
  const { t } = useTranslation()
  return (
    <Button onClick={() => downloadJoinKey('remoteit-device-join-key', name, joinKey)}>
      <Icon name="download" inlineLeft />
      {t('deviceJoinKeyOnce.download', 'Download')}
    </Button>
  )
}
