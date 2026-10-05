import React from 'react'
import type { TFunction } from 'i18next'
import { DEVICE_DOWNLOADS_URL } from '../constants'
import { IPlatform } from '.'

// The remote.it device package (remoteit-device): one-line installs for Linux, macOS and Windows, from the stage's
// own downloads, behind the device-session gate (useDeviceSessions). Each stage installs into its own instance on the
// machine, so a machine already on another stage joins this one beside it.
export const DEVICE_PACKAGE_PLATFORMS = ['linux', 'mac', 'windows']

export const devicePackagePath = (platform: string) => `/add/${platform}?package`

// The command with the registration code in it ([CODE], as every platform's template).
export function devicePackageCommand(platform: string): string {
  return platform === 'windows'
    ? `$env:R3_REGISTRATION_CODE = '[CODE]'; iex (irm ${DEVICE_DOWNLOADS_URL}/install.ps1)`
    : `R3_REGISTRATION_CODE=[CODE] sh -c "$(curl -fsSL ${DEVICE_DOWNLOADS_URL}/install.sh)"`
}

// The platform as the device package installs it: its command in place of the platform's own download or template.
// The id stays the platform's, so the code records its type. The instructions are a node, not catalogue text, so the
// platform's own catalogue translation does not stand in for them.
export function withDevicePackage(platform: IPlatform, t: TFunction): IPlatform {
  const where =
    platform.id === 'windows'
      ? t('devicePackage.whereWindows', 'Run it in a PowerShell opened as administrator.')
      : t('devicePackage.whereTerminal', 'Run it in a terminal; it asks for your password to install.')
  return {
    ...platform,
    override: undefined,
    hasScreenView: false,
    installation: {
      command: devicePackageCommand(platform.id),
      instructions: (
        <>
          {where}{' '}
          {t(
            'devicePackage.joins',
            'A machine already on another remote.it stage keeps it, and joins this one beside it. This page updates when the device registers.'
          )}
        </>
      ),
    },
  }
}
