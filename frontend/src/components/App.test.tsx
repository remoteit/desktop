import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// What the app shows signed out: in an app (a shell's thisDevice present) This device, the sign-in on it; in a plain
// browser the sign-in screen, as before; signed in, the portal in either.

const { state, device, mark } = vi.hoisted(() => ({
  state: { current: {} as any },
  device: { current: undefined as any },
  mark: (name: string) => () => React.createElement('div', { 'data-shown': name }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_k: string, text: string) => text }) }))
vi.mock('react-redux', () => ({
  useSelector: (pick: any) => pick(state.current),
  useDispatch: () => ({ ui: { set: vi.fn() } }),
}))
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/devices' }) }))
vi.mock('redux-persist/integration/react', () => ({ PersistGate: ({ children }: any) => <>{children}</> }))
vi.mock('../store', () => ({ persistor: {} }))
vi.mock('../services/browser', () => ({ default: { isMobile: false } }))
vi.mock('../hooks/useSafeArea', () => ({ default: () => ({ insets: {} }) }))
vi.mock('../hooks/useCapacitor', () => ({ default: () => () => {} }))
vi.mock('../hooks/useChatEnabled', () => ({
  useChatEnabled: () => false,
  useSidebarWidth: () => 200,
  useLayoutBreakpoints: () => ({ hideSidebar: false, singlePanel: false, triplePanel: false, mobile: false }),
}))
vi.mock('../hooks/useThisDevice', () => ({ useThisDevice: () => device.current }))
vi.mock('../selectors/organizations', () => ({ selectResellerRef: () => undefined }))
vi.mock('../services/chatPopout', () => ({ isChatPopout: false }))
vi.mock('../constants', () => ({ REGEX_FIRST_PATH: /^\/[^/]*/ }))
vi.mock('./InstallationNotice', () => ({ InstallationNotice: mark('installation') }))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: mark('loading') }))
vi.mock('./ResellerLogo', () => ({ ResellerLogo: mark('reseller') }))
vi.mock('./SidebarMenu', () => ({ SidebarMenu: mark('sidebarMenu') }))
vi.mock('../pages/SignInPage', () => ({ SignInPage: mark('signIn') }))
vi.mock('./ThisDeviceApp', () => ({ ThisDeviceApp: mark('thisDevice') }))
vi.mock('./BottomMenu', () => ({ BottomMenu: mark('bottomMenu') }))
vi.mock('./Sidebar', () => ({ Sidebar: mark('sidebar') }))
vi.mock('../routers/Router', () => ({ Router: mark('router') }))
vi.mock('../pages/Page', () => ({
  Page: ({ children, offlineDialog = true }: any) => <div data-offline-dialog={String(offlineDialog)}>{children}</div>,
}))
vi.mock('@common/brand/Logo', () => ({ Logo: () => null }))
vi.mock('./ViewAsBanner', () => ({ ViewAsBanner: () => null }))
vi.mock('./AnnouncementDialog', () => ({ AnnouncementDialog: () => null }))
vi.mock('./AnnouncementBanner', () => ({ AnnouncementBanner: () => null }))

import { App } from './App'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function shown(auth: { authenticated: boolean; user?: object }, thisDevice: any) {
  state.current = {
    auth: { initialized: true, ...auth },
    binaries: { installed: true },
    ui: {},
    accounts: { membership: [] },
    organization: { initialized: true },
  }
  device.current = thisDevice
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(<App />))
  dialog = container.querySelector('[data-offline-dialog]')?.getAttribute('data-offline-dialog')
  return [...container.querySelectorAll('[data-shown]')].map(e => e.getAttribute('data-shown'))
}
let dialog: string | null | undefined
const shell = { compatible: true, has: () => true }

beforeEach(() => {
  device.current = undefined
})

describe('the app, signed out', () => {
  it('in an app: This device, not the sign-in screen', async () => {
    expect(await shown({ authenticated: false }, shell)).toEqual(['thisDevice'])
    // It works offline: no dialog over it saying the internet is required.
    expect(dialog).toBe('false')
  })

  it('in a plain browser: the sign-in screen, as before', async () => {
    expect(await shown({ authenticated: false }, null)).toEqual(['signIn'])
    expect(dialog).toBe('true')
  })

  it('while the bridge is still being asked: waits, rather than starting the browser’s sign-in', async () => {
    expect(await shown({ authenticated: false }, undefined)).toEqual(['loading'])
  })
})

describe('the app, signed in', () => {
  it.each([
    ['in an app', shell],
    ['in a plain browser', null],
  ])('%s: the portal', async (_, thisDevice) => {
    expect(await shown({ authenticated: true, user: { id: 'U' } }, thisDevice)).toEqual(['sidebar', 'router'])
  })
})
