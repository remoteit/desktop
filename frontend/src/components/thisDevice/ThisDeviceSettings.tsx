import React from 'react'
import { Divider } from '@mui/material'
import { ThisDeviceModel } from './model'
import { Card } from './shared'
import { LinkRow } from './ThisDeviceMain'

/* This device's Settings (pages/ThisDevicePage.tsx, /this-device/settings): the one way from the home to what is read
   or changed seldom — Details, Advanced where it has anything, and the device's page in the account, signed in. */
export const ThisDeviceSettings: React.FC<{ m: ThisDeviceModel; signedIn: boolean }> = ({ m, signedIn }) => {
  const { t, has, status, kind } = m
  const d = status?.device
  if (!has('status') || !status) return null
  const advanced =
    (has('settings') && m.listed.length > 0) ||
    has('permissions') ||
    (has('logging') && !!m.logging) ||
    has('diagnostics') ||
    (has('app') && !!m.app?.openAtLogin) ||
    (has('remove') && !!d?.removal) ||
    (has('ssh') && !!status.ssh) ||
    (has('exitNode') && !!status.exitNode)
  const page = signedIn && !!d?.uid
  return (
    <Card section="settings-links">
      <LinkRow
        link="details"
        href="#/this-device/details"
        icon="info-circle"
        primary={t('thisDevice.details', 'Details')}
        secondary={t('thisDevice.detailsLine', 'Address, versions and what this {{kind}} shares', { kind })}
      />
      {advanced && <Divider component="li" />}
      {advanced && (
        <LinkRow
          link="advanced"
          href="#/this-device/advanced"
          icon="cog"
          primary={t('thisDevice.advanced', 'Advanced')}
          secondary={t('thisDevice.advancedLine', 'Relay, permissions, diagnostics and removal')}
        />
      )}
      {page && <Divider component="li" />}
      {page && (
        <LinkRow
          link="device-page"
          href={`#/devices/${d!.uid}`}
          icon="hdd"
          primary={t('thisDevice.devicePage', 'Device page')}
          secondary={t('thisDevice.devicePageLine', 'Services, sharing and activity for {{name}}', { name: d!.name })}
        />
      )}
    </Card>
  )
}
