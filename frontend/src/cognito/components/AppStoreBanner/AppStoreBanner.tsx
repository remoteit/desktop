import { Box, IconButton } from '@mui/material'
import { useTranslation } from 'react-i18next'
import cookies from 'js-cookie'
import React, { useState } from 'react'
import { Icon } from '../../../components/Icon'
import { AndroidBadge } from './AndroidBadge'
import { IOSBadge } from './IOSBadge'

type OS = 'unknown' | 'iOS' | 'Android'
const UNKNOWN: OS = 'unknown'
const IOS: OS = 'iOS'
const ANDROID: OS = 'Android'
export const HIDE_APP_BADGE_COOKIE = 'remoteit.hide-app-badge'

export function AppStoreBanner(): JSX.Element {
  const [hidden, setHidden] = useState(isAppBannerHidden())
  const { t } = useTranslation()

  // Return nothing if they've opted to close the banner
  if (hidden) return <></>

  const os = getMobileOperatingSystem()

  return (
    <Box
      alignItems="center"
      bgcolor="gray"
      color="white"
      display="flex"
      flexWrap="wrap"
      position="relative"
      px={5}
      py={2}
    >
      <Box mr={8}>
        {t('app-store-banner.connect')}
        {os === UNKNOWN && t('app-store-banner.unknown-os')}
      </Box>
      <Box ml="auto" mr={8}>
        {os === IOS && <IOSBadge />}
        {os === ANDROID && <AndroidBadge />}
        {os === UNKNOWN && (
          <>
            <Box component="span" mr={1}>
              <IOSBadge />
            </Box>
            <AndroidBadge />
          </>
        )}
      </Box>
      <IconButton
        onClick={() => {
          setHidden(true)
          rememberToHideAppBadge()
        }}
      >
        <Icon color="white" name="times" title="Close" />
      </IconButton>
    </Box>
  )
}

function getMobileOperatingSystem(): OS {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  if (!userAgent) return UNKNOWN

  if (/android/i.test(userAgent)) {
    return ANDROID
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return IOS
  }

  return UNKNOWN
}

function isAppBannerHidden(): boolean {
  return cookies.get(HIDE_APP_BADGE_COOKIE) === 'true'
}

function rememberToHideAppBadge(): void {
  cookies.set(HIDE_APP_BADGE_COOKIE, 'true', { expires: 3650 })
}
