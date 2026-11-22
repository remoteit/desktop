import { describe, it, expect } from 'vitest'
import {
  NAV_PAGES,
  NAV_SECTIONS,
  NavGates,
  NavPageId,
  navPageAt,
  navSectionAt,
  navSections,
  sectionLanding,
  sectionMatch,
  subNavShown,
} from './navSections'

const none: NavGates = {
  thisDevice: false,
  services: false,
  deviceSessions: false,
  publicAddresses: false,
  partner: false,
  connectAi: false,
  agent: false,
}

const shapes: Record<string, NavGates> = {
  'an empty account in a browser': { ...none, connectAi: true },
  'a fleet operator': { ...none, connectAi: true, services: true, deviceSessions: true, publicAddresses: true, agent: true },
  'a partner': { ...none, connectAi: true, partner: true },
  'an app with This device': { ...none, connectAi: true, thisDevice: true, deviceSessions: true, publicAddresses: true },
  'another brand, nothing extra': none,
}

/* What the flat sidebar (before sections) listed by the same gates, outside Remote UI: the pages to keep reachable,
   plus Public addresses, new with the sections. */
function oldSidebar(g: NavGates): NavPageId[] {
  const items: NavPageId[] = []
  if (g.thisDevice) items.push('thisDevice')
  items.push('connections', 'devices', 'networks')
  if (g.services) items.push('services')
  if (g.deviceSessions) items.push('exits', 'proxies')
  if (g.publicAddresses) items.push('publicAddresses')
  items.push('scripting', 'apps', 'products', 'organization')
  if (g.partner) items.push('partnerStats')
  items.push('logs')
  if (g.connectAi) items.push('connectAi')
  return items
}

/* A path on each page, as a direct link would open it. */
const LINKS: Record<NavPageId, string[]> = {
  thisDevice: ['/this-device'],
  devices: ['/devices', '/devices/select', '/devices/abc/details', '/devices/abc/svc/connect', '/devices/restore'],
  connections: ['/connections', '/connections/svc', '/connections/svc/session/other'],
  services: ['/services'],
  networks: ['/networks', '/networks/net', '/networks/add', '/networks/net/svc/lan'],
  exits: ['/exits', '/exits/new', '/exits/e1'],
  publicAddresses: ['/public-addresses', '/public-addresses/new'],
  proxies: ['/proxies', '/proxies/base', '/proxies/p1'],
  products: ['/products', '/products/select', '/products/add', '/products/p1/details'],
  scripting: ['/scripts', '/scripts/add', '/script/f1/latest/run', '/runs', '/runs/job/j1', '/files', '/file/f1'],
  apps: ['/apps', '/apps/build', '/apps/com.x.app'],
  organization: ['/organization', '/organization/members/u1', '/organization/roles', '/organization-empty'],
  logs: ['/logs'],
  partnerStats: ['/partner-stats', '/partner-stats/p1'],
  connectAi: ['/connect-ai'],
  agent: [],
}

const pagesOf = (gates: NavGates) => navSections(gates).flatMap(section => section.pages)

