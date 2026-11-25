import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { OwnedDevices } from '../hooks/useOwnedDevices'
import { TargetPlatform } from './TargetPlatform'
import { StatusChip } from './StatusChip'
import { Notice } from './Notice'

type Props = { owned: OwnedDevices; title: (count: number) => string }

export const OwnedDevicesList: React.FC<Props> = ({ owned, title }) => {
  const { t } = useTranslation()
  const more = owned.total - owned.devices.length

  return (
    <>
      {owned.devices.length > 0 && (
        <Box marginTop={2}>
          <Typography variant="h5">{title(owned.total)}</Typography>
          <List dense disablePadding>
            {owned.devices.map(device => (
              <ListItem key={device.id} disableGutters>
                <ListItemIcon>
                  <TargetPlatform id={device.platform} size="md" tooltip />
                </ListItemIcon>
                <ListItemText primary={device.name} />
                <StatusChip device={{ state: device.state, services: [] } as unknown as IDevice} />
              </ListItem>
            ))}
          </List>
          {more > 0 && (
            <Typography variant="caption" color="GrayText">
              {t('ownedDevicesList.more', { count: more, defaultValue: 'and {{count}} more' })}
            </Typography>
          )}
        </Box>
      )}
      {owned.thisDeviceOwned && (
        <Notice severity="info" fullWidth gutterTop>
          {t('ownedDevicesList.thisDevice', 'This device is unregistered automatically when you delete your account.')}
        </Notice>
      )}
    </>
  )
}
