import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flags = vi.hoisted(() => ({
  remoteUI: false,
  thisDevice: false,
  deviceSessions: true,
  services: false,
  partner: false,
  chat: false,
  pathname: '/devices',
}))
const push = vi.hoisted(() => vi.fn())
const toggle = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }) }))
vi.mock('react-redux', () => ({ useSelector: (select: (s: any) => any) => select({ ui: { layout: { hideSidebar: false } } }) }))
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useHistory: () => ({ push }),
  useLocation: () => ({ pathname: flags.pathname }),
}))
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
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ active: 0 }) }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => flags.partner }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({ all: [] }) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({ '/networks': '/networks/n1' }) }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))

import { lightColors } from '../styling'
import { SectionNav } from './SectionNav'

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('SectionNav', () => {
  let root: Root
  let container: HTMLDivElement

  const tabs = () => [...container.querySelectorAll('[role="tab"]')]
  const labels = () => tabs().map(tab => tab.textContent)
  const selected = () => tabs().find(tab => tab.getAttribute('aria-selected') === 'true')?.textContent
  const title = () => container.querySelector('h1')?.textContent
  const render = (pathname: string, panels = 1, set: Partial<typeof flags> = {}) => {
    Object.assign(flags, {
      remoteUI: false,
      thisDevice: false,
      deviceSessions: true,
      services: false,
      partner: false,
      chat: false,
      pathname,
      ...set,
    })
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <SectionNav panels={panels} />
        </ThemeProvider>
      )
    )
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    push.mockReset()
    toggle.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('heads a list with its section title and sub-links, the page chosen', () => {
    render('/exits')
    expect(title()).toBe('Network')
    expect(labels()).toEqual(['Networks', 'Exits', 'Public addresses', 'Proxy servers'])
    expect(selected()).toBe('Exits')
  })

  it('gives each section the sub-links of the plan, as gates allow', () => {
    render('/devices', 1, { services: true })
    expect(labels()).toEqual(['Devices', 'Connections', 'Services'])
    render('/devices')
    expect(labels()).toEqual(['Devices', 'Connections'])
    render('/products')
    expect(labels()).toEqual(['Products', 'Scripts', 'Apps'])
    render('/organization', 2, { partner: true })
    expect(labels()).toEqual(['Organization', 'Logs', 'Partner stats'])
    render('/logs')
    expect(labels()).toEqual(['Organization', 'Logs'])
    render('/connect-ai', 1, { chat: true })
    expect(labels()).toEqual(['Connect AI', 'Agent'])
  })

  it('heads a section with one page the same way, and leaves out This device', () => {
    render('/networks', 1, { deviceSessions: false })
    expect(labels()).toEqual(['Networks'])
    render('/connect-ai')
    expect(labels()).toEqual(['Connect AI'])
    render('/this-device', 1, { thisDevice: true })
    expect(labels()).toEqual([])
  })

  it("stays off an item's own page", () => {
    render('/exits/new')
    expect(labels()).toEqual([])
    render('/devices/abc/details', 2)
    expect(labels()).toEqual([])
    render('/networks/n1', 2)
    expect(selected()).toBe('Networks')
    render('/script/f1/latest/run', 3)
    expect(selected()).toBe('Scripts')
  })

  it('stays out of Remote UI and pages outside the sections', () => {
    render('/logs', 1, { remoteUI: true })
    expect(labels()).toEqual([])
    render('/settings')
    expect(labels()).toEqual([])
  })

  it('opens a sub-link at its address, or where it was left', () => {
    render('/exits')
    act(() => (tabs()[2] as HTMLElement).click())
    expect(push).toHaveBeenCalledWith('/public-addresses')
    act(() => (tabs()[3] as HTMLElement).click())
    expect(push).toHaveBeenCalledWith('/proxies')
    act(() => (tabs()[0] as HTMLElement).click())
    expect(push).toHaveBeenCalledWith('/networks/n1')
  })

  it('opens the chat from the agent sub-link', () => {
    render('/connect-ai', 1, { chat: true })
    act(() => (tabs()[1] as HTMLElement).click())
    expect(toggle).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })
})
