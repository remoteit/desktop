import React from 'react'
import type { TFunction } from 'i18next'
import {
  DEVICE_CONTAINER_IMAGE,
  DEVICE_CONTAINER_SELF_UPDATE_ENV,
  DEVICE_CONTAINER_STATE,
  DEVICE_DOWNLOADS_URL,
} from '../constants'
import { IPlatform } from '.'

// The remote.it device package (remoteit-device): one-line installs for Linux, macOS and Windows, from the stage's
// own downloads, behind the device-session gate (useDeviceSessions). Each stage installs into its own instance on the
// machine, so a machine already on another stage joins this one beside it. Beside them, the same device as a Docker
// container (the stage's image) and as the Home Assistant add-on (platforms/home-assistant).
export const DEVICE_PACKAGE_PLATFORMS = ['linux', 'mac', 'windows', 'docker', 'home-assistant']

export const devicePackagePath = (platform: string) => `/add/${platform}?package`

// The container that registers with a code: its key kept in a volume, so it is the same device after it is recreated,
// and — selfUpdate — taking remote.it's releases itself (the image's R3_DEVICE_SELF_UPDATE), which that volume keeps.
export function devicePackageContainerCommand(selfUpdate: boolean): string {
  const lines = [
    'docker run -d --name remoteit --restart unless-stopped --network host',
    `-v remoteit-device:${DEVICE_CONTAINER_STATE}`,
    '-e R3_REGISTRATION_CODE=[CODE]',
  ]
  if (selfUpdate) lines.push(`-e ${DEVICE_CONTAINER_SELF_UPDATE_ENV}=1`)
  lines.push(DEVICE_CONTAINER_IMAGE)
  return lines.join(' \\\n  ')
}

// The command with the registration code in it ([CODE], as every platform's template).
export function devicePackageCommand(platform: string, selfUpdate = true): string {
  if (platform === 'docker') return devicePackageContainerCommand(selfUpdate)
  return platform === 'windows'
    ? `$env:R3_REGISTRATION_CODE = '[CODE]'; iex (irm ${DEVICE_DOWNLOADS_URL}/install.ps1)`
    : `R3_REGISTRATION_CODE=[CODE] sh -c "$(curl -fsSL ${DEVICE_DOWNLOADS_URL}/install.sh)"`
}

// The platform as the device package installs it: its command in place of the platform's own download or template.
// The id stays the platform's, so the code records its type. The instructions are a node, not catalogue text, so the
// platform's own catalogue translation does not stand in for them. Home Assistant's add-on brings its own page.
export function withDevicePackage(platform: IPlatform, t: TFunction): IPlatform {
  if (platform.id === 'home-assistant') return platform
  if (platform.id === 'docker')
    return {
      ...platform,
      hasScreenView: false,
      override: undefined, // PlatformAddPage gives it components/DevicePackageContainer: the self-update switch
      installation: {
        command: devicePackageContainerCommand(true),
        instructions: t(
          'devicePackage.whereContainer',
          'Run it where Docker runs; the volume keeps the device, so it stays the same device when the container is recreated. This page updates when the device registers.'
        ),
      },
    }
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
