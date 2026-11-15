import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'

const { setConnection, setSession, selectById, fetchSingleFull } = vi.hoisted(() => ({
  setConnection: vi.fn(),
  setSession: vi.fn(),
  selectById: vi.fn(),
  fetchSingleFull: vi.fn(),
}))

vi.mock('./Network', () => ({ default: {} }))
vi.mock('../selectors/scripting', () => ({}))
vi.mock('../models/accounts', () => ({}))
vi.mock('../helpers/apiHelper', () => ({}))
vi.mock('./oidc', () => ({}))
vi.mock('../constants', () => ({}))
vi.mock('../store', () => ({
  store: {
    getState: () => ({}),
    dispatch: { sessions: { setSession, removeSession: vi.fn() }, devices: { fetchSingleFull } },
  },
}))
vi.mock('./Notifications', () => ({}))
vi.mock('../selectors/devices', () => ({ selectById }))
vi.mock('../helpers/connectionHelper', () => ({ setConnection }))
vi.mock('../selectors/accounts', () => ({}))
vi.mock('./graphQL', () => ({}))
vi.mock('./browser', () => ({}))
vi.mock('./Controller', () => ({ emit: vi.fn() }))

import cloudController from './cloudController'

const event = (type: string, state: string, connection: IConnection) =>
  ({
    type,
    state,
    timestamp: 1,
    sessionId: 'session-1',
    target: [{ id: connection.id, connection }],
  } as unknown as ICloudEvent)

describe('cloudController — local connection updates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('leaves an in-flight public connect to proxyConnect but still records the session', () => {
    cloudController.update(
      event('DEVICE_CONNECT', 'connected', { ...DEFAULT_CONNECTION, id: 'a', public: true, connecting: true })
    )

    expect(setConnection).not.toHaveBeenCalled()
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ id: 'session-1' }))
  })

  it('marks a settled public connection connected', () => {
    cloudController.update(event('DEVICE_CONNECT', 'connected', { ...DEFAULT_CONNECTION, id: 'b', public: true }))

    expect(setConnection).toHaveBeenCalledWith(expect.objectContaining({ id: 'b', connected: true }))
  })

  it('still updates a connecting peer to peer connection', () => {
    cloudController.update(event('DEVICE_CONNECT', 'connected', { ...DEFAULT_CONNECTION, id: 'c', connecting: true }))

    expect(setConnection).toHaveBeenCalledWith(expect.objectContaining({ id: 'c', connected: true }))
  })

  it("clears ready when a public session ends so its host isn't offered", () => {
    cloudController.update(
      event('DEVICE_CONNECT', 'disconnected', { ...DEFAULT_CONNECTION, id: 'd', public: true, ready: true })
    )

    expect(setConnection).toHaveBeenCalledWith(expect.objectContaining({ id: 'd', enabled: false, ready: false }))
  })

  it('writes the connection only when its online state changes', () => {
    cloudController.update(event('DEVICE_STATE', 'active', { ...DEFAULT_CONNECTION, id: 'e', online: true }))
    expect(setConnection).not.toHaveBeenCalled()

    cloudController.update(event('DEVICE_STATE', 'inactive', { ...DEFAULT_CONNECTION, id: 'f', online: true }))
    expect(setConnection).toHaveBeenCalledWith(expect.objectContaining({ id: 'f', online: false }))
  })
})

describe('cloudController — a service state for a service not here yet', () => {
  beforeEach(() => vi.clearAllMocks())

  const serviceEvent = (state: string) =>
    ({
      type: 'DEVICE_STATE',
      state,
      timestamp: 1,
      target: [{ id: 'VNC', deviceId: 'MAC', accountId: 'acct' }],
    } as unknown as ICloudEvent)

  it('reads its device again when the device is loaded', () => {
    selectById.mockReturnValue([undefined, { id: 'MAC', services: [] }])
    cloudController.update(serviceEvent('active'))

    expect(selectById).toHaveBeenCalledWith(expect.anything(), undefined, 'MAC')
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'MAC', hidden: true, silent: true, accountId: 'acct' })
  })

  it('leaves a device that is not loaded alone', () => {
    selectById.mockReturnValue([undefined, undefined])
    cloudController.update(serviceEvent('active'))

    expect(fetchSingleFull).not.toHaveBeenCalled()
  })
})
