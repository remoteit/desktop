import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServicesPage } from './ServicesPage'
import type { ServiceShortcut } from '../services/graphQLServiceShortcuts'

const { state, list, openServiceURL, openWebAddress, allowed, recheck } = vi.hoisted(() => ({
  state: {
    account: 'my-account',
    applicationTypes: { all: [{ id: 48, proxy: true, scheme: '' }] },
    localNames: {} as Record<string, string>,
    checked: true,
    webAddresses: false as boolean | undefined,
  },
  openWebAddress: vi.fn(),
  allowed: vi.fn(),
  recheck: vi.fn(),
  list: vi.fn(),
  openServiceURL: vi.fn(),
}))

vi.mock('react-redux', () => ({ useSelector: (select: (value: typeof state) => unknown) => select(state) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (value: typeof state) => value.account }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useLocalSubnetName', () => ({
  useSubnetReach: (_deviceId?: string, serviceId?: string) => {
    const name = serviceId && state.localNames[serviceId]
    return serviceId
      ? { name: 'home-acme.on.remote.it', checked: state.checked, local: name ? { name } : undefined }
      : { checked: false }
  },
}))
vi.mock('../hooks/useWebAddress', async () => {
  const { useState } = await import('react')
  return {
    useWebAddress: (target: any) =>
      target.web !== false && state.webAddresses ? allowed(target) : state.webAddresses && false,
    useRecheck: () => ({ checking: false, recheck }),
    useOpenWebAddress: (id: string) => {
      const [failed, setFailed] = useState<{ reason: string }>()
      const open = async () => {
        const result = await openWebAddress(id)
        setFailed(result === true ? undefined : result)
      }
      return { open, failed }
    },
  }
})
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
  state.checked = true
  state.webAddresses = false
  vi.resetAllMocks()
})

async function renderPage() {
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () =>
    root?.render(
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>
    )
  )
  return container
}

describe('a web service where the new proxies are enabled', () => {
  beforeEach(() => {
    state.webAddresses = true
    allowed.mockReturnValue(true)
    openWebAddress.mockResolvedValue(true)
  })

  it.each([443, 8123, 80])('on port %i opens at its web address where no agent here reaches it', async subnetPort => {
    list.mockResolvedValue([{ ...home, subnetPort }])
    const row = (await renderPage()).querySelector('li')!
    await act(async () => row.querySelector('button')!.click())
    expect(openWebAddress).toHaveBeenCalledExactlyOnceWith('home')
    expect(openServiceURL).not.toHaveBeenCalled()
  })

  it('opens its name where an agent here reaches it', async () => {
    state.localNames = { home: 'home-acme.on.remote.it' }
    list.mockResolvedValue([home])
    const row = (await renderPage()).querySelector('li')!
    await act(async () => row.querySelector('button')!.click())
    expect(openServiceURL.mock.calls).toEqual([['https://home-acme.on.remote.it']])
    expect(openWebAddress).not.toHaveBeenCalled()
  })

  it('has Connect until it is known whether an agent here reaches it', async () => {
    state.checked = false
    list.mockResolvedValue([home])
    expect((await renderPage()).querySelector('li button')).toBeNull()
  })

  it('has Connect where its web address is not the portal’s to open, which its route says in part', async () => {
    list.mockResolvedValue([{ ...home, attributes: { $remoteit: { route: 'p2p' } } }])
    for (const known of [false, undefined]) {
      allowed.mockReturnValue(known)
      expect((await renderPage()).querySelector('li button')).toBeNull()
      await act(async () => root?.unmount())
    }
    expect(allowed).toHaveBeenCalledWith({ id: 'home', deviceID: 'server', route: 'p2p', web: true, type: 7 })
  })

  it('is tried again where it could not be checked, with nothing to open; not where an agent here reaches it', async () => {
    allowed.mockReturnValue('UNCHECKED')
    list.mockResolvedValue([home])
    let row = (await renderPage()).querySelector('li')!
    expect(row.textContent).toContain('Could not check how this service opens, so it was not connected. Try again.')
    expect(row.querySelector(':scope > a')).toBeNull()
    expect(row.querySelector('button')!.textContent).toBe('Try again')
    await act(async () => row.querySelector('button')!.click())
    expect(recheck).toHaveBeenCalledOnce()
    expect(openWebAddress).not.toHaveBeenCalled()
    await act(async () => root?.unmount())
    state.localNames = { home: 'home-acme.on.remote.it' }
    row = (await renderPage()).querySelector('li')!
    expect(row.textContent).not.toContain('Could not check')
    expect(row.querySelector('button')!.textContent).toBe('Open')
  })

  it('of a type not known yet is tried again where it could not be checked, its name not opened meanwhile', async () => {
    const types = state.applicationTypes.all
    state.applicationTypes.all = []
    allowed.mockReturnValue('UNCHECKED')
    state.localNames = { screen: 'x.on.remote.it' }
    list.mockResolvedValue([{ ...home, id: 'screen', application: 48, subnetPort: 8959 }])
    const row = (await renderPage()).querySelector('li')!
    expect(allowed.mock.calls[0][0]).toMatchObject({ web: undefined, type: 48 })
    expect(row.querySelector('button')!.textContent).toBe('Try again')
    state.applicationTypes.all = types
  })

  it('has Connect for a service that is not web, or is offline', async () => {
    list.mockResolvedValue([
      { ...shell, state: 'active', subnetName: 'x', subnetPort: 22 },
      { ...home, state: 'inactive' },
    ])
    expect((await renderPage()).querySelector('li button')).toBeNull()
  })

  it('says one that did not open, in graphql’s words where it refused, and has Connect then', async () => {
    openWebAddress.mockResolvedValue({ reason: 'No proxy is in service' })
    list.mockResolvedValue([home])
    const row = (await renderPage()).querySelector('li')!
    await act(async () => row.querySelector('button')!.click())
    expect(row.textContent).toContain('No proxy is in service')
    expect(row.querySelector('button')).toBeNull()
    expect(row.querySelector(':scope > a')!.textContent).toBe('Connect')
  })
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

  it('a device’s name, answered by an agent in place of the service’s own, is not opened at the own name’s port', async () => {
    state.localNames = { home: 'server-acme.on.remote.it' }
    list.mockResolvedValue([home])
    const container = document.createElement('div')
    root = createRoot(container)
    await act(async () =>
      root?.render(
        <MemoryRouter>
          <ServicesPage />
        </MemoryRouter>
      )
    )
    const [row] = [...container.querySelectorAll('li')]
    expect(row.querySelector('button')).toBeNull()
    expect(row.querySelector(':scope > a')?.textContent).toBe('Connect')
    expect(openServiceURL).not.toHaveBeenCalled()
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
