import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { IPlatformOverrideProps } from '../platforms'
import { devicePackageContainerCommand } from '../platforms/devicePackage'
import { ContainerAccessOption } from './ContainerAccessOption'
import { AddDevice } from './AddDevice'

const NAME_SETTLE_MS = 500

// The device package's Docker page (platforms/devicePackage.tsx): the container command, with its name, whether it can be
// an exit and use Access, and whether it updates itself (on by default, as the Home Assistant add-on's auto_update). The
// code stays the same as the command changes (useAutoRegistration keeps it).
export const DevicePackageContainer: React.FC<IPlatformOverrideProps> = ({
  platform,
  tags,
  serviceTypes,
  oneTimeUse,
}) => {
  const { t } = useTranslation()
  const [selfUpdate, setSelfUpdate] = useState(true)
  const [access, setAccess] = useState(true)
  const [nameText, setNameText] = useState('')
  const [name, setName] = useState('')

  // Each change of the command asks graphql for it again: the name once typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => setName(nameText), NAME_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [nameText])

  const withCommand = useMemo(
    () => ({
      ...platform,
      installation: { ...platform.installation, command: devicePackageContainerCommand(selfUpdate, access, name) },
    }),
    [platform, selfUpdate, access, name]
  )
  return (
    <>
      <TextField
        label={t('devicePackage.containerName', 'Device name')}
        placeholder={t('devicePackage.containerNameHint', 'The host name if left empty')}
        value={nameText}
        onChange={event => setNameText(event.target.value.slice(0, 64))}
        size="small"
        variant="filled"
        sx={{ marginBottom: 3, width: { xs: '100%', sm: 360 } }}
        InputLabelProps={{ shrink: true }}
        inputProps={{ 'data-testid': 'container-name' }}
      />
      <AddDevice platform={withCommand} tags={tags} serviceTypes={serviceTypes} oneTimeUse={oneTimeUse} />
      <Box sx={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ContainerAccessOption checked={access} onChange={setAccess} />
        <Box>
          <FormControlLabel
            control={<Switch checked={selfUpdate} onChange={event => setSelfUpdate(event.target.checked)} />}
            label={t('devicePackage.containerSelfUpdate', 'Keep it updated automatically')}
          />
          <Typography variant="body2" color="textSecondary">
            {selfUpdate
              ? t(
                  'devicePackage.containerUpdatesItself',
                  'It installs each Remote.It release as it comes out. Pulling a newer image still wins.'
                )
              : t(
                  'devicePackage.containerUpdatesByImage',
                  'You update it by pulling the image again and recreating the container.'
                )}
          </Typography>
        </Box>
      </Box>
    </>
  )
}
