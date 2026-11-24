import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'

const { setConnection, graphQLConnect, graphQLSetLink, graphQLFetchConnections, fetchIds, cleanOrphans } = vi.hoisted(
  () => ({
    graphQLFetchConnections: vi.fn(),
    fetchIds: vi.fn(() => [] as string[]),
    cleanOrphans: vi.fn(),
    setConnection: vi.fn(),
    graphQLConnect: vi.fn(),
    graphQLSetLink: vi.fn(),
  })
)

vi.mock('../services/browser', () => ({ default: { hasBackend: false } }))
vi.mock('../constants', () => ({ REGEX_HIDDEN_PASSWORD: /^\*+$/ }))
vi.mock('../helpers/connectionHelper', () => ({
  setConnection,
  getFetchConnectionIds: fetchIds,
  cleanOrphanConnections: cleanOrphans,
  // Whose a request about a connection is: its record's sign-in — Work's own account is looked at through Work's.
  connectionAs: (c: IConnection) =>
    c.accountId || c.sub !== undefined ? { sub: c.sub ?? (c.accountId === 'work' ? 'sub-work' : '') } : undefined,
}))
vi.mock('../services/graphQLMutation', () => ({ graphQLConnect, graphQLDisconnect: vi.fn(), graphQLSetLink }))
vi.mock('../services/graphQLDevice', () => ({
  graphQLFetchConnections,
  graphQLDeviceAdaptor: ({ gqlDevices }: { gqlDevices: any[] }) => gqlDevices,
}))
vi.mock('../selectors/applications', () => ({}))
vi.mock('./accounts', () => ({}))
vi.mock('../selectors/connections', () => ({}))
vi.mock('../selectors/devices', () => ({ selectById: () => [] }))
vi.mock('../services/Controller', () => ({}))
vi.mock('../services/Heartbeat', () => ({ default: {} }))
vi.mock('../i18n', () => ({ default: {} }))

import connectionsModel from './connections'
import { requestSignIn } from '../selectors/signIns'

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

describe('connections — persistent links', () => {
  let dispatch: any
  let effects: any

  beforeEach(() => {
    vi.clearAllMocks()
    dispatch = {
      connections: { updateConnection: vi.fn(), patchConnection: vi.fn() },
      devices: { fetchSingleFull: vi.fn() },
    }
    effects = (connectionsModel as any).effects(dispatch)
  })

  it("shows graphql's reason when it refuses the link", async () => {
    graphQLSetLink.mockResolvedValueOnce({
      reason:
        'A password protects web (HTTPS) links only — this service is not a web one, so its link cannot have a password',
    })

    await effects.setConnectLink({ ...connection, enabled: true, password: 'secret' })

    expect(dispatch.connections.patchConnection).toHaveBeenCalledWith({
      id: connection.id,
      error: {
        message:
          'A password protects web (HTTPS) links only — this service is not a web one, so its link cannot have a password',
      },
      updating: false,
    })
  })

  it('falls back to the generic failure when there is no reason', async () => {
    graphQLSetLink.mockResolvedValueOnce('ERROR')

    await effects.setConnectLink({ ...connection, enabled: true })

    expect(dispatch.connections.patchConnection).toHaveBeenCalledWith(
      expect.objectContaining({ error: { message: 'Persistent connection update failed. Please contact support.' } })
    )
  })
})

/* Work is signed in beside the page's own person. A connection to a service of Work's is known by the connection
   alone: its device is in no account's stored list (kept with the connections, or off the page that is loaded). */
