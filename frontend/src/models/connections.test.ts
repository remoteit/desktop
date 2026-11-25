import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'

const {
  setConnection,
  graphQLConnect,
  graphQLSetLink,
  graphQLFetchConnections,
  fetchIds,
  cleanOrphans,
  byId,
  web,
  ready,
  target,
  selected,
} = vi.hoisted(() => ({
  byId: vi.fn((..._args: any[]): any[] => []),
  web: vi.fn(async (): Promise<boolean | undefined> => false),
  ready: vi.fn(async (_id: string): Promise<any> => true),
  target: vi.fn((..._args: any[]): any => undefined),
  selected: vi.fn(),
  graphQLFetchConnections: vi.fn(),
  fetchIds: vi.fn(() => [] as string[]),
  cleanOrphans: vi.fn(),
  setConnection: vi.fn(),
  graphQLConnect: vi.fn(),
  graphQLSetLink: vi.fn(),
}))

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
vi.mock('../selectors/connections', () => ({ selectConnection: selected }))
vi.mock('../selectors/devices', () => ({ selectById: byId }))
vi.mock('../services/webAddress', () => ({ decideWebAddress: web, readyWebAddress: ready, webTarget: target }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/Controller', () => ({}))
vi.mock('../services/Heartbeat', () => ({ default: {} }))
vi.mock('../i18n', () => ({ default: { t: (_key: string, options: any) => options.defaultValue } }))

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

/* A web service opened at its web address has no connection: from wherever one is asked for with no click, its page is
   gone to; and one of a network's started together is made ready, with nothing opened. */
describe('connecting to a service opened at its web address', () => {
  const dispatch = {
    ui: { set: vi.fn(), clearAutoLaunch: vi.fn() },
    connections: { proxyConnect: vi.fn(), connect: vi.fn(), set: vi.fn(), checkQueue: vi.fn() },
  }
  const effects = () => (connectionsModel as any).effects(dispatch)
  const connect = (set: Partial<IConnection> = {}) =>
    effects().connect({ ...connection, autoLaunch: undefined, error: undefined, ...set }, {})
  let open: any

  beforeEach(() => {
    vi.clearAllMocks()
    byId.mockReturnValue([{ id: 'service-1', deviceID: 'device-1', state: 'active' }])
    target.mockImplementation((_state, service) => ({ id: service.id, deviceID: service.deviceID, web: true }))
    web.mockResolvedValue(true)
    ready.mockResolvedValue(true)
    open = vi.spyOn(window, 'open').mockReturnValue(null)
    window.location.hash = '#/devices'
  })
  afterEach(() => {
    byId.mockReturnValue([])
    target.mockReturnValue(undefined)
    web.mockResolvedValue(false)
    window.location.hash = ''
    open.mockRestore()
  })

  it('goes to its page, opening and making nothing', async () => {
    expect(await connect({ autoLaunch: true })).toBe(false)
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith('service-1')
    expect(dispatch.ui.set.mock.calls).toEqual([[{ redirect: '/devices/device-1/service-1/connect' }]])
    expect(ready).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
  })

  it('goes nowhere from its own page', async () => {
    window.location.hash = '#/connections/service-1'
    expect(await connect()).toBe(false)
    expect(dispatch.ui.set).not.toHaveBeenCalled()
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
  })

  it('is made ready where it is started with others: nothing opened, gone to, connected or kept as a connection', async () => {
    expect(await connect({ autoStart: true, enabled: true, autoLaunch: true })).toBe(false)
    expect(ready).toHaveBeenCalledExactlyOnceWith('service-1')
    expect(open).not.toHaveBeenCalled()
    expect(dispatch.ui.set).not.toHaveBeenCalled()
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
    expect(setConnection).not.toHaveBeenCalled()
  })

  it('a failure is shown on it, as no enabled connection, and is cleared by one that is made ready', async () => {
    ready.mockResolvedValue({ reason: 'No proxy is in service' })
    await connect({ autoStart: true, enabled: true })
    expect(setConnection).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: 'service-1', enabled: false, error: { message: 'No proxy is in service' } })
    )
    ready.mockResolvedValue({ reason: '' })
    await connect({ autoStart: true, enabled: true })
    expect(setConnection.mock.lastCall![0].error.message).toBe('Could not open it: try again')
    ready.mockResolvedValue(true)
    await connect({ autoStart: true, enabled: true, error: { message: 'No proxy is in service' } })
    expect(setConnection.mock.lastCall![0]).toMatchObject({ enabled: false, error: undefined })
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
  })

  it('one that could not be checked is not connected: that is said, once, and it is checked again when asked again', async () => {
    web.mockResolvedValue(undefined)
    expect(await connect({ autoLaunch: true })).toBe(false)
    expect(dispatch.ui.set.mock.calls).toEqual([
      [{ errorMessage: 'Could not check how this service opens, so it was not connected. Try again.' }],
    ])
    expect(dispatch.ui.clearAutoLaunch).toHaveBeenCalledWith('service-1')
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
    expect(setConnection).not.toHaveBeenCalled()
    expect(ready).not.toHaveBeenCalled()
    expect(web).toHaveBeenCalledOnce()
    web.mockResolvedValue(false)
    expect(await connect()).not.toBe(false)
    expect(dispatch.connections.proxyConnect).toHaveBeenCalledOnce()
  })

  it('and where it is started with others, on it alone, as no enabled connection', async () => {
    web.mockResolvedValue(undefined)
    expect(await connect({ autoStart: true, enabled: true })).toBe(false)
    expect(setConnection).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        id: 'service-1',
        enabled: false,
        autoStart: undefined,
        error: { message: 'Could not check how this service opens, so it was not connected. Try again.' },
      })
    )
    expect(dispatch.ui.set).not.toHaveBeenCalled()
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
  })

  it('any other is connected as ever', async () => {
    web.mockResolvedValue(false)
    expect(await connect({ autoStart: true })).not.toBe(false)
    expect(await connect()).not.toBe(false)
    expect(dispatch.connections.proxyConnect).toHaveBeenCalledTimes(2)
    expect(ready).not.toHaveBeenCalled()
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })

  it('one of a type not known yet is decided of too: its list may say it is web', async () => {
    target.mockReturnValue({ id: 'service-1', web: undefined, type: 48 })
    web.mockResolvedValue(undefined)
    expect(await connect()).toBe(false)
    expect(dispatch.connections.proxyConnect).not.toHaveBeenCalled()
    web.mockResolvedValue(false)
    await connect()
    expect(dispatch.connections.proxyConnect).toHaveBeenCalledOnce()
  })

  it('a service that is not web is connected with nothing asked', async () => {
    target.mockReturnValue({ id: 'service-1', web: false })
    await connect()
    expect(web).not.toHaveBeenCalled()
    expect(dispatch.connections.proxyConnect).toHaveBeenCalledOnce()
  })

  it('an API without it after all connects it as ever', async () => {
    ready.mockResolvedValue('UNSUPPORTED')
    await connect({ autoStart: true })
    expect(dispatch.connections.proxyConnect).toHaveBeenCalledOnce()
  })

  it('of a network’s started together, each web one is made ready once, a failed one alone failing, the others connected', async () => {
    byId.mockImplementation((_state: any, _account: any, id: string) => [{ id, deviceID: 'device-1', state: 'active' }])
    selected.mockImplementation((_state: any, service: any) => ({
      ...connection,
      id: service.id,
      enabled: false,
      error: undefined,
    }))
    target.mockImplementation((_state, service) => ({ id: service.id, web: service.id.startsWith('web') }))
    ready.mockImplementation(async (id: string) => (id === 'web-2' ? { reason: 'No access' } : true))
    const running: Promise<unknown>[] = []
    const state = { connections: { queue: [] as any[] } }
    dispatch.connections.set.mockImplementation(async (set: any) => Object.assign(state.connections, set))
    dispatch.connections.connect.mockImplementation((c: any) => running.push(effects().connect(c, state)))
    vi.useFakeTimers()
    dispatch.connections.checkQueue.mockImplementation(() => effects().checkQueue(undefined, state))
    await effects().queueEnable({ serviceIds: ['web-1', 'ssh', 'web-2', 'web-3'], enabled: true })
    await vi.advanceTimersByTimeAsync(2_000)
    vi.useRealTimers()
    await Promise.all(running)
    expect(ready.mock.calls).toEqual([['web-1'], ['web-2'], ['web-3']])
    expect(dispatch.connections.proxyConnect.mock.calls.map(([c]: any) => c.id)).toEqual(['ssh'])
    expect(setConnection.mock.calls.map(([c]: any) => [c.id, c.enabled, c.error.message])).toEqual([
      ['web-2', false, 'No access'],
    ])
    expect(open).not.toHaveBeenCalled()
    expect(dispatch.ui.set.mock.calls.filter(([set]: any) => set.redirect)).toEqual([])

    // Stopped together: nothing of it to stop.
    dispatch.connections.connect.mockClear()
    await effects().queueEnable({ serviceIds: ['web-1'], enabled: false })
    await new Promise(resolve => setTimeout(resolve, 300))
    expect(dispatch.connections.connect).not.toHaveBeenCalled()
    selected.mockReset()
  })
})
