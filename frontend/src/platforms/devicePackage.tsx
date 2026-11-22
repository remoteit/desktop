import React from 'react'
import type { TFunction } from 'i18next'
import {
  DEVICE_CONTAINER_IMAGE,
  DEVICE_CONTAINER_SELF_UPDATE_ENV,
  DEVICE_CONTAINER_STATE,
  DEVICE_DOWNLOADS_URL,
} from '../constants'
import { CONTAINER_ACCESS_FLAGS } from '../helpers/joinKeyFile'
import { IPlatform } from '.'

// The remote.it device package (remoteit-device): one-line installs for Linux, macOS and Windows, from the stage's
// own downloads, behind the device-session gate (useDeviceSessions). Each stage installs into its own instance on the
// machine, so a machine already on another stage joins this one beside it. Beside them, the same device as a Docker
// container (the stage's image) and as the Home Assistant add-on (platforms/home-assistant).
export const DEVICE_PACKAGE_PLATFORMS = ['linux', 'mac', 'windows', 'ios', 'android', 'docker', 'home-assistant']

export const devicePackagePath = (platform: string) => `/add/${platform}?package`

// The container that registers with a code: its key kept in a volume, so it is the same device after it is recreated,
// and — selfUpdate — taking remote.it's releases itself (the image's R3_DEVICE_SELF_UPDATE), which that volume keeps.
// access: an exit and Access, which need the tun device (CONTAINER_ACCESS_FLAGS). name: the device's, else the host's.
export function devicePackageContainerCommand(selfUpdate: boolean, access = true, name?: string): string {
  const lines = ['docker run -d --name remoteit --restart unless-stopped --network host']
  if (access) lines.push(CONTAINER_ACCESS_FLAGS)
  lines.push(`-v remoteit-device:${DEVICE_CONTAINER_STATE}`, '-e R3_REGISTRATION_CODE=[CODE]')
  const deviceName = name?.trim()
  if (deviceName) lines.push(`-e R3_DEVICE_NAME=${shellQuote(deviceName)}`)
  if (selfUpdate) lines.push(`-e ${DEVICE_CONTAINER_SELF_UPDATE_ENV}=1`)
  lines.push(DEVICE_CONTAINER_IMAGE)
  return lines.join(' \\\n  ')
}

const shellQuote = (value: string) => (/^[\w.@%+=:,/-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`)

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
  if (['home-assistant', 'ios', 'android'].includes(platform.id)) return platform
  if (platform.id === 'docker')
    return {
      ...platform,
      hasScreenView: false,
      override: undefined, // PlatformAddPage gives it components/DevicePackageContainer: the self-update switch
      installation: {
        command: devicePackageContainerCommand(true),
        instructions: t(
          'devicePackage.whereDocker',
          'Run it on the machine with Docker. The volume keeps the device the same when you recreate the container.'
        ),
      },
    }
  const where =
    platform.id === 'windows'
      ? t('devicePackage.whereWindows', 'Run it in a PowerShell opened as administrator.')
      : t('devicePackage.whereTerminalPassword', 'Run it in a terminal. It asks for your password to install.')
  return {
    ...platform,
    override: undefined,
    hasScreenView: false,
    installation: {
      command: devicePackageCommand(platform.id),
      instructions: (
        <>
          {where} {t('devicePackage.pageUpdates', 'This page updates when the device comes online.')}
        </>
      ),
    },
  }
}
