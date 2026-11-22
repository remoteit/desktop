import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import { JOIN_KEY_FILE_ENV } from '../constants'
import { JoinKeyKind, joinKeyContainerCommand, joinKeyFileName, selfUpdatable } from '../helpers/joinKeyFile'
import { CopyCodeBlock } from './CopyCodeBlock'
import { ContainerAccessOption } from './ContainerAccessOption'

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
  // Keeping itself up to date needs the volume that keeps the release: a product's device with one (on by default, as
  // the Home Assistant add-on's auto_update); a device join key's container, or an ephemeral product's, has none.
  const canSelfUpdate = selfUpdatable(kind, ephemeral)
  const [selfUpdate, setSelfUpdate] = useState(true)
  const [access, setAccess] = useState(true)
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
      <CopyCodeBlock value={joinKeyContainerCommand(kind, file, ephemeral, canSelfUpdate && selfUpdate, access)} />
      <Box marginBottom={1}>
        <ContainerAccessOption checked={access} onChange={setAccess} />
      </Box>
      <FormControlLabel
        disabled={!canSelfUpdate}
        control={
          <Switch checked={canSelfUpdate && selfUpdate} onChange={event => setSelfUpdate(event.target.checked)} />
        }
        label={t('joinKeyContainer.selfUpdate', 'Keep it updated automatically')}
      />
      <Typography variant="body2" color="textSecondary">
        {!canSelfUpdate
          ? t(
              'joinKeyContainer.selfUpdateNoVolume',
              'Needs a volume to keep each release in, which this container has none of: it is updated by pulling the image again.'
            )
          : selfUpdate
          ? t(
              'joinKeyContainer.selfUpdateOn',
              'It takes each Remote.It release as it comes out, kept in its volume. Pulling a newer image still wins.'
            )
          : t(
              'joinKeyContainer.selfUpdateOff',
              'It is updated by pulling the image again and recreating the container.'
            )}
      </Typography>
    </Box>
  )
}
