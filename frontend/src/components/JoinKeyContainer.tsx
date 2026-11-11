import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { JOIN_KEY_FILE_ENV } from '../constants'
import { JoinKeyKind, joinKeyContainerCommand, joinKeyFileName } from '../helpers/joinKeyFile'
import { CopyCodeBlock } from './CopyCodeBlock'

type Props = {
  kind: JoinKeyKind
  prefix: string // the downloaded file's (helpers/joinKeyFile)
  name: string // the key's, as the file is named
  ephemeral?: boolean // a product's whose devices are new at every start
}

/* How to run the remote.it device as a container with the key just shown (device-package docs/container-image.md): the
   downloaded file mounted read-only and named by REMOTEIT_JOIN_KEY_FILE. The command carries the file's name only, never
   the key, so it is safe to keep in a script. */
export const JoinKeyContainer: React.FC<Props> = ({ kind, prefix, name, ephemeral }) => {
  const { t } = useTranslation()
  const file = joinKeyFileName(prefix, name)
  return (
    <Box marginTop={2} data-join-key-container={kind}>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        {t('joinKeyContainer.title', 'Run it in a container')}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {kind === 'device'
          ? t('joinKeyContainer.device', {
              file,
              env: JOIN_KEY_FILE_ENV,
              defaultValue:
                'Download the key, then run this beside {{file}}. The container reads it from the file named by {{env}} and comes back as this device at every start: it keeps its identity in memory, so it needs no volume.',
            })
          : ephemeral
          ? t('joinKeyContainer.productEphemeral', {
              file,
              env: JOIN_KEY_FILE_ENV,
              defaultValue:
                'Download the key, then run this beside {{file}}. The container reads it from the file named by {{env}}; this product’s devices are new at every start, so it needs no volume.',
            })
          : t('joinKeyContainer.product', {
              file,
              env: JOIN_KEY_FILE_ENV,
              defaultValue:
                'Download the key, then run this beside {{file}}. The container reads it from the file named by {{env}} to register a new device, which keeps its own key in the volume from then on: one volume per device.',
            })}
      </Typography>
      <CopyCodeBlock value={joinKeyContainerCommand(kind, file, ephemeral)} />
    </Box>
  )
}
