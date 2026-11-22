import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flags = vi.hoisted(() => ({
  remoteUI: false,
  thisDevice: false,
  deviceSessions: false,
  services: false,
  partner: false,
  chat: false,
  products: 0,
  pathname: '/devices',
}))
const push = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }) }))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) =>
    select({ user: { reseller: null }, ui: { layout: { insets: {}, hideSidebar: false } } }),
  useDispatch: () => ({}),
}))
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useHistory: () => ({ push }),
  useLocation: () => ({ pathname: flags.pathname }),
}))
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  List: ({ children }: { children?: React.ReactNode }) => <ul>{children}</ul>,
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Chip: ({ label }: { label: string }) => <span data-chip={label} />,
  Divider: () => null,
}))
vi.mock('./ListItemLocation', () => ({
  ListItemLocation: ({ title, to, match, children }: { title: string; to?: string; match?: string | string[]; children?: React.ReactNode }) => (
    <li data-nav={title} data-to={to} data-selected={String([match ?? to ?? []].flat().some(m => flags.pathname.startsWith(m)))}>
      {children}
    </li>
  ),
}))
vi.mock('./ListItemLink', () => ({ ListItemLink: ({ title }: { title: string }) => <li data-nav={title}>{title}</li> }))
vi.mock('./UpgradeBanner', () => ({ UpgradeBanner: () => null }))
vi.mock('./ResellerLogo', () => ({ ResellerLogo: () => null }))
vi.mock('@common/brand/config', () => ({ default: { name: 'remoteit' } }))
vi.mock('../services/browser', () => ({ default: { isElectron: false } }))
vi.mock('../helpers/uiHelper', () => ({ isRemoteUI: () => flags.remoteUI }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => flags.deviceSessions }))
vi.mock('../hooks/useServiceShortcutsSupport', () => ({
  useServiceShortcutsSupport: () => ({ available: flags.services, namedAddress: false }),
}))
vi.mock('../hooks/useThisDevice', () => ({
  useThisDevice: () => (flags.thisDevice ? { id: 'me' } : null),
  useThisDevicePage: () => flags.thisDevice,
}))
vi.mock('../hooks/useChatEnabled', () => ({ useChatToggle: () => ({ show: flags.chat, open: false, toggle: vi.fn() }) }))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ devices: 12, networks: 0 }) }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => flags.partner }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({ all: new Array(flags.products) }) }))
vi.mock('../selectors/organizations', () => ({ selectLimitsLookup: () => ({}) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('../styling', () => ({ spacing: { sm: 4, md: 8, lg: 16 } }))

import { SidebarNav } from './SidebarNav'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('SidebarNav', () => {
  let root: Root
  let container: HTMLDivElement

  const items = () => [...container.querySelectorAll('[data-nav]')].map(item => item.getAttribute('data-nav'))
  const item = (title: string) => container.querySelector(`[data-nav="${title}"]`)!
  const render = (set: Partial<typeof flags> = {}) => {
    Object.assign(flags, {
      remoteUI: false,
      thisDevice: false,
      deviceSessions: false,
      services: false,
      partner: false,
      chat: false,
      products: 0,
      pathname: '/devices',
      ...set,
    })
    act(() => root.render(<SidebarNav />))
    return items()
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('lists only the sections, then the footer', () => {
    expect(render()).toEqual(['Devices', 'Network', 'Fleet', 'Team', 'AI', 'Announcements', 'Support Forum', 'Settings'])
  })

  it('puts This device first in an app', () => {
    expect(render({ thisDevice: true }).slice(0, 2)).toEqual(['This device', 'Devices'])
  })

  it('leads each section to its landing page', () => {
    render()
    expect(item('Devices').getAttribute('data-to')).toBe('/devices')
    expect(item('Network').getAttribute('data-to')).toBe('/networks')
    expect(item('Fleet').getAttribute('data-to')).toBe('/scripts')
    expect(item('Team').getAttribute('data-to')).toBe('/organization')
    expect(item('AI').getAttribute('data-to')).toBe('/connect-ai')
    render({ products: 1 })
    expect(item('Fleet').getAttribute('data-to')).toBe('/products')
  })

  it('selects the section of a direct link', () => {
    const selected = () => [...container.querySelectorAll('[data-selected="true"]')].map(i => i.getAttribute('data-nav'))
    render({ pathname: '/exits/e1', deviceSessions: true })
    expect(selected()).toEqual(['Network'])
    render({ pathname: '/runs/job/j1' })
    expect(selected()).toEqual(['Fleet'])
    render({ pathname: '/logs' })
    expect(selected()).toEqual(['Team'])
    render({ pathname: '/settings' })
    expect(selected()).toEqual(['Settings'])
  })

  it('keeps the device count on Devices', () => {
    render()
    expect(item('Devices').querySelector('[data-chip]')?.getAttribute('data-chip')).toBe('12')
    expect(item('Network').querySelector('[data-chip]')).toBeNull()
  })

  it('keeps Remote UI to This Device and Logs', () => {
    expect(render({ remoteUI: true })).toEqual(['This Device', 'Logs'])
  })
})
