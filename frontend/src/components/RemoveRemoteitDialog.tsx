import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { OwnedDevices, OwnedDevicesList, otherOwnedDevices } from './OwnedDevicesList'
import { CopyCodeBlock } from './CopyCodeBlock'
import { Notice } from './Notice'
import { Link } from './Link'

const UNINSTALL_SUPPORT_URL = 'https://support.remote.it/hc/en-us/articles/360054866351'

type Props = {
  open: boolean
  owned?: OwnedDevices
  thisId?: string
  onClose: () => void
}

export const RemoveRemoteitDialog: React.FC<Props> = ({ open, owned, thisId, onClose }) => {
  const { t } = useTranslation()
  const others = owned && otherOwnedDevices(owned, thisId)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('removeRemoteitDialog.title', 'Remove Remote.It from your devices')}</DialogTitle>
      <DialogContent>
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
        <Typography variant="body2" gutterBottom>
          <b>{t('removeRemoteitDialog.desktopMacLinux', 'Desktop app on macOS or Linux')}</b>
          {' — '}
          {t('removeRemoteitDialog.desktopMacLinuxSteps', 'Open Settings, then Advanced, and select Uninstall.')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <b>{t('removeRemoteitDialog.desktopWindows', 'Desktop app on Windows')}</b>
          {' — '}
          {t('removeRemoteitDialog.desktopWindowsSteps', 'Uninstall Remote.It from Windows Settings, under Apps.')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <Link href={UNINSTALL_SUPPORT_URL}>
            {t('removeRemoteitDialog.otherDevices', 'Instructions for other devices')}
          </Link>
        </Typography>
        {owned?.thisDeviceOwned && thisId && (
          <Notice severity="info" fullWidth gutterTop>
            {t(
              'removeRemoteitDialog.thisDevice',
              'This device is unregistered automatically when you delete your account.'
            )}
          </Notice>
        )}
        {owned && others && others.devices.length > 0 && (
          <>
            <Typography variant="h5" marginTop={3}>
              {t('removeRemoteitDialog.yourDevices', { count: others.total, defaultValue: 'Your devices ({{count}})' })}
            </Typography>
            <OwnedDevicesList owned={owned} thisId={thisId} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('common.done', 'Done')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
