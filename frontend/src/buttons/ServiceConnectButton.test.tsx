import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import type { SubnetReach } from '../hooks/useLocalSubnetName'

// What the connect panel shows for a service: its name here where an agent on this machine reaches it, else a terminal
// for SSH, its web address for a web service, else Connect. A device's name is shown, and opened, nowhere else.
const { state, openWebAddress, uiSet, clearError } = vi.hoisted(() => ({
  state: { reach: { checked: true } as any, webAddress: true as boolean | undefined, autoConnect: '' },
  openWebAddress: vi.fn(),
  clearError: vi.fn(),
  uiSet: vi.fn(),
}))

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ ui: { set: uiSet } }),
  useSelector: (select: any) => select({ ui: { autoConnect: state.autoConnect } }),
}))
// What it says of a service that is not web, and of one the gate or its limits leave out, is services/webAddress's.
vi.mock('../services/webAddress', () => ({ WEB_ADDRESS_WAIT_MS: 5_000 }))
vi.mock('../hooks/useWebAddress', async () => {
  const { useState } = await import('react')
  return {
    useWebTarget: (service?: IService) => service,
    useWebAddress: (service?: IService) => ([7, 8].includes(service?.typeID ?? 0) ? state.webAddress : false),
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
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetReach: () => state.reach, useLocalSignIn: () => null }))
vi.mock('../hooks/useDeviceApps', () => ({ useServiceApp: () => ({}) }))
vi.mock('../hooks/useApplication', () => ({
  useApplication: (service?: IService) => ({ web: [7, 8].includes(service?.typeID ?? 0) }),
}))
vi.mock('../hooks/useLocalPort', () => ({
  useLocalPort: () => ({ offered: false, local: undefined, others: [], busy: false, open: vi.fn() }),
}))
vi.mock('../helpers/connectionHelper', () => ({ clearConnectionError: clearError }))
vi.mock('../helpers/sshHelper', () => ({ opensTerminal: () => false }))
vi.mock('../services/localPorts', () => ({ wantsHttps: () => false }))
vi.mock('../services/graphQLDetectedScheme', () => ({ defaultHttpOnName: () => false }))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../components/GuideBubble', () => ({ GuideBubble: ({ children }: any) => <>{children}</> }))
vi.mock('../components/DesktopUI', () => ({ DesktopUI: () => null }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/ConnectionErrorMessage', () => ({ ConnectionErrorMessage: () => null }))
vi.mock('../components/LocalSignInNotice', () => ({ LocalSignInNotice: () => null }))
vi.mock('../components/LocalPortConnect', () => ({ LocalPortConnect: () => null }))
vi.mock('../components/LocalPortsListed', () => ({ LocalPortsListed: () => null }))
vi.mock('../components/AppTerminal', () => ({ AppTerminalOption: () => null }))
vi.mock('../components/Link', () => ({
  Link: ({ onClick, children }: any) => <a onClick={onClick}>{children}</a>,
}))
vi.mock('./ErrorButton', () => ({ ErrorButton: () => null }))
vi.mock('./ComboButton', () => ({
  ComboButton: ({ hold }: any) => <i data-panel="connect" data-hold={hold || undefined} />,
}))
vi.mock('../components/LocalSubnetConnect', () => ({
  LocalSubnetConnect: ({ local }: any) => <i data-panel="local" data-name={local.name} />,
}))
vi.mock('../components/WebAddressConnect', () => ({
  WebAddressConnect: ({ service, onOpened }: any) => (
    <i data-panel="web" data-service={service.id} onClick={onOpened} />
  ),
  WebAddressFailed: ({ reason }: any) => <em>{reason || 'failed'}</em>,
}))
vi.mock('../components/BrowserGatewayConnect', () => ({
  BrowserGatewayConnect: (props: any) => <i data-panel="terminal" data-props={JSON.stringify(props)} />,
}))

import { DeviceContext } from '../services/Context'
import { ServiceConnectButton } from './ServiceConnectButton'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const NAME = 'server-acme.on.solo.remote.it'
const HTTP = 7
const HTTPS = 8
const SSH = 28
const VNC = 4

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  container = document.createElement('div')
  root = createRoot(container)
  Object.assign(state, {
    reach: { checked: true, name: NAME } as SubnetReach,
    webAddress: true,
    autoConnect: '',
  })
  openWebAddress.mockReset().mockResolvedValue(true)
  uiSet.mockReset()
  clearError.mockReset()
  vi.useRealTimers()
})
afterEach(async () => {
  await act(async () => root.unmount())
})

