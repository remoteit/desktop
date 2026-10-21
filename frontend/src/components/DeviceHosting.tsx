import React from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemText, Typography } from '@mui/material'
import { HostedByLine } from './HostedBy'
import { StatusChip } from './StatusChip'

/* A virtual device's Details: where it is reached, in place of a daemon's report (DeviceAbout). Its gateway, the
   address its services default to, and the address its .local name last resolved to. */

export const DeviceHosting: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  return (
    <>
      <Typography variant="subtitle1">{t('deviceHosting.title', 'Hosting')}</Typography>
      <List dense disablePadding>
        <ListItem disableGutters secondaryAction={<StatusChip device={device} />}>
          <ListItemText
            primary={<HostedByLine device={device} link />}
            secondary={t('deviceHosting.gateway', 'Gateway')}
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primary={<Typography fontFamily="monospace">{device.host || '–'}</Typography>}
            secondary={t('deviceHosting.address', 'Address')}
          />
        </ListItem>
        {device.lastAddress && device.lastAddress !== device.host && (
          <ListItem disableGutters>
            <ListItemText
              primary={<Typography fontFamily="monospace">{device.lastAddress}</Typography>}
              secondary={t('deviceHosting.lastAddress', 'Last resolved address')}
            />
          </ListItem>
        )}
      </List>
    </>
  )
}
