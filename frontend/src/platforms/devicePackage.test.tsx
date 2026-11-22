import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import {
  DEVICE_PACKAGE_PLATFORMS,
  devicePackageCommand,
  devicePackageContainerCommand,
  devicePackagePath,
  withDevicePackage,
} from './devicePackage'
import { DEVICE_DOWNLOADS_URL } from '../constants'
import { IPlatform } from '.'

const t = ((_key: string, fallback: string) => fallback) as unknown as TFunction

describe('device package installs', () => {
  it('gives the stage downloads one-line install, with the code, for each platform', () => {
    expect(devicePackageCommand('linux')).toBe(
      `R3_REGISTRATION_CODE=[CODE] sh -c "$(curl -fsSL ${DEVICE_DOWNLOADS_URL}/install.sh)"`
    )
    expect(devicePackageCommand('mac')).toBe(devicePackageCommand('linux'))
    expect(devicePackageCommand('windows')).toBe(
      `$env:R3_REGISTRATION_CODE = '[CODE]'; iex (irm ${DEVICE_DOWNLOADS_URL}/install.ps1)`
    )
    expect(devicePackageCommand('windows').replace('[CODE]', 'ABC-123')).toContain("'ABC-123'")
    expect(devicePackagePath('mac')).toBe('/add/mac?package')
  })

  it('turns a download platform into a command one, keeping its id for the registration type', () => {
    const mac = {
      id: 'mac',
      name: 'Mac',
      override: () => null,
      hasScreenView: true,
      installation: { download: true, description: 'For macOS systems.' },
    } as unknown as IPlatform
    const p = withDevicePackage(mac, t)
    expect(p.id).toBe('mac')
    expect(p.override).toBeUndefined()
    expect(p.hasScreenView).toBe(false)
    expect(p.installation?.download).toBeUndefined()
    expect(p.installation?.command).toBe(devicePackageCommand('mac'))
    expect(p.installation?.description).toBeUndefined()
  })

  it('offers desktop, phone, and container setup', () => {
    expect(DEVICE_PACKAGE_PLATFORMS).toEqual(['linux', 'mac', 'windows', 'ios', 'android', 'docker', 'home-assistant'])
  })

  it("Docker's command keeps the device in a volume and, on by default, updates itself", () => {
    const on = devicePackageContainerCommand(true).split(' \\\n  ')
    expect(on).toEqual([
      'docker run -d --name remoteit --restart unless-stopped --network host',
      '--cap-add NET_ADMIN --device /dev/net/tun',
      '-v remoteit-device:/var/lib/remoteit-device',
      '-e R3_REGISTRATION_CODE=[CODE]',
      '-e R3_DEVICE_SELF_UPDATE=1',
      'remoteit/device',
    ])
    expect(devicePackageContainerCommand(false)).not.toContain('R3_DEVICE_SELF_UPDATE')
    expect(devicePackageCommand('docker')).toBe(devicePackageContainerCommand(true))
    const docker = withDevicePackage({ id: 'docker', name: 'Docker', installation: {} } as unknown as IPlatform, t)
    expect(docker.id).toBe('docker') // its code's type: Docker Container
    expect(docker.override).toBeUndefined() // PlatformAddPage gives it the page with the self-update switch
    expect(docker.installation?.command).toBe(devicePackageContainerCommand(true))
  })

  it("Docker's command, on by default, lets the device be an exit and use Access; off, it leaves the flags out", () => {
    expect(devicePackageCommand('docker')).toContain('--cap-add NET_ADMIN --device /dev/net/tun')
    const off = devicePackageContainerCommand(true, false)
    expect(off).not.toContain('NET_ADMIN')
    expect(off).not.toContain('/dev/net/tun')
    expect(off.split(' \\\n  ')).toEqual([
      'docker run -d --name remoteit --restart unless-stopped --network host',
      '-v remoteit-device:/var/lib/remoteit-device',
      '-e R3_REGISTRATION_CODE=[CODE]',
      '-e R3_DEVICE_SELF_UPDATE=1',
      'remoteit/device',
    ])
  })

  it("Docker's command names the device when given a name, quoted for the shell; blank leaves it to the host's", () => {
    const lines = (name?: string) => devicePackageContainerCommand(false, true, name).split(' \\\n  ')
    expect(lines('kitchen-pi')).toContain('-e R3_DEVICE_NAME=kitchen-pi')
    expect(lines('Kitchen Pi')).toContain("-e R3_DEVICE_NAME='Kitchen Pi'")
    expect(lines("Bob's Pi")).toContain("-e R3_DEVICE_NAME='Bob'\\''s Pi'")
    expect(lines('  ').join(' ')).not.toContain('R3_DEVICE_NAME')
    expect(lines().join(' ')).not.toContain('R3_DEVICE_NAME')
  })

  it('Home Assistant keeps its own page: the code, pasted into the add-on', () => {
    const ha = {
      id: 'home-assistant',
      name: 'Home Assistant',
      installation: { command: '[CODE]' },
    } as unknown as IPlatform
    expect(withDevicePackage(ha, t)).toBe(ha)
  })
})
