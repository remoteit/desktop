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
  sectionPage: {} as Record<string, string>,
  active: 0,
}))
const push = vi.hoisted(() => vi.fn())
const toggle = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }),
}))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) =>
    select({
      user: { reseller: null },
      ui: { layout: { insets: {}, hideSidebar: false }, sectionPage: flags.sectionPage },
    }),
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
  ListItemButton: ({
    children,
    to,
    onClick,
    selected,
    'aria-current': current,
  }: {
    children?: React.ReactNode
    to?: string
    onClick?: () => void
    selected?: boolean
    'aria-current'?: 'page'
  }) => (
    <a data-page data-to={to} data-selected={String(!!selected)} aria-current={current} onClick={onClick}>
      {children}
    </a>
  ),
  ListItemIcon: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ListItemText: ({ primary }: { primary: string }) => <span>{primary}</span>,
}))
vi.mock('./Icon', () => ({ Icon: ({ name }: { name: string }) => <i data-icon={name} /> }))
vi.mock('./Quote', () => ({
  Quote: ({ indent, children }: { indent?: string; children?: React.ReactNode }) => (
    <div data-quote={indent}>{children}</div>
  ),
}))
vi.mock('./ListItemLocation', () => ({
  ListItemLocation: ({
    title,
    to,
    match,
    children,
  }: {
    title: string
    to?: string
    match?: string | string[]
    children?: React.ReactNode
  }) => (
    <li
      data-nav={title}
      data-to={to}
      data-selected={String([match ?? to ?? []].flat().some(m => flags.pathname.startsWith(m)))}
    >
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
vi.mock('../hooks/useChatEnabled', () => ({ useChatToggle: () => ({ show: flags.chat, open: false, toggle }) }))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ devices: 12, networks: 0, active: flags.active }) }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => flags.partner }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({ all: new Array(flags.products) }) }))
vi.mock('../selectors/organizations', () => ({ selectLimitsLookup: () => ({}) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('../styling', () => ({ spacing: { xs: 2, sm: 4, md: 8, lg: 16 } }))

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
      sectionPage: {},
      active: 0,
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

  const pages = () => [...container.querySelectorAll('[data-page]')].map(page => page.textContent)
  const page = (title: string) => [...container.querySelectorAll('[data-page]')].find(p => p.textContent === title)!

  it('lists the sections, then the footer', () => {
    expect(render({ pathname: '/settings' })).toEqual([
      'Devices',
      'Network',
      'Fleet',
      'Team',
      'AI',
      'Announcements',
      'Support Forum',
      'Settings',
    ])
    expect(pages()).toEqual([])
  })

  it('opens only the section you are in, its pages beneath it', () => {
    render({ pathname: '/exits', deviceSessions: true })
    expect(pages()).toEqual(['All', 'Exits', 'Public addresses', 'Proxy servers'])
    render({ pathname: '/scripts' })
    expect(pages()).toEqual(['Products', 'Scripts', 'Apps'])
    render({ pathname: '/devices/abc/details', services: true })
    expect(pages()).toEqual(['All', 'Connections', 'Services'])
  })

  it("shows each page's icon", () => {
    render({ pathname: '/exits', deviceSessions: true })
    const icons = () => [...container.querySelectorAll('[data-page] [data-icon]')].map(i => i.getAttribute('data-icon'))
    expect(icons()).toEqual(['rectangle-list', 'door-open', 'globe', 'server'])
  })

  it('opens no pages under a section with one page', () => {
    render({ pathname: '/connect-ai' })
    expect(pages()).toEqual([])
    render({ pathname: '/networks' })
    expect(pages()).toEqual([])
    render({ pathname: '/this-device', thisDevice: true })
    expect(pages()).toEqual([])
  })

  it('marks the current page, and not the open section', () => {
    const selected = () => [...container.querySelectorAll('[data-selected="true"]')].map(i => i.textContent)
    render({ pathname: '/exits/e1', deviceSessions: true })
    expect(page('Exits').getAttribute('aria-current')).toBe('page')
    expect(page('All').getAttribute('aria-current')).toBeNull()
    expect(selected()).toEqual(['Exits'])
    render({ pathname: '/add' })
    expect(page('All').getAttribute('aria-current')).toBe('page')
  })

  it('links each page to its address, and Connections shows how many are open', () => {
    render({ pathname: '/connections', active: 2 })
    expect(page('All').getAttribute('data-to')).toBe('/devices')
    expect(page('Connections').getAttribute('data-to')).toBe('/connections')
    expect(page('Connections').querySelector('[data-chip]')?.getAttribute('data-chip')).toBe('2')
  })

  it('opens the chat from the Agent page', () => {
    render({ pathname: '/connect-ai', chat: true })
    expect(pages()).toEqual(['Connect AI', 'Agent'])
    expect(page('Agent').getAttribute('data-to')).toBeNull()
    act(() => (page('Agent') as HTMLElement).click())
    expect(toggle).toHaveBeenCalled()
  })

  it('returns a section name to the page last used in it', () => {
    render({ pathname: '/devices', deviceSessions: true, sectionPage: { network: 'exits', team: 'logs' } })
    expect(item('Network').getAttribute('data-to')).toBe('/exits')
    expect(item('Team').getAttribute('data-to')).toBe('/logs')
    expect(item('Devices').getAttribute('data-to')).toBe('/devices')
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

  it('selects a section with one page, and the footer, as before', () => {
    const selected = () =>
      [...container.querySelectorAll('li[data-selected="true"]')].map(i => i.getAttribute('data-nav'))
    render({ pathname: '/connect-ai' })
    expect(selected()).toEqual(['AI'])
    render({ pathname: '/runs/job/j1' })
    expect(selected()).toEqual([])
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
