import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServicesPage } from './ServicesPage'
import type { ServiceShortcut } from '../services/graphQLServiceShortcuts'

const { state, list, openServiceURL } = vi.hoisted(() => ({
  state: {
    account: 'my-account',
    applicationTypes: { all: [{ id: 48, proxy: true, scheme: '' }] },
    localNames: {} as Record<string, string>,
  },
  list: vi.fn(),
  openServiceURL: vi.fn(),
}))

vi.mock('react-redux', () => ({ useSelector: (select: (value: typeof state) => unknown) => select(state) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (value: typeof state) => value.account }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useLocalSubnetName', () => ({
  useLocalSubnetName: (_deviceId?: string, serviceId?: string) => {
    const name = serviceId && state.localNames[serviceId]
    return name ? { name } : undefined
  },
}))
vi.mock('../hooks/useServiceShortcutsSupport', () => ({
  useServiceShortcutsSupport: () => ({ available: true, namedAddress: true }),
}))
vi.mock('../services/graphQLServiceShortcuts', () => ({ graphQLServiceShortcuts: list }))
vi.mock('../services/browser', () => ({ default: {}, openServiceURL }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn() }))
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
  state.localNames = {}
  vi.resetAllMocks()
})

describe('Services page', () => {
  it('lists services, shows offline status, and opens the name of one an agent here reaches', async () => {
    state.localNames = { home: 'home-acme.on.remote.it' }
    list.mockResolvedValue([home, shell])
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
    expect(openServiceURL.mock.calls).toEqual([['https://home-acme.on.remote.it']])
  })

  it.each([443, 8123])(
    'has Connect, and no name to open, on port %i where no agent here reaches it',
    async subnetPort => {
      list.mockResolvedValue([{ ...home, subnetPort }])
      const container = document.createElement('div')
      root = createRoot(container)
      await act(async () =>
        root?.render(
          <MemoryRouter>
            <ServicesPage />
          </MemoryRouter>
        )
      )
      const row = container.querySelector('li')!
      expect(row.querySelector('button')).toBeNull()
      const connect = row.querySelector(':scope > a')!
      expect(connect.textContent).toBe('Connect')
      expect(connect.getAttribute('href')).toBe('/devices/server/home/connect')
    }
  )

  it('opens reachable web services at their respective ports on a shared device name', async () => {
    const subnetName = 'server-acme.on.remote.it'
    state.localNames = { home: subnetName, screen: subnetName }
    list.mockResolvedValue([
      { ...home, id: 'screen', name: 'ScreenView', application: 48, subnetName, subnetPort: 8959 },
      { ...home, subnetName, subnetPort: 8123 },
      { ...shell, state: 'active', subnetName, subnetPort: 22 },
      { ...home, id: 'unreachable', name: 'Unreachable web service', subnetName, subnetPort: 3000 },
    ])
    const container = document.createElement('div')
    root = createRoot(container)
    await act(async () =>
      root?.render(
        <MemoryRouter>
          <ServicesPage />
        </MemoryRouter>
      )
    )
    const [shellRow, homeRow, screenRow, unreachableRow] = [...container.querySelectorAll('li')]
    expect(shellRow.querySelector(':scope > a')?.textContent).toBe('Connect')
    expect(unreachableRow.querySelector(':scope > a')?.textContent).toBe('Connect')
    expect(homeRow.querySelector('button')?.textContent).toBe('Open')
    expect(screenRow.querySelector('button')?.textContent).toBe('Open')
    await act(async () => homeRow.querySelector('button')?.click())
    await act(async () => screenRow.querySelector('button')?.click())
    expect(openServiceURL.mock.calls).toEqual([[`https://${subnetName}:8123`], [`https://${subnetName}:8959`]])
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
