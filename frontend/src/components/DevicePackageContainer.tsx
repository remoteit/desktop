import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControlLabel, Switch, Typography } from '@mui/material'
import { IPlatformOverrideProps } from '../platforms'
import { devicePackageContainerCommand } from '../platforms/devicePackage'
import { AddDevice } from './AddDevice'

// The device package's Docker page (platforms/devicePackage.tsx): the container command, with a switch for whether it
// updates itself (on by default, as the Home Assistant add-on's auto_update). The code stays the same as the command
// changes (useAutoRegistration keeps it).
export const DevicePackageContainer: React.FC<IPlatformOverrideProps> = ({
  platform,
  tags,
  serviceTypes,
  oneTimeUse,
}) => {
  const { t } = useTranslation()
  const [selfUpdate, setSelfUpdate] = useState(true)
  const withCommand = useMemo(
    () => ({
      ...platform,
      installation: { ...platform.installation, command: devicePackageContainerCommand(selfUpdate) },
    }),
    [platform, selfUpdate]
  )
  return (
    <>
      <AddDevice platform={withCommand} tags={tags} serviceTypes={serviceTypes} oneTimeUse={oneTimeUse} />
      <FormControlLabel
        sx={{ marginTop: 2 }}
        control={<Switch checked={selfUpdate} onChange={event => setSelfUpdate(event.target.checked)} />}
        label={t('devicePackage.containerSelfUpdate', 'Keep it updated automatically')}
      />
      <Typography variant="body2" color="textSecondary">
        {selfUpdate
          ? t(
              'devicePackage.containerSelfUpdateOn',
              'It takes each remote.it release as it comes out: the new version starts beside the running one and takes over once it works. Pulling a newer image still wins.'
            )
          : t(
              'devicePackage.containerSelfUpdateOff',
              'It is updated by pulling the image again and recreating the container (Compose, Watchtower).'
            )}
      </Typography>
    </>
  )
}
