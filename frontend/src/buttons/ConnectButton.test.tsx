import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'

// Connect, wherever it is: a device's list of services, a chip in a list, the service's own page.
const { state, dispatch, push, openWeb } = vi.hoisted(() => ({
  state: {
    webAddress: false as boolean | undefined | 'UNCHECKED',
    opening: false,
    autoConnect: undefined as string | undefined,
  },
  dispatch: {
    ui: { set: vi.fn() },
    connections: { connect: vi.fn(), disconnect: vi.fn(), onClose: vi.fn(), setConnectLink: vi.fn() },
    networks: { join: vi.fn() },
  },
  push: vi.fn(),
  openWeb: vi.fn(),
}))
vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (select: any) => select({ ui: { autoConnect: state.autoConnect } }),
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../services/browser', () => ({ default: { hasBackend: false } }))
vi.mock('../helpers/connectionHelper', () => ({
  connectionState: (service?: IService, connection?: IConnection) =>
    service?.state === 'inactive' ? 'offline' : connection?.enabled ? 'connected' : 'disconnected',
  newConnection: (service: IService) => ({ id: service.id, isNew: true }),
  launchDisabled: () => false,
}))
vi.mock('../components/LicenseChip', () => ({ getLicenseChip: () => undefined }))
vi.mock('../hooks/useWebAddress', () => ({
  useWebTarget: (service?: IService) => service && { id: service.id, web: service.typeID === 7 },
  useWebAddress: (target?: any) => (target?.web ? state.webAddress : false),
  useOpenWebService: (target?: any) => ({ opening: state.opening, open: () => openWeb(target.id) }),
}))
vi.mock('./DynamicButton', () => ({
  DynamicButton: ({ title, onClick, disabled, loading }: any) => (
    <button onClick={onClick} disabled={disabled} data-loading={!!loading}>
      {title}
    </button>
  ),
}))

import { ConnectButton, ConnectButtonProps } from './ConnectButton'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const WEB = 7
const service = (set: Partial<IService> = {}): IService => ({
  ...DEFAULT_SERVICE,
  id: 'S1',
  deviceID: 'D1',
  state: 'active',
  typeID: WEB,
  attributes: {},
  ...set,
})
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(state, { webAddress: true, opening: false, autoConnect: undefined })
  dispatch.connections.connect.mockResolvedValue(undefined)
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
})
const render = (props: Partial<ConnectButtonProps> = {}) =>
  act(async () => root.render(<ConnectButton service={service()} permissions={['CONNECT']} {...props} />))
const button = () => container.querySelector('button')!
const click = () => act(async () => button().click())

describe('a web service opened at its web address', () => {
  it('is opened on the click, with no connection and none listed; its row is still gone to', async () => {
    const onClick = vi.fn()
    await render({ onClick })
    await click()
    expect(openWeb).toHaveBeenCalledExactlyOnceWith('S1')
    expect(dispatch.connections.connect).not.toHaveBeenCalled()
    expect(dispatch.networks.join).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is opened synchronously with the click: a tab is the click’s to reserve', async () => {
    await render()
    let during = 0
    await act(async () => {
      button().click()
      during = openWeb.mock.calls.length
    })
    expect(during).toBe(1)
  })

  it('cannot be opened again while it is', async () => {
    state.opening = true
    await render()
    expect(button().disabled).toBe(true)
  })

  it('asked for with no click is not opened: what connects is asked, which goes to its page', async () => {
    dispatch.connections.connect.mockResolvedValue(false)
    state.autoConnect = 'S1'
    await render()
    expect(openWeb).not.toHaveBeenCalled()
    expect(dispatch.ui.set).toHaveBeenCalledWith({ autoConnect: undefined })
    expect(dispatch.connections.connect).toHaveBeenCalledOnce()
    expect(dispatch.networks.join).not.toHaveBeenCalled()
  })

  it('does not say it will launch, which is all it does', async () => {
    await render({ connection: { ...DEFAULT_CONNECTION, id: 'S1', autoLaunch: true } })
    expect(button().textContent).toBe('Connect')
    state.webAddress = false
    await render({ connection: { ...DEFAULT_CONNECTION, id: 'S1', autoLaunch: true } })
    expect(button().textContent).toBe('Connect + Launch')
  })

  it('a connection it has already is disconnected, as ever', async () => {
    await render({ connection: { ...DEFAULT_CONNECTION, id: 'S1', enabled: true } })
    await click()
    expect(dispatch.connections.disconnect).toHaveBeenCalledOnce()
    expect(openWeb).not.toHaveBeenCalled()
  })
})