describe('navSections', () => {
  it('puts every page in one section', () => {
    const all = NAV_SECTIONS.flatMap(section => section.pages)
    expect(new Set(all).size).toBe(all.length)
    expect([...all].sort()).toEqual((Object.keys(NAV_PAGES) as NavPageId[]).sort())
  })

  it('keeps the sidebar to six sections', () => {
    const everything = Object.fromEntries(Object.keys(none).map(key => [key, true])) as NavGates
    expect(navSections(everything).map(section => section.id)).toEqual([
      'thisDevice',
      'devices',
      'network',
      'fleet',
      'team',
      'ai',
    ])
  })

  for (const [name, gates] of Object.entries(shapes)) {
    it(`reaches every page the old sidebar listed, and nothing it hid: ${name}`, () => {
      const pages = pagesOf(gates).filter(page => page !== 'agent')
      expect([...pages].sort()).toEqual(oldSidebar(gates).sort())
    })

    it(`selects the right section and sub-link from a direct link: ${name}`, () => {
      const sections = navSections(gates)
      for (const page of pagesOf(gates))
        for (const link of LINKS[page]) {
          expect(navPageAt(sections, link), link).toBe(page)
          const section = navSectionAt(sections, link)!
          expect(section.pages, link).toContain(page)
          expect(sectionMatch(section).some(match => link.startsWith(match)), link).toBe(true)
        }
    })
  }

  it('hides each gated page where its gate is off, and a section with nothing left', () => {
    const pages = pagesOf(none)
    for (const page of ['thisDevice', 'services', 'exits', 'proxies', 'publicAddresses', 'partnerStats', 'connectAi', 'agent'])
      expect(pages).not.toContain(page)
    expect(navSections(none).map(section => section.id)).toEqual(['devices', 'network', 'fleet', 'team'])
    expect(navSectionAt(navSections(none), '/exits')).toBeUndefined()
    expect(navSectionAt(navSections(none), '/partner-stats')).toBeUndefined()
  })

  it('lists public addresses between exits and proxy servers, pointing at /public-addresses', () => {
    const network = navSections({ ...none, deviceSessions: true, publicAddresses: true }).find(s => s.id === 'network')!
    expect(network.pages).toEqual(['networks', 'exits', 'publicAddresses', 'proxies'])
    expect(NAV_PAGES.publicAddresses.to).toBe('/public-addresses')
    expect(navPageAt([network], '/public-addresses/new')).toBe('publicAddresses')
    expect(navSections({ ...none, deviceSessions: true }).find(s => s.id === 'network')!.pages).toEqual([
      'networks',
      'exits',
      'proxies',
    ])
  })

  it('lands each section on its first page, and Fleet on Scripts until the account has a product', () => {
    const sections = navSections(shapes['a fleet operator'])
    const landing = (id: string, products?: number) => sectionLanding(sections.find(s => s.id === id)!, { products })
    expect(landing('devices')).toBe('devices')
    expect(landing('network')).toBe('networks')
    expect(landing('team')).toBe('organization')
    expect(landing('ai')).toBe('connectAi')
    expect(landing('fleet', 0)).toBe('scripting')
    expect(landing('fleet', 2)).toBe('products')
    expect(sectionLanding(navSections({ ...none, agent: true }).find(s => s.id === 'ai')!, {})).toBe('agent')
  })

  it('returns a section to the sub-link last used there, when it is still shown', () => {
    const sections = navSections(shapes['a fleet operator'])
    const section = (id: string) => sections.find(s => s.id === id)!
    expect(sectionLanding(section('devices'), {}, 'connections')).toBe('connections')
    expect(sectionLanding(section('fleet'), { products: 2 }, 'apps')).toBe('apps')
    expect(sectionLanding(section('devices'), {}, 'exits')).toBe('devices')
    expect(sectionLanding(section('network'), {}, 'partnerStats')).toBe('networks')
    expect(
      sectionLanding(navSections({ ...none, connectAi: true, agent: true }).find(s => s.id === 'ai')!, {}, 'agent')
    ).toBe('connectAi')
  })

  it('finds no section for pages outside them', () => {
    const sections = navSections(shapes['a fleet operator'])
    for (const path of ['/settings', '/account', '/add', '/announcements', '/feedback', '/admin/users'])
      expect(navSectionAt(sections, path), path).toBeUndefined()
  })

  it('shows the sub-links over a list, not over an item', () => {
    expect(subNavShown('devices', '/devices', 1)).toBe(true)
    expect(subNavShown('devices', '/devices/select', 1)).toBe(true)
    expect(subNavShown('devices', '/devices/abc/details', 1)).toBe(false)
    expect(subNavShown('devices', '/devices/setup', 1)).toBe(false)
    expect(subNavShown('devices', '/devices/abc/details', 2)).toBe(false)
    expect(subNavShown('devices', '/devices/transfer', 2)).toBe(true)
    expect(subNavShown('networks', '/networks/net', 1)).toBe(false)
    expect(subNavShown('networks', '/networks/net', 2)).toBe(true)
    expect(subNavShown('exits', '/exits/new', 1)).toBe(false)
    expect(subNavShown('exits', '/exits/new', 2)).toBe(true)
    expect(subNavShown('products', '/products/p1/details', 2)).toBe(false)
    expect(subNavShown('products', '/products/p1/details', 3)).toBe(true)
    expect(subNavShown('products', '/products/add', 2)).toBe(true)
    expect(subNavShown('scripting', '/script/f1/latest/run', 2)).toBe(false)
    expect(subNavShown('scripting', '/script/f1/latest/run', 3)).toBe(true)
    expect(subNavShown('scripting', '/scripts/add', 2)).toBe(true)
    expect(subNavShown('scripting', '/runs/f1', 1)).toBe(true)
    expect(subNavShown('organization', '/organization-empty', 1)).toBe(true)
    expect(subNavShown('organization', '/organization/members', 2)).toBe(true)
  })
})
