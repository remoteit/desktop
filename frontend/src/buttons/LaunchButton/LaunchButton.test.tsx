import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const state = { ui: { autoLaunch: undefined as string | undefined } }
const dispatch = {
  ui: { set: vi.fn((update: { autoLaunch?: string }) => Object.assign(state.ui, update)) },
  devices: { fetchSingleFull: vi.fn() },
}
const windowOpen = vi.fn()

vi.mock('react-redux', () => ({
  useSelector: (selector: (s: typeof state) => unknown) => selector(state),
  useDispatch: () => dispatch,
}))
vi.mock('../../store', () => ({}))
vi.mock('../../styling', () => ({}))
vi.mock('@common/applications', () => ({}))
vi.mock('../../services/Heartbeat', () => ({ default: { connect: vi.fn() } }))
vi.mock('../../services/browser', () => ({ windowOpen: (...args: unknown[]) => windowOpen(...args) }))
vi.mock('../../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../../helpers/connectionHelper', () => ({
  updateConnection: vi.fn(),
  launchDisabled: (c?: IConnection) => !c || !c.enabled || !c.online,
}))
vi.mock('../../buttons/IconButton', () => ({
  IconButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))
vi.mock('../../components/Icon', () => ({ Icon: () => null }))
vi.mock('../../components/PromptModal', () => ({
  PromptModal: ({ open }: { open: boolean }) => (open ? <div data-testid="prompt" /> : null),
}))

import { LaunchButton } from './LaunchButton'

const baseConnection = {
  id: 'service-1',
  name: 'gradeworks',
  deviceID: 'device-1',
  enabled: true,
  online: true,
  autoLaunch: true,
  launchType: 'URL',
} as IConnection

const appFor = (connection: IConnection) =>
  ({
    connection,
    service: { loaded: true },
    launchType: 'URL',
    prompt: connection.host ? 0 : 1,
    string: `https://${connection.host ?? '[host]'}`,
  } as any)

/* Pins the fix for the portal "Missing info found" popup: the cloud socket's DEVICE_CONNECT event
   marks the connection connected ~70ms before the connect call returns its host and sets ready. */
describe('LaunchButton auto launch', () => {
  let container: HTMLDivElement
  let root: Root

  const render = (connection: IConnection) =>
    act(() => root.render(<LaunchButton app={appFor(connection)} connection={connection} />))

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    state.ui.autoLaunch = baseConnection.id
    windowOpen.mockClear()
    dispatch.ui.set.mockClear()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('waits for ready instead of prompting for a host that has not arrived yet', () => {
    render({ ...baseConnection, connecting: false, connected: true, ready: false, host: undefined })

    expect(container.querySelector('[data-testid="prompt"]')).toBeNull()
    expect(windowOpen).not.toHaveBeenCalled()
    expect(state.ui.autoLaunch).toBe(baseConnection.id)
  })

  it('launches once the connect call returns the host', () => {
    render({ ...baseConnection, connected: true, ready: false, host: undefined })
    render({ ...baseConnection, connected: true, ready: true, host: 'abc.p021.r3proxy.com' })

    expect(container.querySelector('[data-testid="prompt"]')).toBeNull()
    expect(windowOpen).toHaveBeenCalledTimes(1)
    expect(windowOpen).toHaveBeenCalledWith('https://abc.p021.r3proxy.com', '_blank', false)
    expect(state.ui.autoLaunch).toBeUndefined()
  })
})
