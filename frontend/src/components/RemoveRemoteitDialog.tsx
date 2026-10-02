import React from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, Typography } from '@mui/material'
import { OwnedDevices } from '../hooks/useOwnedDevices'
import { OwnedDevicesList } from './OwnedDevicesList'
import { CopyCodeBlock } from './CopyCodeBlock'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Link } from './Link'

const UNINSTALL_SUPPORT_URL = 'https://support.remote.it/hc/en-us/articles/360054866351'

type Props = {
  open: boolean
  owned?: OwnedDevices
  onClose: () => void
}

export const RemoveRemoteitDialog: React.FC<Props> = ({ open, owned, onClose }) => {
  const { t } = useTranslation()
  const desktopApps = [
    {
      label: t('removeRemoteitDialog.desktopMacLinux', 'Desktop app on macOS or Linux'),
      steps: t('removeRemoteitDialog.desktopMacLinuxSteps', 'Open Settings, then Advanced, and select Uninstall.'),
    },
    {
      label: t('removeRemoteitDialog.desktopWindows', 'Desktop app on Windows'),
      steps: t('removeRemoteitDialog.desktopWindowsSteps', 'Uninstall Remote.It from Windows Settings, under Apps.'),
    },
  ]

  return (
    <Confirm
      open={open}
      maxWidth="sm"
      title={t('removeRemoteitDialog.title', 'Remove Remote.It from your devices')}
      action={t('common.done', 'Done')}
      onConfirm={onClose}
    >
      <Typography variant="body2" gutterBottom>
        {t(
          'removeRemoteitDialog.intro',
          "Deleting your account doesn't uninstall Remote.It. Remove it from each device you own before you delete your account."
        )}
      </Typography>
      <Notice severity="warning" fullWidth gutterTop gutterBottom>
        {t(
          'removeRemoteitDialog.localAccess',
          'Uninstall from the device itself or over your local network. Removing Remote.It through a Remote.It connection ends that connection right away.'
        )}
      </Notice>
      <Stack gap={1} marginY={2}>
        <CopyCodeBlock
          label={t('removeRemoteitDialog.debian', 'Raspberry Pi, Ubuntu and other Debian Linux')}
          value="sudo nohup apt -y purge remoteit"
        />
        <CopyCodeBlock label={t('removeRemoteitDialog.openwrt', 'OpenWrt')} value="opkg remove remoteit" />
      </Stack>
      {desktopApps.map(({ label, steps }) => (
        <Typography key={label} variant="body2" gutterBottom>
          <b>{label}</b>
          {' — '}
          {steps}
        </Typography>
      ))}
      <Typography variant="body2" gutterBottom>
        <Link href={UNINSTALL_SUPPORT_URL}>
          {t('removeRemoteitDialog.otherDevices', 'Instructions for other devices')}
        </Link>
      </Typography>
      {owned && (
        <OwnedDevicesList
          owned={owned}
          title={count => t('removeRemoteitDialog.yourDevices', { count, defaultValue: 'Your devices ({{count}})' })}
        />
      )}
    </Confirm>
  )
}
