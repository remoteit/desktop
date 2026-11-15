import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getApplicationType } from '@common/applications'

// ScreenView as an app (device apps build step 9): the old install path is gone from the portal — no installApp or
// removeApp when a service is added or removed, no supportedAppInstalls asked —, and type 48 is a service added by hand
// only on Android, whose ScreenView app is its own. Everywhere else it is remoteit.screenview in the device's Apps.
describe('ScreenView: an app, not an install', () => {
  it('type 48 is offered as a service to add only on Android (1213)', () => {
    const screenview = getApplicationType(48)
    expect(screenview.visibility({ targetPlatform: 1213 } as IDevice)).toBe(true)
    expect(screenview.visibility({ targetPlatform: 1072 } as IDevice)).toBe(false)
    expect(screenview.visibility({ targetPlatform: 5 } as IDevice)).toBe(false)
    expect(screenview.visibility(undefined)).toBe(false)
  })

  it('no installApp, removeApp or supportedAppInstalls is asked for', () => {
    for (const file of ['services/graphQLMutation.ts', 'services/graphQLDevice.ts', 'models/devices.ts']) {
      const source = readFileSync(join(__dirname, '..', file), 'utf8')
      expect(source).not.toMatch(/installApp|removeApp\b|supportedAppInstalls|graphQLInstallApp|graphQLRemoveApp\(/)
    }
  })
})
