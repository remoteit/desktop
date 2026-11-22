import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flags = vi.hoisted(() => ({
  mobile: false,
  deviceSessions: true,
  services: false,
  thisDevice: false,
  partner: false,
  remoteUI: false,
  pathname: '/devices',
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }),
}))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) =>
    select({
      user: { reseller: null },
      ui: { layout: { insets: {}, hideSidebar: false }, accordion: {} },
      networks: { initialized: true },
      organization: { initialized: true },
      files: { all: { me: [] } },
    }),
  useDispatch: () => ({ ui: { accordion: vi.fn() } }),
}))
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: flags.pathname }) }))
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  List: ({ children }: { children?: React.ReactNode }) => <ul>{children}</ul>,
  Badge: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Collapse: ({ children, in: open }: { children?: React.ReactNode; in: boolean }) => (
    <div data-open={open}>{children}</div>
  ),
  ListItemButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ListItemText: ({ primary }: { primary: string }) => <span>{primary}</span>,
  Chip: () => null,
  Divider: () => null,
}))
vi.mock('./ListItemLocation', () => ({
  ListItemLocation: ({ title }: { title: string }) => <li data-nav={title}>{title}</li>,
}))
vi.mock('./ListItemLink', () => ({ ListItemLink: ({ title }: { title: string }) => <li data-nav={title}>{title}</li> }))
vi.mock('./UpgradeBanner', () => ({ UpgradeBanner: () => null }))
vi.mock('./ResellerLogo', () => ({ ResellerLogo: () => null }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../hooks/useMobile', () => ({ useMobile: () => flags.mobile }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => flags.deviceSessions }))
vi.mock('../hooks/useServiceShortcutsSupport', () => ({
  useServiceShortcutsSupport: () => ({ available: flags.services, namedAddress: false }),
}))
vi.mock('../hooks/useThisDevice', () => ({
  useThisDevice: () => (flags.thisDevice ? { id: 'x' } : null),
  useThisDevicePage: () => flags.thisDevice,
}))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ devices: 3, networks: 0 }) }))
vi.mock('../selectors/organizations', () => ({
  selectLimitsLookup: () => ({}),
  selectOrganization: () => ({ id: '', members: [] }),
}))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'me' }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({ initialized: true, all: [] }) }))
vi.mock('../selectors/scripting', () => ({ selectScripts: () => [] }))
vi.mock('../helpers/uiHelper', () => ({ isRemoteUI: () => flags.remoteUI }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => flags.partner }))
vi.mock('../services/browser', () => ({ default: { isElectron: false } }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('../styling', () => ({ spacing: { sm: 4, md: 8, lg: 16 } }))

import { SidebarNav } from './SidebarNav'
import { SidebarNavGrouped } from './SidebarNavGrouped'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('SidebarNavGrouped', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (node: React.ReactElement, set: Partial<typeof flags> = {}) => {
    Object.assign(flags, set)
    act(() => root.render(node))
    return [...container.querySelectorAll('[data-nav]')].map(item => item.getAttribute('data-nav'))
  }
  const openGroups = () =>
    [...container.querySelectorAll('[data-nav-group]')]
      .filter(header => header.getAttribute('aria-expanded') === 'true')
      .map(header => header.getAttribute('data-nav-group'))

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    Object.assign(flags, {
      mobile: false,
      deviceSessions: true,
      services: false,
      thisDevice: false,
      partner: false,
      remoteUI: false,
      pathname: '/devices',
    })
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const shapes: Partial<typeof flags>[] = [
    {},
    { thisDevice: true, services: true, partner: true },
    { mobile: true, deviceSessions: false },
    { mobile: true, services: true, thisDevice: true },
    { remoteUI: true },
  ]

  for (const shape of shapes) {
    it(`shows the classic items, each once: ${JSON.stringify(shape)}`, () => {
      const classic = render(<SidebarNav />, shape)
      const grouped = render(<SidebarNavGrouped />, shape)
      expect([...grouped].sort()).toEqual([...classic].sort())
      expect(new Set(grouped).size).toBe(grouped.length)
    })
  }

  it('opens by what the account has, and the group of the current page', () => {
    render(<SidebarNavGrouped />, { deviceSessions: false, pathname: '/devices' })
    expect(openGroups()).toEqual(['devices'])
    render(<SidebarNavGrouped />, { deviceSessions: false, pathname: '/organization' })
    expect(openGroups()).toEqual(['devices', 'team'])
  })

  it('puts a focusable header on each collapsible group', () => {
    render(<SidebarNavGrouped />, { thisDevice: true })
    const headers = [...container.querySelectorAll('[data-nav-group]')] as HTMLElement[]
    expect(headers.map(h => h.getAttribute('data-nav-group'))).toEqual(['devices', 'network', 'fleet', 'team'])
    headers[0].focus()
    expect(document.activeElement).toBe(headers[0])
  })
})