describe('until whether it is is known', () => {
  it('Connect is held, then starts what it is', async () => {
    state.webAddress = undefined
    state.autoConnect = 'S1'
    await render()
    expect(button().disabled).toBe(true)
    expect(button().dataset.loading).toBe('true')
    expect(dispatch.connections.connect).not.toHaveBeenCalled()
    state.webAddress = false
    await render()
    expect(button().disabled).toBe(false)
    expect(dispatch.connections.connect).toHaveBeenCalledOnce() // asked for on arrival, and waited for
  })

  it('and where its page holds it', async () => {
    await render({ hold: true })
    expect(button().disabled).toBe(true)
  })

  it('a connection is stopped all the same, and a service that is not web is not held', async () => {
    state.webAddress = undefined
    await render({ connection: { ...DEFAULT_CONNECTION, id: 'S1', enabled: true } })
    expect(button().disabled).toBe(false)
    await render({ service: service({ typeID: 28 }) })
    expect(button().disabled).toBe(false)
    await click()
    expect(dispatch.connections.connect).toHaveBeenCalledOnce()
  })
})

describe('one that could not be checked', () => {
  beforeEach(() => void (state.webAddress = 'UNCHECKED'))

  it('is checked again as it is asked for, by what connects it: once at a time, and not listed where it was not', async () => {
    let done: (value: unknown) => void = () => {}
    dispatch.connections.connect.mockReturnValue(new Promise(resolve => (done = resolve)))
    await render()
    expect(button().disabled).toBe(false)
    await click()
    expect(button().disabled).toBe(true)
    expect(openWeb).not.toHaveBeenCalled()
    await act(async () => done(false))
    expect(button().disabled).toBe(false)
    expect(dispatch.connections.connect).toHaveBeenCalledOnce()
    expect(dispatch.networks.join).not.toHaveBeenCalled()
  })

  it('asked for on arrival is asked of what connects it, once', async () => {
    dispatch.connections.connect.mockResolvedValue(false)
    state.autoConnect = 'S1'
    await render()
    state.autoConnect = undefined
    await render()
    expect(dispatch.connections.connect).toHaveBeenCalledOnce()
    expect(openWeb).not.toHaveBeenCalled()
  })

  it('does not say it will launch', async () => {
    await render({ connection: { ...DEFAULT_CONNECTION, id: 'S1', autoLaunch: true } })
    expect(button().textContent).toBe('Connect')
  })
})

describe('a service not opened at its web address', () => {
  it.each([
    ['web, the gate off', service()],
    ['not web', service({ typeID: 28 })],
  ])('is connected, as ever: %s', async (_what, of) => {
    state.webAddress = false
    await render({ service: of })
    await click()
    expect(dispatch.connections.connect).toHaveBeenCalledExactlyOnceWith({
      id: 'S1',
      isNew: true,
      connectOnReady: true,
    })
    expect(dispatch.networks.join).toHaveBeenCalledExactlyOnceWith('S1')
    expect(openWeb).not.toHaveBeenCalled()
  })

  it('is connected on arrival where it is the one asked for, and no other is', async () => {
    state.webAddress = false
    state.autoConnect = 'OTHER'
    await render()
    expect(dispatch.connections.connect).not.toHaveBeenCalled()
    state.autoConnect = 'S1'
    await render()
    expect(dispatch.connections.connect).toHaveBeenCalledOnce()
  })
})
