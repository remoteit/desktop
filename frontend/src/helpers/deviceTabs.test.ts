import { describe, it, expect } from 'vitest'
import { deviceTabs, legacyTarget, LEGACY_PAGES } from './deviceTabs'

const MANAGER = { virtual: false, permissions: ['VIEW', 'MANAGE'] as IPermission[] }
const VIEWER = { virtual: false, permissions: ['VIEW', 'CONNECT'] as IPermission[] }
const VIRTUAL = { virtual: true, permissions: ['VIEW', 'MANAGE'] as IPermission[] }

describe('deviceTabs', () => {
  it('an ordinary device: five tabs, no Exit', () => {
    expect(deviceTabs(MANAGER, false)).toEqual(['overview', 'services', 'sharing', 'settings', 'activity'])
  })

  it('Exit only on a device that carries an exit or a proxy', () => {
    expect(deviceTabs(MANAGER, true)).toEqual(['overview', 'services', 'sharing', 'settings', 'activity', 'exit'])
    expect(deviceTabs(MANAGER, undefined)).not.toContain('exit')
  })

  it('a virtual device never shows Exit', () => {
    expect(deviceTabs(VIRTUAL, true)).toEqual(['overview', 'services', 'sharing', 'settings', 'activity'])
  })

  it('Sharing only for someone who manages the device', () => {
    expect(deviceTabs(VIEWER, false)).toEqual(['overview', 'services', 'settings', 'activity'])
  })
})

describe('legacyTarget', () => {
  it('sends each old address to its tab and section', () => {
    expect(legacyTarget('details', false)).toBe('overview')
    expect(legacyTarget('edit', false)).toBe('settings')
    expect(legacyTarget('users', false)).toBe('sharing')
    expect(legacyTarget('logs', false)).toBe('activity')
    expect(legacyTarget('agent', false)).toBe('settings/agent')
  })

  it('runs and exit flows go to Exit on a device that carries one', () => {
    expect(legacyTarget('runs', true)).toBe('exit')
    expect(legacyTarget('exit-flows', true)).toBe('exit/flows')
  })

  it('elsewhere, runs goes to Advanced settings and exit flows to Activity', () => {
    expect(legacyTarget('runs', false)).toBe('settings/advanced')
    expect(legacyTarget('exit-flows', false)).toBe('activity/flows')
  })

  it('waits while it is not known whether the device carries one', () => {
    expect(legacyTarget('runs', undefined)).toBeUndefined()
    expect(legacyTarget('exit-flows', undefined)).toBeUndefined()
    expect(legacyTarget('edit', undefined)).toBe('settings')
  })

  it('every old address has a target', () => {
    for (const page of LEGACY_PAGES) expect(legacyTarget(page, false)).toBeTruthy()
  })
})