async function render(typeID: number, port: number, connection: Partial<IConnection> = {}) {
  const service: IService = { ...DEFAULT_SERVICE, id: 'S1', deviceID: 'D1', name: 'Service', typeID, port }
  const device = { id: 'D1', services: [service] } as IDevice
  await act(async () =>
    root.render(
      <DeviceContext.Provider
        value={{ device, service, connection: { ...DEFAULT_CONNECTION, id: 'S1', ...connection } } as any}
      >
        <ServiceConnectButton />
      </DeviceContext.Provider>
    )
  )
}
const panels = () => [...container.querySelectorAll<HTMLElement>('[data-panel]')].map(panel => panel.dataset.panel)
const held = () => !!container.querySelector('[data-hold]')
const proxyLink = () =>
  [...container.querySelectorAll('a')].find(a => a.textContent === 'Connect through the proxy instead')

const WEB = [
  ['HTTPS on 443', HTTPS, 443, {}],
  ['plain HTTP on 80', HTTP, 80, {}],
  ['a web service on another port', HTTP, 8123, {}],
  ['a web service with a name of its own', HTTP, 8123, { port: 443 }],
] as const

describe('no agent on this machine reaches the service', () => {
  it.each(WEB)('%s has its web address, whatever its port, and no name', async (_what, typeID, port, reach) => {
    state.reach = { ...state.reach, ...reach }
    await render(typeID, port)
    expect(panels()).toEqual(['web'])
    expect(container.querySelector<HTMLElement>('[data-panel]')!.dataset.service).toBe('S1')
    expect(proxyLink()).toBeUndefined()
    expect(container.textContent).not.toContain(NAME)
  })

  it.each(WEB)('%s has Connect where it is not opened at one', async (_what, typeID, port, reach) => {
    state.reach = { ...state.reach, ...reach }
    state.webAddress = false
    await render(typeID, port)
    expect(panels()).toEqual(['connect'])
    expect(held()).toBe(false)
    expect(proxyLink()).toBeUndefined()
    expect(container.textContent).not.toContain(NAME)
  })

  it('a web service’s Connect is held until whether it is opened at one is known', async () => {
    state.webAddress = undefined
    await render(HTTPS, 443)
    expect(panels()).toEqual(['connect'])
    expect(held()).toBe(true)
    state.webAddress = false
    await render(HTTPS, 443)
    expect(held()).toBe(false)
  })

  it('and until whether an agent here reaches it is, but not for good', async () => {
    vi.useFakeTimers()
    state.reach = { checked: false, name: NAME }
    await render(HTTPS, 443)
    expect(panels()).toEqual(['connect'])
    expect(held()).toBe(true)
    await act(async () => vi.advanceTimersByTime(4_999))
    expect(held()).toBe(true)
    await act(async () => vi.advanceTimersByTime(1))
    expect(panels()).toEqual(['web'])
    // Answered late: the agent here has it after all.
    state.reach = { checked: true, name: NAME, local: { name: NAME } }
    await render(HTTPS, 443)
    expect(panels()).toEqual(['local'])
  })

  it('Connect is not held for a service the gate is off for, or that is not web, whatever is still unchecked', async () => {
    state.reach = { checked: false, name: NAME }
    state.webAddress = false
    await render(HTTPS, 443)
    expect(held()).toBe(false)
    state.webAddress = undefined
    await render(VNC, 5900)
    expect(held()).toBe(false)
  })

  it('an error its web address left is shown until it opens', async () => {
    await render(HTTPS, 443, { error: { message: 'No proxy is in service' } })
    expect(clearError).not.toHaveBeenCalled()
    await act(async () => container.querySelector<HTMLElement>('[data-panel="web"]')!.click())
    expect(clearError).toHaveBeenCalledOnce()
  })

  it('a web service’s connection started already is what is shown', async () => {
    await render(HTTPS, 443, { enabled: true })
    expect(panels()).toEqual(['connect'])
  })

  it('a service that is not web has Connect', async () => {
    await render(VNC, 5900)
    expect(panels()).toEqual(['connect'])
    expect(proxyLink()).toBeUndefined()
    expect(container.textContent).not.toContain(NAME)
  })

  it('a connection asked for on arrival is not left for the next Connect button', async () => {
    state.autoConnect = 'OTHER'
    await render(HTTPS, 443)
    state.autoConnect = 'S1'
    await render(VNC, 5900)
    expect(uiSet).not.toHaveBeenCalled()
    await render(HTTPS, 443)
    expect(uiSet).toHaveBeenCalledWith({ autoConnect: undefined })
  })

  it('SSH has its terminal, at its own port or its name’s, the proxy one step away', async () => {
    await render(SSH, 2222)
    expect(panels()).toEqual(['terminal'])
    const props = () => JSON.parse(container.querySelector<HTMLElement>('[data-panel]')!.dataset.props!)
    expect(props()).toEqual({ name: NAME, port: 2222, title: 'Service', service: 'S1', byCertificate: false })
    state.reach = { ...state.reach, port: 22 }
    await render(SSH, 2222)
    expect(props().port).toBe(22)

    await act(async () => proxyLink()!.click())
    expect(panels()).toEqual(['connect'])
  })

  it('SSH has Connect until that is known, and with no name', async () => {
    state.reach = { checked: false, name: NAME }
    await render(SSH, 22)
    expect(panels()).toEqual(['connect'])
    state.reach = { checked: true }
    await render(SSH, 22)
    expect(panels()).toEqual(['connect'])
  })

  it('a connection started already is what is shown, for SSH too', async () => {
    await render(SSH, 22, { enabled: true })
    expect(panels()).toEqual(['connect'])
  })
})

