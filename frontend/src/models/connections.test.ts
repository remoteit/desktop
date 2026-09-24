import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'

const { setConnection, graphQLConnect, graphQLDisconnect } = vi.hoisted(() => ({
  setConnection: vi.fn(),
  graphQLConnect: vi.fn(),
  graphQLDisconnect: vi.fn(),
}))

vi.mock('../helpers/sleep', () => ({ default: vi.fn() }))
vi.mock('../services/browser', () => ({ default: { hasBackend: false } }))
vi.mock('../helpers/utilHelper', () => ({ alphaSort: vi.fn(), pickTruthy: vi.fn() }))
vi.mock('../constants', () => ({ REGEX_HIDDEN_PASSWORD: /^$/, CERTIFICATE_DOMAIN: 'test' }))
vi.mock('../helpers/connectionHelper', () => ({
  setConnection,
  cleanOrphanConnections: vi.fn(),
  getFetchConnectionIds: vi.fn(),
  newConnection: vi.fn(),
  getConnectionLookup: vi.fn(),
  updateImmutableData: vi.fn(),
}))
vi.mock('../services/graphQLMutation', () => ({
  graphQLConnect,
  graphQLDisconnect,
  graphQLSurvey: vi.fn(),
  graphQLSetLink: vi.fn(),
  graphQLRemoveLink: vi.fn(),
}))
vi.mock('../services/graphQLDevice', () => ({ graphQLFetchConnections: vi.fn(), graphQLDeviceAdaptor: vi.fn() }))
vi.mock('../selectors/applications', () => ({ selectApplication: vi.fn() }))
vi.mock('./accounts', () => ({ accountFromDevice: vi.fn() }))
vi.mock('../selectors/connections', () => ({ selectConnection: vi.fn() }))
vi.mock('../selectors/devices', () => ({ selectById: () => [] }))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../services/Heartbeat', () => ({ default: { connect: vi.fn(), disconnect: vi.fn() } }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import connectionsModel from './connections'

const connection: IConnection = {
  ...DEFAULT_CONNECTION,
  id: 'service-1',
  name: 'gradeworks',
  deviceID: 'device-1',
  public: true,
  autoLaunch: true,
}

const makeDispatch = () => ({
  ui: { set: vi.fn(), clearAutoLaunch: vi.fn() },
  connections: { proxyConnect: vi.fn(), proxyDisconnect: vi.fn() },
  devices: { fetchSingleFull: vi.fn() },
})

describe('connections — auto launch intent', () => {
  let dispatch: ReturnType<typeof makeDispatch>
  let effects: any

  beforeEach(() => {
    vi.clearAllMocks()
    dispatch = makeDispatch()
    effects = (connectionsModel as any).effects(dispatch)
  })

  it('sets the auto launch intent when the user connects', async () => {
    await effects.connect(connection, { ui: {} })

    expect(dispatch.ui.set).toHaveBeenCalledWith({ autoLaunch: connection.id })
    expect(dispatch.ui.clearAutoLaunch).not.toHaveBeenCalled()
  })

  it('drops a leftover intent when a bulk enable connects without launching', async () => {
    await effects.connect({ ...connection, autoStart: true }, { ui: { autoLaunch: connection.id } })

    expect(dispatch.ui.set).not.toHaveBeenCalledWith({ autoLaunch: connection.id })
    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith(connection.id)
  })

  it('drops the intent when the proxy connect fails', async () => {
    graphQLConnect.mockResolvedValue('ERROR')

    await effects.proxyConnect(connection)

    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith(connection.id)
  })

  it('keeps the intent when the proxy connect succeeds', async () => {
    graphQLConnect.mockResolvedValue({ data: { data: { connect: { id: 's', host: 'h', port: 443, timeout: 60 } } } })

    await effects.proxyConnect(connection)

    expect(dispatch.ui.clearAutoLaunch).not.toHaveBeenCalled()
    expect(setConnection).toHaveBeenLastCalledWith(expect.objectContaining({ ready: true, connected: true, host: 'h' }))
  })

  it('drops the intent on disconnect', async () => {
    await effects.disconnect({ connection })

    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith(connection.id)
  })
})

describe('connections — proxyDisconnect', () => {
  beforeEach(() => vi.clearAllMocks())

  it("clears ready so the ended session's host is not treated as launchable", async () => {
    graphQLDisconnect.mockResolvedValue({})
    const effects = (connectionsModel as any).effects(makeDispatch())

    await effects.proxyDisconnect({ ...connection, enabled: true, connected: true, ready: true, sessionId: 's' })

    expect(setConnection).toHaveBeenLastCalledWith(
      expect.objectContaining({ ready: false, connected: false, enabled: false })
    )
  })
})
