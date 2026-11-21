import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Button, Stack, Typography } from '@mui/material'
import {
  DESKTOP_PROTOCOL,
  DEVICE_ANDROID_INSTALL_URL,
  DEVICE_DOWNLOADS_URL,
  DEVICE_IOS_INSTALL_URL,
} from '../constants'
import { selectActiveAccountId } from '../selectors/accounts'
import { createDeviceSetupHandoff, isPhoneInstaller } from '../services/deviceOnboarding'

export const DeviceInstaller: React.FC<{ platform: string }> = ({ platform }) => {
  const { t } = useTranslation()
  const phone = isPhoneInstaller(platform)
  const solo = DESKTOP_PROTOCOL === 'remoteit-solo://'
  const accountId = useSelector(selectActiveAccountId)
  const [handoff, setHandoff] = useState<{ accountId: string; handle: string }>()
  useEffect(() => {
    if (phone || !solo || !accountId) return
    let cancelled = false
    createDeviceSetupHandoff(accountId)
      .then(handle => {
        if (!cancelled && handle) setHandoff({ accountId, handle })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [accountId, phone, solo])
  const resume = handoff?.accountId === accountId ? 'setup/' + handoff.handle : ''
  const download = DEVICE_DOWNLOADS_URL + '/installers/'
  const phoneURL = platform === 'ios' ? DEVICE_IOS_INSTALL_URL : DEVICE_ANDROID_INSTALL_URL

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      {phone ? (
        phoneURL ? (
          <Button variant="contained" href={phoneURL}>
            {t('deviceInstaller.getApp', 'Get the app')}
          </Button>
        ) : (
          <Typography color="text.secondary">
            {t('deviceInstaller.mobileUnavailable', 'The app download for this environment is currently unavailable.')}
          </Typography>
        )
      ) : (
        <>
          {platform === 'mac' ? (
            <Button href={download + 'remoteit-device-mac.pkg'} variant="contained">
              {t('deviceInstaller.mac', 'Download for Mac')}
            </Button>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Button href={download + 'remoteit-device-windows-x64.exe'} variant="contained">
                {t('deviceInstaller.windowsX64', 'Download for Windows (x64)')}
              </Button>
              <Button href={download + 'remoteit-device-windows-arm64.exe'} variant="outlined">
                {t('deviceInstaller.windowsArm64', 'Windows (ARM64)')}
              </Button>
            </Stack>
          )}
          <Typography color="text.secondary">
            {t('deviceInstaller.openDownload', 'Open the downloaded installer and follow the prompts.')}
          </Typography>
          {solo && (
            <Button href={DESKTOP_PROTOCOL + 'this-device/' + resume}>
              {t('deviceInstaller.openApp', 'Already installed? Open Remote.It')}
            </Button>
          )}
        </>
      )}
      {(!phone || phoneURL) && (
        <Typography color="text.secondary">
          {t('deviceInstaller.signIn', 'Open Remote.It, sign in, and choose Add this device.')}
        </Typography>
      )}
    </Stack>
  )
}
