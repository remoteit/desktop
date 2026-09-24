import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'

const { setConnection, setSession } = vi.hoisted(() => ({ setConnection: vi.fn(), setSession: vi.fn() }))

vi.mock('./Network', () => ({ default: { on: vi.fn(), off: vi.fn() } }))
vi.mock('../selectors/scripting', () => ({ selectJob: vi.fn() }))
vi.mock('../models/applicationTypes', () => ({ isReverseProxy: vi.fn() }))
vi.mock('../models/accounts', () => ({ getAccountIds: vi.fn(), accountFromDevice: vi.fn() }))
vi.mock('../helpers/apiHelper', () => ({ getWebSocketURL: vi.fn(), getTestHeader: vi.fn() }))
vi.mock('./remoteit', () => ({ getToken: vi.fn() }))
vi.mock('./oidc', () => ({ oidcAccessToken: vi.fn() }))
vi.mock('../constants', () => ({ resourceForEventsURL: vi.fn() }))
vi.mock('../helpers/versionHelper', () => ({ version: 'test' }))
vi.mock('../store', () => ({ store: { dispatch: { sessions: { setSession, removeSession: vi.fn() } } } }))
vi.mock('./Notifications', () => ({ notify: vi.fn() }))
vi.mock('../selectors/devices', () => ({ selectById: vi.fn() }))
vi.mock('../helpers/connectionHelper', () => ({
  setConnection,
  findLocalConnection: vi.fn(),
  getManufacturerType: vi.fn(),
  getManufacturerUser: vi.fn(),
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLGetErrors: vi.fn() }))
vi.mock('./browser', () => ({ agent: {} }))
vi.mock('./Controller', () => ({ emit: vi.fn() }))

import cloudController from './cloudController'

let timestamp = 1

const connectEvent = (targetId: string, connection: IConnection) =>
  ({
    type: 'DEVICE_CONNECT',
    state: 'connected',
    timestamp: timestamp++,
    sessionId: 'session-1',
    target: [{ id: targetId, accountId: 'account-1', deviceId: 'device-1', name: 'gradeworks', connection }],
  } as unknown as ICloudEvent)

const publicConnection = (id: string, update: Partial<IConnection>): IConnection => ({
  ...DEFAULT_CONNECTION,
  id,
  public: true,
  enabled: true,
  ...update,
})

describe('cloudController — DEVICE_CONNECT', () => {
  beforeEach(() => vi.clearAllMocks())

  it('leaves an in-flight public connect to proxyConnect but still records the session', () => {
    cloudController.update(connectEvent('service-1', publicConnection('service-1', { connecting: true })))

    expect(setConnection).not.toHaveBeenCalled()
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ id: 'session-1' }))
  })

  it('marks a settled public connection connected', () => {
    cloudController.update(connectEvent('service-2', publicConnection('service-2', { connecting: false })))

    expect(setConnection).toHaveBeenCalledWith(expect.objectContaining({ id: 'service-2', connected: true }))
  })

  it('still updates a connecting peer to peer connection', () => {
    const connection = { ...DEFAULT_CONNECTION, id: 'service-3', connecting: true }

    cloudController.update(connectEvent('service-3', connection))

    expect(setConnection).toHaveBeenCalledWith(expect.objectContaining({ id: 'service-3', connected: true }))
  })
})
