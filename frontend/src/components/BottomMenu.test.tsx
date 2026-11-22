import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flags = vi.hoisted(() => ({
  thisDevice: false,
  deviceSessions: true,
  chat: false,
  chatOpen: false,
  products: 0,
  pathname: '/devices',
}))
const push = vi.hoisted(() => vi.fn())
const toggle = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }) }))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select({ ui: { layout: { hideSidebar: true } } }),
  useDispatch: () => ({ feedback: { reset: vi.fn() } }),
}))
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useHistory: () => ({ push }),
  useLocation: () => ({ pathname: flags.pathname }),
}))
vi.mock('@common/brand/config', () => ({ default: { name: 'remoteit' } }))
vi.mock('../services/browser', () => ({ default: { isElectron: false } }))
vi.mock('../helpers/uiHelper', () => ({ isRemoteUI: () => false }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => flags.deviceSessions }))
vi.mock('../hooks/useServiceShortcutsSupport', () => ({ useServiceShortcutsSupport: () => undefined }))
vi.mock('../hooks/useThisDevice', () => ({
  useThisDevice: () => (flags.thisDevice ? { id: 'me' } : null),
  useThisDevicePage: () => flags.thisDevice,
}))
vi.mock('../hooks/useChatEnabled', () => ({
  useChatToggle: () => ({ show: flags.chat, open: flags.chatOpen, toggle }),
}))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ unreadAnnouncements: 0 }) }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => false }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({ all: new Array(flags.products) }) }))
vi.mock('../selectors/organizations', () => ({ selectLimitsLookup: () => ({}) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('./Icon', () => ({ Icon: () => null }))

import { lightColors } from '../styling'
import { BottomMenu } from './BottomMenu'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})
const layout = { mobile: true, insets: { bottom: 0 } } as ILayout

describe('BottomMenu', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (set: Partial<typeof flags> = {}) => {
    Object.assign(flags, {
      thisDevice: false,
      deviceSessions: true,
      chat: false,
      chatOpen: false,
      products: 0,
      pathname: '/devices',
      ...set,
    })
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <BottomMenu layout={layout} />
        </ThemeProvider>
      )
    )
  }
  const actions = () => Array.from(container.querySelectorAll<HTMLButtonElement>('.MuiBottomNavigationAction-root'))
  const action = (label: string) => actions().find(button => button.textContent === label)!
  const selected = () => actions().find(button => button.classList.contains('Mui-selected'))?.textContent
  const sheet = () =>
    Array.from(document.querySelectorAll('.MuiDrawer-root .MuiListItemText-primary')).map(item => item.textContent)

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

  it('labels every tab: Devices, Network and More', () => {
    render()
    expect(actions().map(button => button.textContent)).toEqual(['Devices', 'Network', 'More'])
    expect(container.querySelector('.MuiBottomNavigationAction-iconOnly')).toBeNull()
  })

  it('starts with This device in an app', () => {
    render({ thisDevice: true })
    expect(actions().map(button => button.textContent)).toEqual(['This device', 'Devices', 'Network', 'More'])
  })

  it("selects the current page's section, and More for the rest", () => {
    render({ pathname: '/exits/e1' })
    expect(selected()).toBe('Network')
    render({ pathname: '/connections' })
    expect(selected()).toBe('Devices')
    render({ pathname: '/scripts' })
    expect(selected()).toBe('More')
    render({ pathname: '/settings' })
    expect(selected()).toBe('More')
  })

  it("opens a section at its landing page, and stays put on the section's own tab", () => {
    render()
    act(() => action('Network').click())
    expect(push).toHaveBeenCalledWith('/networks')
    push.mockReset()
    act(() => action('Devices').click())
    expect(push).not.toHaveBeenCalled()
  })

  it('lists the other sections and the footer under More', () => {
    render({ chat: true })
    act(() => action('More').click())
    expect(sheet()).toEqual(['Fleet', 'Team', 'AI', 'Announcements', 'Support Forum', 'Settings'])
    expect(push).not.toHaveBeenCalled()
  })

  it('opens Fleet from More at Scripts until the account has a product', () => {
    render()
    act(() => action('More').click())
    act(() => (Array.from(document.querySelectorAll('.MuiDrawer-root .MuiListItemButton-root'))[0] as HTMLElement).click())
    expect(push).toHaveBeenCalledWith('/scripts')

    render({ products: 3 })
    act(() => action('More').click())
    act(() => (Array.from(document.querySelectorAll('.MuiDrawer-root .MuiListItemButton-root'))[0] as HTMLElement).click())
    expect(push).toHaveBeenLastCalledWith('/products')
  })

  it('closes an open chat when a tab is picked', () => {
    render({ chat: true, chatOpen: true })
    act(() => action('Devices').click())
    expect(toggle).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
    act(() => action('Network').click())
    expect(push).toHaveBeenCalledWith('/networks')
  })
})
