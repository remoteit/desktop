import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { getApplication } from '@common/applications'

const { env, reach, port, create, listed, openTerminal } = vi.hoisted(() => ({
  env: { hasBackend: false, isNative: false, isIOSDeviceApp: false },
  reach: { value: { checked: true } as any },
  port: { value: { offered: false, others: [], busy: false } as any },
  create: vi.fn(),
  listed: vi.fn(),
  openTerminal: vi.fn(),
}))

vi.mock('react-redux', () => ({
  useSelector: (select: (state: any) => any) => select({}),
  useDispatch: () => ({ connections: { connect: vi.fn() }, networks: { join: vi.fn() } }),
}))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))
vi.mock('../models/applicationTypes', async importOriginal => ({
  ...(await importOriginal<object>()),
  isReverseProxy: (_: any, typeId?: number) => typeId === 8,
}))
vi.mock('../services/browser', () => ({ default: env, openServiceURL: vi.fn(), openInSystem: vi.fn() }))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../helpers/connectionHelper', () => ({ clearConnectionError: vi.fn(), saveLaunchTokens: vi.fn() }))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal, inApp: () => false }))
vi.mock('../hooks/useApplication', () => ({
  useApplication: (service?: IService, connection?: IConnection) => getApplication(service, connection),
}))
vi.mock('../hooks/useLocalSubnetName', () => ({
  useSubnetReach: () => reach.value,
  useLocalSignIn: () => null,
  useSubnetName: () => undefined,
}))
vi.mock('../hooks/useLocalPort', () => ({ useLocalPort: () => port.value }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true, selectDeviceSessions: () => true }))
vi.mock('../hooks/useDeviceApps', () => ({ useServiceApp: () => ({}) }))
vi.mock('../services/graphQLDetectedScheme', () => ({
  HTTP_TYPE: 8,
  graphQLDetectedSchemes: async () => ({}),
  redirectLoops: () => false,
}))
vi.mock('../services/graphQLProxy', () => ({ graphQLServiceEndpoints: listed, graphQLCreateEndpoint: create }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../components/EndpointsAccordion', () => ({ refreshEndpoints: vi.fn() }))
vi.mock('../components/LocalSignInNotice', () => ({ LocalSignInNotice: () => null }))
vi.mock('../services/localPorts', () => ({
  wantsHttps: () => false,
  listedWhose: () => '',
  localPortHost: () => '',
  localPortWebURL: () => '',
  namesResolve: async () => true,
  setNamesResolve: vi.fn(),
}))
vi.mock('../services/localSubnet', () => ({
  subnetWebURL: (name: string, port: number) => (port === 443 ? `https://${name}` : `https://${name}:${port}`),
}))
vi.mock('../components/GuideBubble', () => ({ GuideBubble: ({ children }: any) => <>{children}</> }))
vi.mock('../components/ConnectionErrorMessage', () => ({ ConnectionErrorMessage: () => null }))
vi.mock('../components/AppTerminal', () => ({ AppTerminalOption: () => null }))
vi.mock('../components/LocalPortsListed', () => ({ LocalPortsListed: () => null }))
vi.mock('../components/PromptModal', () => ({ PromptModal: () => null }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: () => null }))
vi.mock('../buttons/ErrorButton', () => ({ ErrorButton: () => null }))
vi.mock('../buttons/ComboButton', () => ({ ComboButton: () => <button data-testid="combo">Connect</button> }))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, children }: any) => (open ? <div data-testid="confirm">{children}</div> : null),
}))

import { ServiceConnectButton } from './ServiceConnectButton'
import { DeviceContext } from '../services/Context'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const NAME = 'web-jamie.on.solo.remote.it'
const webService: IService = {
  ...DEFAULT_SERVICE,
  id: 'S1',
  deviceID: 'D1',
  name: 'Web',
  typeID: 8,
  port: 80,
  attributes: {},
}
const sshService: IService = { ...webService, id: 'S2', name: 'SSH', typeID: 28, port: 22 }
const device = { id: 'D1', permissions: ['CONNECT', 'MANAGE'], services: [webService, sshService] } as any

