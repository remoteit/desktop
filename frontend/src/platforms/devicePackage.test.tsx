import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { devicePackageCommand, devicePackagePath, withDevicePackage } from './devicePackage'
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
})
