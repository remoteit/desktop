import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Exits and proxies are in the menu in both layouts: a phone's bottom menu has Connections, Devices and Networks, and
// its drawer the rest — Exits and Proxies among them, where the device-session API's pages are on.
const flags = vi.hoisted(() => ({ mobile: false, deviceSessions: true }))

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }) }))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select({ user: { reseller: null }, ui: { layout: { insets: {}, hideSidebar: false } } }),
  useDispatch: () => ({}),
}))
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  List: ({ children }: { children?: React.ReactNode }) => <ul>{children}</ul>,
  Badge: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Chip: () => null,
  Divider: () => null,
}))
vi.mock('./ListItemLocation', () => ({ ListItemLocation: ({ title }: { title: string }) => <li data-nav={title}>{title}</li> }))
vi.mock('./ListItemLink', () => ({ ListItemLink: ({ title }: { title: string }) => <li data-nav={title}>{title}</li> }))
vi.mock('./UpgradeBanner', () => ({ UpgradeBanner: () => null }))
vi.mock('./ResellerLogo', () => ({ ResellerLogo: () => null }))
vi.mock('../hooks/useMobile', () => ({ useMobile: () => flags.mobile }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => flags.deviceSessions }))
vi.mock('../hooks/useThisDevice', () => ({ useThisDevice: () => null, useThisDevicePage: () => false }))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({}) }))
vi.mock('../selectors/organizations', () => ({ selectLimitsLookup: () => ({}) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('../helpers/uiHelper', () => ({ isRemoteUI: () => false }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => false }))
vi.mock('../services/browser', () => ({ default: { isElectron: false } }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('../styling', () => ({ spacing: { sm: 4, md: 8, lg: 16 } }))

import { SidebarNav } from './SidebarNav'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('SidebarNav', () => {
  let root: Root
  let container: HTMLDivElement

  const items = () => [...container.querySelectorAll('[data-nav]')].map(item => item.getAttribute('data-nav'))
  const render = (mobile: boolean, deviceSessions = true) => {
    Object.assign(flags, { mobile, deviceSessions })
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

  it('a phone: Exits and Proxies in the drawer, beside what its bottom menu does not have', () => {
    const shown = render(true)
    expect(shown).toEqual(expect.arrayContaining(['Exits', 'Proxies', 'Scripting']))
    expect(shown).not.toContain('Devices') // the bottom menu's
    expect(shown.indexOf('Proxies')).toBeLessThan(shown.indexOf('Scripting'))
  })

  it('a desktop: after Networks, before Scripting', () => {
    const shown = render(false)
    expect(shown.slice(shown.indexOf('Networks'), shown.indexOf('Scripting') + 1)).toEqual(['Networks', 'Exits', 'Proxies', 'Scripting'])
  })

  it('neither, in either layout, where the device-session pages are off', () => {
    expect(render(true, false)).not.toEqual(expect.arrayContaining(['Exits']))
    expect(render(false, false)).not.toContain('Proxies')
  })
})
