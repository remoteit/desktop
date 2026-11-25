import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import type { SubnetReach } from '../hooks/useLocalSubnetName'

// What the connect panel shows for a service: its name here where an agent on this machine reaches it, else a terminal
// for SSH, else Connect. A device's name is shown, and opened, nowhere else.
const { state } = vi.hoisted(() => ({
  state: { reach: { checked: true } as any, onPort: false, certificate: false },
}))

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetReach: () => state.reach, useLocalSignIn: () => null }))
vi.mock('../hooks/useDeviceApps', () => ({ useServiceApp: () => ({}) }))
vi.mock('../hooks/useApplication', () => ({
  useApplication: (service?: IService) => ({ web: [7, 8].includes(service?.typeID ?? 0) }),
}))
vi.mock('../hooks/useLocalPort', () => ({
  useLocalPort: () => ({ offered: false, local: undefined, others: [], busy: false, open: vi.fn() }),
}))
vi.mock('../helpers/connectionHelper', () => ({ clearConnectionError: vi.fn() }))
vi.mock('../helpers/sshHelper', () => ({ opensTerminal: () => state.certificate }))
vi.mock('../services/localPorts', () => ({ wantsHttps: () => false }))
vi.mock('../services/graphQLDetectedScheme', () => ({ HTTP_TYPE: 7 }))
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
vi.mock('./ComboButton', () => ({ ComboButton: () => <i data-panel="connect" /> }))
vi.mock('../components/LocalSubnetConnect', () => ({
  LocalSubnetConnect: ({ local }: any) => <i data-panel="local" data-name={local.name} />,
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
  state.reach = { checked: true, name: NAME } as SubnetReach
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
const proxyLink = () =>
  [...container.querySelectorAll('a')].find(a => a.textContent === 'Connect through the proxy instead')

describe('no agent on this machine reaches the service', () => {
  it.each([
    ['HTTPS on 443', HTTPS, 443, {}],
    ['plain HTTP on 80', HTTP, 80, {}],
    ['a web service on another port', HTTP, 8123, {}],
    ['a web service with a name of its own', HTTP, 8123, { port: 443 }],
    ['a service that is not web', VNC, 5900, {}],
  ])('%s has Connect, and its name is not shown', async (_what, typeID, port, reach) => {
    state.reach = { ...state.reach, ...reach }
    await render(typeID, port)
    expect(panels()).toEqual(['connect'])
    expect(proxyLink()).toBeUndefined()
    expect(container.textContent).not.toContain(NAME)
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
  it.each([
    ['web', HTTPS, 443],
    ['web on another port', HTTP, 8123],
    ['SSH', SSH, 22],
    ['any other', VNC, 5900],
  ])('its name here is what is shown for %s, the proxy one step away', async (_what, typeID, port) => {
    state.reach = { checked: true, name: NAME, local: { name: NAME } }
    await render(typeID, port)
    expect(panels()).toEqual(['local'])
    expect(container.querySelector<HTMLElement>('[data-panel]')!.dataset.name).toBe(NAME)
    await act(async () => proxyLink()!.click())
    expect(panels()).toEqual(['connect'])
  })
})
