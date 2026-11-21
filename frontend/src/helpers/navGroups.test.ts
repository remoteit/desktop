import { describe, it, expect } from 'vitest'
import {
  NAV_GROUPS,
  NavGates,
  NavSignals,
  classicNavItems,
  navGroups,
  activeNavGroup,
  navGroupOpen,
  navGroupKey,
} from './navGroups'

const shapes: Record<string, NavGates> = {
  'a browser, nothing extra': {
    thisDevice: false,
    mobile: false,
    services: false,
    deviceSessions: false,
    partner: false,
  },
  'an app with everything': { thisDevice: true, mobile: false, services: true, deviceSessions: true, partner: true },
  'a phone drawer': { thisDevice: true, mobile: true, services: false, deviceSessions: true, partner: false },
  'a phone with services': { thisDevice: false, mobile: true, services: true, deviceSessions: false, partner: true },
}

const empty: NavSignals = {
  deviceSessions: false,
  networks: 0,
  products: 0,
  scripts: 0,
  devices: 0,
  organization: false,
}
const group = (id: string) => NAV_GROUPS.find(g => g.id === id)!
const opens = (id: string, signals: Partial<NavSignals>) => group(id).defaultOpen({ ...empty, ...signals })

describe('navGroups', () => {
  it('holds every item once', () => {
    const all = NAV_GROUPS.flatMap(g => g.items)
    expect(new Set(all).size).toBe(all.length)
    expect(all.sort()).toEqual(classicNavItems(shapes['an app with everything']).sort())
  })

  for (const [name, gates] of Object.entries(shapes)) {
    it(`shows exactly the classic items, each once: ${name}`, () => {
      const classic = classicNavItems(gates)
      const grouped = navGroups(classic).flatMap(g => g.items)
      expect(grouped.sort()).toEqual([...classic].sort())
      expect(navGroups(classic).every(g => g.items.length)).toBe(true)
    })
  }

  it('drops a group with nothing to show', () => {
    expect(navGroups(classicNavItems(shapes['a browser, nothing extra'])).map(g => g.id)).not.toContain('thisDevice')
  })

  it('opens This device and Devices always', () => {
    expect(opens('thisDevice', {})).toBe(true)
    expect(opens('devices', {})).toBe(true)
  })

  it('opens Network with a network, with exits and proxies shown, or before networks are read', () => {
    expect(opens('network', {})).toBe(false)
    expect(opens('network', { networks: 2 })).toBe(true)
    expect(opens('network', { deviceSessions: true })).toBe(true)
    expect(opens('network', { networks: undefined })).toBe(true)
  })

  it('opens Fleet with a product, a script or more than 10 devices', () => {
    expect(opens('fleet', { devices: 10 })).toBe(false)
    expect(opens('fleet', { devices: 11 })).toBe(true)
    expect(opens('fleet', { products: 1 })).toBe(true)
    expect(opens('fleet', { scripts: 1 })).toBe(true)
    expect(opens('fleet', { products: undefined })).toBe(true)
  })

  it('opens Team with an organization, or before it is read', () => {
    expect(opens('team', {})).toBe(false)
    expect(opens('team', { organization: true })).toBe(true)
    expect(opens('team', { organization: undefined })).toBe(true)
  })

  it('finds the group of the current page', () => {
    const groups = navGroups(classicNavItems(shapes['an app with everything']))
    expect(activeNavGroup(groups, '/devices/abc/details')).toBe('devices')
    expect(activeNavGroup(groups, '/exits/1')).toBe('network')
    expect(activeNavGroup(groups, '/runs/9')).toBe('fleet')
    expect(activeNavGroup(groups, '/logs')).toBe('team')
    expect(activeNavGroup(groups, '/logs/x')).toBeUndefined()
    expect(activeNavGroup(groups, '/settings')).toBeUndefined()
  })

  it('opens the group of the current page over a saved choice and its default', () => {
    const team = group('team')
    const saved = { [navGroupKey('team')]: false }
    expect(navGroupOpen(team, empty, saved, false, false)).toBe(false)
    expect(navGroupOpen(team, empty, saved, true, false)).toBe(true)
    expect(navGroupOpen(team, empty, saved, true, true)).toBe(false)
  })

  it('keeps a saved choice over the default', () => {
    expect(navGroupOpen(group('fleet'), empty, { [navGroupKey('fleet')]: true }, false, false)).toBe(true)
    expect(navGroupOpen(group('devices'), empty, { [navGroupKey('devices')]: false }, false, false)).toBe(false)
  })
})
