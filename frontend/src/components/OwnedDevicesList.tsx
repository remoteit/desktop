import React from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { TargetPlatform } from './TargetPlatform'
import { ColorChip } from './ColorChip'

const SHOWN = 10

export type OwnedDevice = { id: string; name: string; state: string; platform: number }

export type OwnedDevices = { total: number; devices: OwnedDevice[]; thisDeviceOwned: boolean }

export function otherOwnedDevices(owned: OwnedDevices, thisId?: string) {
  const isThis = (device: OwnedDevice) => owned.thisDeviceOwned && device.id === thisId
  const devices = owned.devices
    .filter(device => !isThis(device))
    .sort((a, b) => Number(b.state === 'active') - Number(a.state === 'active'))
    .slice(0, SHOWN)
  const total = owned.total - (owned.thisDeviceOwned ? 1 : 0)
  return { devices, total, more: total - devices.length }
}

export const OwnedDevicesList: React.FC<{ owned: OwnedDevices; thisId?: string }> = ({ owned, thisId }) => {
  const { t } = useTranslation()
  const { devices, more } = otherOwnedDevices(owned, thisId)

  if (!devices.length) return null

  return (
    <>
      <List dense disablePadding>
        {devices.map(device => (
          <ListItem key={device.id} disableGutters>
            <ListItemIcon>
              <TargetPlatform id={device.platform} size="md" tooltip />
            </ListItemIcon>
            <ListItemText primary={device.name} />
            {device.state === 'active' ? (
              <ColorChip label={t('statusChip.online', 'Online')} size="small" color="success" />
            ) : (
              <ColorChip label={t('statusChip.offline', 'Offline')} size="small" color="gray" />
            )}
          </ListItem>
        ))}
      </List>
      {more > 0 && (
        <Typography variant="caption" color="GrayText">
          {t('ownedDevicesList.more', { count: more, defaultValue: 'and {{count}} more' })}
        </Typography>
      )}
    </>
  )
}
