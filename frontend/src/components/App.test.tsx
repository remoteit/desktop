import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// What the app shows signed out: in an app (a shell's thisDevice present) This device, the sign-in on it; in a plain
// browser the sign-in screen, as before; signed in, the portal in either.

const { state, device, viewport, mark, setUi } = vi.hoisted(() => ({
  state: { current: {} as any },
  device: { current: undefined as any },
  viewport: { width: 1440 },
  mark: (name: string) => () => React.createElement('div', { 'data-shown': name }),
  setUi: vi.fn(),
}))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (_k: string, text: string) => text }),
}))
vi.mock('react-redux', () => ({
  useSelector: (pick: any) => pick(state.current),
  useDispatch: () => ({ ui: { set: setUi } }),
}))
vi.mock('redux-persist/integration/react', () => ({ PersistGate: ({ children }: any) => <>{children}</> }))
vi.mock('../store', () => ({ persistor: {} }))
vi.mock('../services/browser', () => ({ default: { isMobile: false }, getLocalStorage: vi.fn() }))
vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../styling/theme', () => ({ getTheme: vi.fn() }))
vi.mock('../hooks/useSafeArea', () => ({ default: () => ({ insets: {} }) }))
vi.mock('../hooks/useCapacitor', () => ({ default: () => () => {} }))
vi.mock('../hooks/useViewportWidth', () => ({
  useViewportSelect: (select: (width: number) => unknown) => select(viewport.width),
  useViewportWiderThan: (width: number) => viewport.width >= width,
}))
vi.mock('../hooks/useThisDevice', () => ({ useThisDevice: () => device.current }))
vi.mock('../selectors/organizations', () => ({
  selectResellerRef: () => undefined,
  selectUserLimitsLookup: () => ({}),
}))
vi.mock('../services/chatPopout', () => ({ isChatPopout: false }))
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
import { ORGANIZATION_BAR_WIDTH, SIDEBAR_WIDTH } from '../constants'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function shown(
  auth: { authenticated: boolean; user?: object },
  thisDevice: any,
  path = '/devices',
  accounts: object = {}
) {
  state.current = {
    auth: { initialized: true, ...auth },
    binaries: { installed: true },
    ui: {},
    accounts: { membership: [], ...accounts },
    organization: { initialized: true },
  }
  device.current = thisDevice
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    )
  )
  dialog = container.querySelector('[data-offline-dialog]')?.getAttribute('data-offline-dialog')
  return [...container.querySelectorAll('[data-shown]')].map(e => e.getAttribute('data-shown'))
}
let dialog: string | null | undefined
const shell = { compatible: true, has: () => true }

beforeEach(() => {
  device.current = undefined
  viewport.width = 1440
  setUi.mockClear()
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

  it('shows mobile navigation on the device list and opens the terminal without portal chrome', async () => {
    viewport.width = 400
    const auth = { authenticated: true, user: { id: 'U' } }
    expect(await shown(auth, null)).toEqual(['sidebarMenu', 'router', 'bottomMenu'])
    expect(await shown(auth, null, '/terminal?name=console')).toEqual(['router'])
  })

  it('reserves the Organizations rail width for a standalone account without memberships', async () => {
    await shown({ authenticated: true, user: { id: 'U' } }, null, '/networks', { standaloneOrganizations: true })
    expect(setUi).toHaveBeenLastCalledWith({
      layout: expect.objectContaining({ showOrgs: true, sidePanelWidth: SIDEBAR_WIDTH + ORGANIZATION_BAR_WIDTH }),
    })
  })

  it('reserves only the sidebar width on an admin route even for an organization member', async () => {
    await shown({ authenticated: true, user: { id: 'U', admin: true } }, null, '/admin/users', {
      membership: [{ account: { id: 'org' } }],
    })
    expect(setUi).toHaveBeenLastCalledWith({
      layout: expect.objectContaining({ showOrgs: false, sidePanelWidth: SIDEBAR_WIDTH }),
    })
  })
})