describe('connections — with several sign-ins in use', () => {
  const mine: IConnection = { ...DEFAULT_CONNECTION, id: 's-me', accountId: 'me', public: true, sessionId: 'x' }
  const theirs: IConnection = { ...DEFAULT_CONNECTION, id: 's-work', accountId: 'work', public: true, sessionId: 'y' }
  const device = (id: string, service: string) => ({ id, services: [{ id: service }] })
  const state = () => ({
    auth: { user: { id: 'me' } },
    user: { id: 'me' },
    accounts: {
      membership: [],
      signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
    },
    connections: { all: [mine, theirs] },
    devices: { connections: { all: [device('d-me', 's-me'), device('d-work', 's-work')] } },
  })
  let dispatch: any
  let effects: any
  beforeEach(() => {
    vi.clearAllMocks()
    dispatch = {
      ui: { set: vi.fn(), clearAutoLaunch: vi.fn() },
      connections: { set: vi.fn(), updateConnection: vi.fn(), patchConnection: vi.fn() },
      accounts: { truncateMergeDevices: vi.fn() },
    }
    effects = (connectionsModel as any).effects(dispatch)
    fetchIds.mockReturnValue(['s-me', 's-work'])
  })

  it('a connection is made as the sign-in of the account it is of, where nothing stored says whose its service is', async () => {
    graphQLConnect.mockResolvedValue('ERROR')
    await effects.proxyConnect(theirs)
    expect(graphQLConnect).toHaveBeenCalledWith('s-work', theirs.publicRestriction, { sub: 'sub-work' })
    expect(requestSignIn(state() as any, { orAccount: 'work' }, { serviceId: 's-work' })).toBe('sub-work')
    expect(requestSignIn(state() as any, { orAccount: 'me' }, { serviceId: 's-me' })).toBeUndefined()
  })

  it('the connections are read once per sign-in, each asked of its own', async () => {
    graphQLFetchConnections.mockImplementation(async ({ ids }: { ids: string[] }) => ({
      data: { data: { login: { device: ids.map(id => device(id.replace('s-', 'd-'), id)) } } },
    }))
    await effects.fetch(undefined, state())
    expect(graphQLFetchConnections.mock.calls).toEqual([
      [{ ids: ['s-me'] }, { sub: '', about: ['me'] }],
      [{ ids: ['s-work'] }, { sub: 'sub-work', about: ['work'] }],
    ])
    const [{ devices, accountId }] = dispatch.accounts.truncateMergeDevices.mock.calls[0]
    expect(accountId).toBe('connections')
    expect(devices.map((d: any) => d.id)).toEqual(['d-me', 'd-work'])
    expect(cleanOrphans).toHaveBeenCalledWith(['s-me', 's-work'])
  })

  it('a sign-in that could not be asked keeps the devices of its connections, and none of them is forgotten', async () => {
    graphQLFetchConnections.mockImplementation(async ({ ids }: { ids: string[] }, requestFor: any) =>
      requestFor.sub ? 'ERROR' : { data: { data: { login: { device: ids.map(id => device('d-me', id)) } } } }
    )
    await effects.fetch(undefined, state())
    const [{ devices }] = dispatch.accounts.truncateMergeDevices.mock.calls[0]
    expect(devices.map((d: any) => d.id)).toEqual(['d-me', 'd-work'])
    expect(cleanOrphans).toHaveBeenCalledWith(['s-me'])
  })

  it('a service two sign-ins are connected to is answered for only when both were: one read failing keeps its device, and neither connection is an orphan', async () => {
    const both = { ...state(), connections: { all: [mine, { ...mine, accountId: 'work', sub: 'sub-work' }] } }
    both.devices = { connections: { all: [device('d-me', 's-me')] } }
    fetchIds.mockReturnValue(['s-me'])
    // The page's own person no longer reaches it (no device), and Work could not be asked.
    graphQLFetchConnections.mockImplementation(async (_: unknown, requestFor: any) =>
      requestFor.sub ? 'ERROR' : { data: { data: { login: { device: [] } } } }
    )
    await effects.fetch(undefined, both)
    const [{ devices }] = dispatch.accounts.truncateMergeDevices.mock.calls[0]
    expect(devices.map((d: any) => d.id)).toEqual(['d-me'])
    expect(cleanOrphans).toHaveBeenCalledWith([])
  })

  it('with one sign-in in use, the one request as ever', async () => {
    graphQLFetchConnections.mockResolvedValue({ data: { data: { login: { device: [] } } } })
    await effects.fetch(undefined, { ...state(), accounts: { membership: [], signIns: {} } })
    expect(graphQLFetchConnections.mock.calls).toEqual([[{ ids: ['s-me', 's-work'] }, undefined]])
  })
})