describe('an agent on this machine reaches the service', () => {
  beforeEach(() => {
    state.reach = { checked: true, name: NAME, local: { name: NAME } }
  })

  it.each([
    ['web', HTTPS, 443],
    ['web on another port', HTTP, 8123],
    ['SSH', SSH, 22],
    ['any other', VNC, 5900],
  ])('its name here is what is shown for %s', async (_what, typeID, port) => {
    await render(typeID, port)
    expect(panels()).toEqual(['local'])
    expect(container.querySelector<HTMLElement>('[data-panel]')!.dataset.name).toBe(NAME)
  })

  it.each([
    ['SSH', SSH, 22],
    ['any other', VNC, 5900],
  ])('the proxy is Connect for %s', async (_what, typeID, port) => {
    await render(typeID, port)
    await act(async () => proxyLink()!.click())
    expect(panels()).toEqual(['connect'])
    expect(openWebAddress).not.toHaveBeenCalled()
  })

  it('the proxy is its web address for a web service, its name here still shown', async () => {
    await render(HTTP, 8123)
    await act(async () => proxyLink()!.click())
    expect(openWebAddress).toHaveBeenCalledExactlyOnceWith('S1')
    expect(panels()).toEqual(['local'])
  })

  it('a web address that did not open is said under the link', async () => {
    openWebAddress.mockResolvedValue({ reason: 'No proxy is in service' })
    await render(HTTP, 8123)
    await act(async () => proxyLink()!.click())
    expect(container.querySelector('em')!.textContent).toBe('No proxy is in service')
  })

  it('the proxy is not offered for a web service until which it is is known', async () => {
    state.webAddress = undefined
    await render(HTTP, 8123)
    expect(panels()).toEqual(['local'])
    expect(proxyLink()).toBeUndefined()
  })

  it('an error left by the proxy is cleared', async () => {
    await render(HTTP, 8123, { error: { message: 'failed' } })
    expect(clearError).toHaveBeenCalled()
  })

  it('the proxy is Connect for a web service not opened at its web address', async () => {
    state.webAddress = false
    await render(HTTP, 8123)
    await act(async () => proxyLink()!.click())
    expect(panels()).toEqual(['connect'])
    expect(openWebAddress).not.toHaveBeenCalled()
  })
})
