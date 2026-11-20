import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServicesPage } from './ServicesPage'
import type { ServiceShortcut } from '../services/graphQLServiceShortcuts'

const { state, list, open } = vi.hoisted(() => ({
  state: { account: 'my-account' },
  list: vi.fn(),
  open: vi.fn(),
}))

vi.mock('react-redux', () => ({ useSelector: () => state.account }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useServiceShortcutsSupport', () => ({
  useServiceShortcutsSupport: () => ({ available: true, namedAddress: true }),
}))
vi.mock('../services/graphQLServiceShortcuts', () => ({ graphQLServiceShortcuts: list }))
vi.mock('../services/browserGateway', () => ({ openThroughGateway: open }))
vi.mock('../components/Container', () => ({
  Container: ({ children, header }: { children: React.ReactNode; header: React.ReactNode }) => (
    <>
      {header}
      {children}
    </>
  ),
}))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div>Loading</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: React.PropsWithChildren) => <div>{children}</div> }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button onClick={onClick}>{title}</button>
  ),
}))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const home: ServiceShortcut = {
  id: 'home',
  name: 'Home Assistant',
  state: 'active',
  enabled: true,
  application: 7,
  subnetName: 'home-acme.on.remote.it',
  subnetOwnName: true,
  subnetPort: 443,
  device: { id: 'server', name: 'Home server' },
}
const shell: ServiceShortcut = {
  id: 'shell',
  name: 'Build shell',
  state: 'inactive',
  enabled: true,
  application: 28,
  device: { id: 'builder', name: 'Linux builder' },
}

let root: ReturnType<typeof createRoot> | undefined
afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  root = undefined
  state.account = 'my-account'
  vi.resetAllMocks()
})

describe('Services page', () => {
  it('lists named and unnamed destinations, shows offline status, and opens the correct service', async () => {
    list.mockResolvedValue([home, shell])
    open.mockResolvedValue(true)
    const container = document.createElement('div')
    root = createRoot(container)
    await act(async () =>
      root?.render(
        <MemoryRouter>
          <ServicesPage />
        </MemoryRouter>
      )
    )
    expect(list).toHaveBeenCalledWith('my-account', true)
    const [first, second] = [...container.querySelectorAll('li')]
    expect(first.textContent).toContain('Build shell')
    expect(first.textContent).toContain('Linux builder · Offline')
    expect(first.querySelector('a:last-child')?.getAttribute('href')).toBe('/devices/builder/shell/connect')
    expect(second.textContent).toContain('Home Assistant')
    await act(async () => second.querySelector('button')?.click())
    expect(open).toHaveBeenCalledWith('home-acme.on.remote.it')
  })

  it('clears the old account’s shortcuts on a switch', async () => {
    list.mockResolvedValueOnce([home]).mockResolvedValueOnce([])
    const container = document.createElement('div')
    root = createRoot(container)
    const render = () =>
      root?.render(
        <MemoryRouter>
          <ServicesPage />
        </MemoryRouter>
      )
    await act(async () => render())
    expect(container.textContent).toContain('Home Assistant')
    state.account = 'other-account'
    await act(async () => render())
    expect(list).toHaveBeenLastCalledWith('other-account', true)
    expect(container.textContent).toContain('No services to show')
    expect(container.textContent).not.toContain('Home Assistant')
  })
})