describe('ServiceConnectButton', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    env.hasBackend = false
    reach.value = { name: NAME, checked: true }
    port.value = { offered: false, others: [], busy: false, open: vi.fn() }
    create.mockReset()
    openTerminal.mockReset().mockReturnValue(true)
    listed.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = async (service: IService, connection: Partial<IConnection> = {}) =>
    act(async () =>
      root.render(
        <DeviceContext.Provider
          value={
            {
              device,
              service,
              connection: { ...DEFAULT_CONNECTION, id: service.id, typeID: service.typeID, ...connection },
              instance: { permissions: ['CONNECT'] },
            } as any
          }
        >
          <ServiceConnectButton />
        </DeviceContext.Provider>
      )
    )
  const primary = () => container.querySelector('[data-testid="connect-primary"]')!
  const primaryLabel = () => primary().querySelector('button')?.textContent
  const more = () =>
    [...container.querySelectorAll('[data-testid="connect-more"] li')].map(row => row.textContent || '')

  it('the app with Access on: opens the web service by its address', async () => {
    reach.value = { name: NAME, checked: true, local: { name: NAME } }
    await render(webService)
    expect(primary().getAttribute('data-route')).toBe('address')
    expect(primaryLabel()).toBe('Open in browser')
    expect(primary().textContent).toContain('Through Access on this computer')
    expect(more()[0]).toContain('Connect through a public address')
  })

  it.each([
    ['HTTPS on 443', { typeID: 8, port: 443 }, {}],
    ['plain HTTP on 80', { typeID: 8, port: 80 }, {}],
    ['a web service on another port', { typeID: 8, port: 8123 }, {}],
    ['a web service with a name of its own', { typeID: 8, port: 8123 }, { port: 443 }],
    ['a service that is not web', { typeID: 4, port: 5900 }, {}],
  ])('no agent here reaches %s: a public address, its address not shown, Access named', async (_, kind, more) => {
    reach.value = { ...reach.value, ...more }
    await render({ ...webService, ...kind })
    expect(primary().getAttribute('data-route')).toBe('public')
    expect(container.textContent).not.toContain(NAME)
    expect(container.querySelector('[data-testid="connect-no-agent"]')?.textContent).toContain('with Access on')
  })

  it('a browser and an ssh service: opens a terminal', async () => {
    await render(sshService)
    expect(primary().getAttribute('data-route')).toBe('terminal')
    expect(primaryLabel()).toBe('Open terminal')
    await act(async () => primary().querySelector('button')!.click())
    expect(openTerminal).toHaveBeenCalledExactlyOnceWith({ name: NAME, port: 22, title: 'SSH', service: 'S2' })
    expect(container.querySelector('[data-testid="connect-no-agent"]')).toBeNull()
    expect(more()[0]).toContain('Connect through a public address')
  })

  it('an ssh service: its terminal at its name’s port where it has one', async () => {
    reach.value = { name: NAME, checked: true, port: 2222 }
    await render(sshService)
    await act(async () => primary().querySelector('button')!.click())
    expect(openTerminal).toHaveBeenCalledWith(expect.objectContaining({ port: 2222 }))
  })

  it('an ssh service: a public address until its address is known, and with none', async () => {
    reach.value = { name: NAME, checked: false }
    await render(sshService)
    expect(primary().getAttribute('data-route')).toBe('checking')
    reach.value = { checked: true }
    await render(sshService)
    expect(primary().getAttribute('data-route')).toBe('public')
  })

  it('a connection started already leads, for ssh too', async () => {
    await render(sshService, { enabled: true })
    expect(primary().getAttribute('data-route')).toBe('public')
  })

  it.each([
    ['web', { typeID: 8, port: 443 }],
    ['web on another port', { typeID: 8, port: 8123 }],
    ['ssh', { typeID: 28, port: 22 }],
    ['any other', { typeID: 4, port: 5900 }],
  ])('an agent here reaches %s: its address leads, a public address one step away', async (_, kind) => {
    reach.value = { name: NAME, checked: true, local: { name: NAME } }
    await render({ ...webService, ...kind })
    expect(primary().getAttribute('data-route')).toBe('address')
    expect(primary().textContent).toContain(NAME)
    expect(more().some(row => row.includes('Connect through a public address'))).toBe(true)
  })

  it('a computer that offers a local port and nothing better: the local port', async () => {
    env.hasBackend = true
    reach.value = { checked: true }
    port.value = { ...port.value, offered: true }
    await render(sshService)
    expect(primary().getAttribute('data-route')).toBe('localPort')
    expect(primaryLabel()).toBe('Connect')
    await act(async () => primary().querySelector('button')!.click())
    expect(port.value.open).toHaveBeenCalled()
    expect(more()[0]).toContain('Starts a connection from this computer')
  })

  it('nothing else: Connect, through a public address only the first device may use', async () => {
    reach.value = { checked: true }
    await render(sshService)
    expect(primary().getAttribute('data-route')).toBe('public')
    expect(primaryLabel()).toBe('Connect')
    expect(primary().textContent).toContain('Through a public address. Only the first device to connect can use it.')
    expect(container.querySelector('[data-testid="connect-more"]')).toBeNull()
  })

  it('a signed-in public address: one the person has is opened again, never one open to anyone made', async () => {
    listed.mockResolvedValue([
      { kind: 'https', access: 'public', url: 'https://open.example' },
      { kind: 'https', access: 'signed-in', url: 'https://mine.example' },
    ])
    const tab = { location: { href: '' }, close: vi.fn(), opener: {} }
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as any)
    await render(webService)
    await act(async () => primary().querySelector('button')!.click())
    expect(create).not.toHaveBeenCalled()
    expect(tab.location.href).toBe('https://mine.example')

    listed.mockResolvedValue([])
    create.mockResolvedValue({ data: { data: { createEndpoint: { url: 'https://new.example' } } } })
    await render({ ...webService, id: 'S3' })
    await act(async () => primary().querySelector('button')!.click())
    expect(create).toHaveBeenCalledWith('S3', { kind: 'https', access: 'signed-in', lifetime: 'temporary' })
    expect(tab.location.href).toBe('https://new.example')
    open.mockRestore()
  })
})
