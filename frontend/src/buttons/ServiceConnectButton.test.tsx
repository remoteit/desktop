import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { getApplication } from '@common/applications'

const { env, reach, reachable, port, create, listed, openTerminal } = vi.hoisted(() => ({
  env: { hasBackend: false, isNative: false, isIOSDeviceApp: false },
  reach: { value: { checked: true } as any },
  reachable: { value: undefined as boolean | undefined },
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
vi.mock('../helpers/terminalHelper', () => ({ openTerminal }))
vi.mock('../hooks/useApplication', () => ({
  useApplication: (service?: IService, connection?: IConnection) => getApplication(service, connection),
}))
vi.mock('../hooks/useLocalSubnetName', () => ({
  useSubnetReach: () => reach.value,
  useLocalSignIn: () => null,
  useSubnetName: () => undefined,
}))
vi.mock('../hooks/useAddressReachable', () => ({ useAddressReachable: () => reachable.value }))
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
vi.mock('../services/browserGateway', () => ({
  gatewayURL: (name: string) => `https://${name}/`,
  openThroughGateway: vi.fn(async () => true),
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
    reachable.value = undefined
    port.value = { offered: false, others: [], busy: false, open: vi.fn() }
    create.mockReset()
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

  it('a browser and a web service: opens it in the browser, a public address one click away', async () => {
    await render(webService)
    expect(primary().getAttribute('data-route')).toBe('browser')
    expect(primaryLabel()).toBe('Open in browser')
    expect(more()).toHaveLength(1)
  })

  it('a browser and a web service whose address does not resolve: a signed-in public address first', async () => {
    reachable.value = false
    await render(webService)
    expect(primary().getAttribute('data-route')).toBe('public')
    expect(primaryLabel()).toBe('Open in browser')
    expect(primary().textContent).toContain('Visitors sign in with Remote.It')
    expect(more()[0]).toContain("This address doesn't open from here yet")
  })

  it('a browser and an ssh service: opens a terminal', async () => {
    await render(sshService)
    expect(primary().getAttribute('data-route')).toBe('terminal')
    expect(primaryLabel()).toBe('Open terminal')
    await act(async () => primary().querySelector('button')!.click())
    expect(openTerminal).toHaveBeenCalledWith(expect.objectContaining({ name: NAME, port: 22, service: 'S2' }))
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
    reachable.value = false
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
