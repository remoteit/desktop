import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'

const { setConnection, graphQLConnect } = vi.hoisted(() => ({ setConnection: vi.fn(), graphQLConnect: vi.fn() }))

vi.mock('../services/browser', () => ({ default: { hasBackend: false } }))
vi.mock('../constants', () => ({}))
vi.mock('../helpers/connectionHelper', () => ({ setConnection }))
vi.mock('../services/graphQLMutation', () => ({ graphQLConnect, graphQLDisconnect: vi.fn() }))
vi.mock('../services/graphQLDevice', () => ({}))
vi.mock('../selectors/applications', () => ({}))
vi.mock('./accounts', () => ({}))
vi.mock('../selectors/connections', () => ({}))
vi.mock('../selectors/devices', () => ({ selectById: () => [] }))
vi.mock('../services/Controller', () => ({}))
vi.mock('../services/Heartbeat', () => ({ default: {} }))
vi.mock('../i18n', () => ({ default: {} }))

import connectionsModel from './connections'

const connection: IConnection = { ...DEFAULT_CONNECTION, id: 'service-1', public: true, autoLaunch: true }

describe('connections — public proxy lifecycle', () => {
  let dispatch: { ui: { set: any; clearAutoLaunch: any }; connections: { proxyConnect: any; proxyDisconnect: any } }
  let effects: any

  beforeEach(() => {
    vi.clearAllMocks()
    dispatch = {
      ui: { set: vi.fn(), clearAutoLaunch: vi.fn() },
      connections: { proxyConnect: vi.fn(), proxyDisconnect: vi.fn() },
    }
    effects = (connectionsModel as any).effects(dispatch)
  })

  it('sets the auto launch intent when the user connects', async () => {
    await effects.connect(connection, {})

    expect(dispatch.ui.set).toHaveBeenCalledWith({ autoLaunch: connection.id })
  })

  it('drops a leftover intent when a bulk enable connects without launching', async () => {
    await effects.connect({ ...connection, autoStart: true }, {})

    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith(connection.id)
  })

  it('drops the intent when the proxy connect fails', async () => {
    graphQLConnect.mockResolvedValueOnce('ERROR')

    await effects.proxyConnect(connection)

    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith(connection.id)
  })

  it('keeps the intent when the proxy connect succeeds, which delivers ready with the host', async () => {
    graphQLConnect.mockResolvedValueOnce({ data: { data: { connect: { id: 's', host: 'h', timeout: 60 } } } })

    await effects.proxyConnect(connection)

    expect(dispatch.ui.clearAutoLaunch).not.toHaveBeenCalled()
    expect(setConnection).toHaveBeenLastCalledWith(expect.objectContaining({ ready: true, connected: true, host: 'h' }))
  })

  it('drops the intent on disconnect', async () => {
    await effects.disconnect({ connection })

    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith(connection.id)
  })

  it("clears ready on a user disconnect so the ended session's host isn't offered", async () => {
    await effects.proxyDisconnect({ ...connection, enabled: true, connected: true, ready: true, sessionId: 's' })

    expect(setConnection).toHaveBeenLastCalledWith(
      expect.objectContaining({ ready: false, connected: false, enabled: false })
    )
  })
})
