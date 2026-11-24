import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rowKey } from '../helpers/rowKey'

// Work's own account, in its row: under the sign-in that read it.
const WORK = rowKey('work', 'sub-work')

// One events socket per sign-in (services/cloudController, "ONE SOCKET PER SIGN-IN"): each subscribed with its own
// token, opened and closed as sign-ins join and leave, and an event two of them see handled once.

const { sockets, signIns, listeners, state, notify, setSession, getToken, devices, held, dispatched } = vi.hoisted(
  () => ({
    devices: {
      fetchSingleFull: vi.fn(),
      fetchDevices: vi.fn(),
      sortByState: vi.fn(),
      cleanup: vi.fn(),
      cleanupFor: vi.fn(),
    },
    held: { device: undefined as { id: string } | undefined },
    dispatched: { removeDevice: vi.fn(), setDevice: vi.fn(), set: vi.fn() },
    sockets: [] as any[],
    signIns: { list: [] as { sub: string; primary: boolean }[] },
    listeners: new Set<() => void>(),
    state: {} as Record<string, any>,
    notify: vi.fn(),
    setSession: vi.fn(),
    getToken: vi.fn(async (sub?: string) => `Bearer token-of:${sub ?? 'primary'}`),
  })
)

vi.mock('reconnecting-websocket', () => ({
  default: class FakeSocket {
    sent: string[] = []
    closed = false
    handlers: Record<string, (event: any) => void> = {}
    constructor(public url: string) {
      sockets.push(this)
    }
    addEventListener(name: string, handler: (event: any) => void) {
      this.handlers[name] = handler
    }
    removeEventListener(name: string) {
      delete this.handlers[name]
    }
    send(message: string) {
      this.sent.push(message)
    }
    close() {
      this.closed = true
    }
  },
}))
vi.mock('./Network', () => ({ default: { on: vi.fn(), off: vi.fn() } }))
vi.mock('../selectors/scripting', () => ({ selectJob: () => undefined }))
vi.mock('../models/applicationTypes', () => ({ isReverseProxy: () => false }))
vi.mock('../models/accounts', () => ({
  getAccountIds: () => ['personal', 'acme', 'work'],
  accountFromDevice: () => 'work',
}))
vi.mock('../helpers/apiHelper', () => ({ getWebSocketURL: () => 'wss://events.test', getTestHeader: () => ({}) }))
vi.mock('../helpers/versionHelper', () => ({ version: '0.0.0' }))
vi.mock('./remoteit', () => ({ getToken }))
vi.mock('./oidc', () => ({
  oidcAccessToken: vi.fn(),
  oidcSignIns: () => signIns.list,
  oidcSubscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}))
vi.mock('../constants', () => ({ resourceForEventsURL: () => undefined }))
vi.mock('../store', () => ({
  store: {
    getState: () => state,
    dispatch: {
      sessions: { setSession, removeSession: vi.fn() },
      devices,
      accounts: { removeDevice: dispatched.removeDevice, setDevice: dispatched.setDevice },
      ui: { set: dispatched.set },
    },
  },
}))
vi.mock('./Notifications', () => ({ notify }))
vi.mock('./productMaxDevices', () => ({ productFullEventFields: async () => '' }))
vi.mock('../selectors/devices', () => ({
  selectById: () => [undefined, held.device],
  deviceRows: (devices: object) => Object.keys(devices),
}))
vi.mock('../helpers/connectionHelper', () => ({
  setConnection: vi.fn(),
  findLocalConnection: () => undefined,
  getManufacturerType: () => undefined,
  getManufacturerUser: () => undefined,
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'personal' }))
vi.mock('./graphQL', () => ({ graphQLGetErrors: () => undefined }))
vi.mock('./browser', () => ({ agent: () => 'test' }))
vi.mock('./Controller', () => ({ emit: vi.fn() }))

import cloudController from './cloudController'

const inUse = (...subs: string[]) => {
  signIns.list = [{ sub: 'sub-personal', primary: true }, ...subs.map(sub => ({ sub, primary: false }))]
  listeners.forEach(listener => listener())
}
const open = async (socket: any) => {
  socket.handlers.open?.({})
  await vi.waitFor(() => expect(socket.sent.some((message: string) => message.startsWith('{'))).toBe(true))
  return JSON.parse(socket.sent.find((message: string) => message.startsWith('{')))
}
const live = () => sockets.filter(socket => !socket.closed)
const connected = (session: string) =>
  JSON.stringify({
    data: {
      event: {
        type: 'DEVICE_CONNECT',
        state: 'connected',
        timestamp: '2026-11-22T00:00:00.000Z',
        session,
        actor: { id: 'someone', email: 'someone@x.test' },
        target: [
          { id: 'svc-1', name: 'ssh', application: 28, owner: { id: 'work' }, device: { id: 'dev-1', name: 'pi' } },
        ],
      },
    },
  })

beforeEach(() => {
  cloudController.reset()
  sockets.length = 0
  listeners.clear()
  notify.mockClear()
  setSession.mockClear()
  getToken.mockClear()
  Object.values({ ...devices, ...dispatched }).forEach(mock => mock.mockClear())
  held.device = undefined
  Object.assign(state, {
    auth: { authenticated: true, user: { id: 'personal' } },
    user: { email: 'personal@x.test' },
    accounts: {
      membership: [{ account: { id: 'acme', email: '' } }],
      signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
    },
  })
  signIns.list = [{ sub: 'sub-personal', primary: true }]
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('the events sockets', () => {
  it('are one, the page’s own person’s, with one sign-in in use', async () => {
    cloudController.init()
    expect(sockets).toHaveLength(1)
    expect((await open(sockets[0])).headers.authorization).toBe('Bearer token-of:primary')
  })

  it('are one per sign-in, each subscribed with its own token', async () => {
    inUse('sub-work')
    cloudController.init()
    expect(sockets).toHaveLength(2)
    const subscribed = await Promise.all(sockets.map(open))
    expect(subscribed.map(message => message.headers.authorization).sort()).toEqual([
      'Bearer token-of:primary',
      'Bearer token-of:sub-work',
    ])
    expect(subscribed.every(message => message.action === 'subscribe' && message.supportsBatch)).toBe(true)
  })

  it('open for an account that joins, and close for one that leaves, the rest left as they are', () => {
    cloudController.init()
    const [own] = sockets
    inUse('sub-work')
    expect(live()).toHaveLength(2)
    inUse('sub-work', 'sub-third')
    expect(live()).toHaveLength(3)
    inUse('sub-third')
    expect(live()).toHaveLength(2)
    expect(own.closed).toBe(false)
    expect(sockets[1].closed).toBe(true)
    inUse()
    expect(live()).toEqual([own])
  })

  it('all close at sign-out, and none opens for a sign-in that joins afterwards', () => {
    inUse('sub-work')
    cloudController.init()
    cloudController.reset()
    expect(live()).toHaveLength(0)
    inUse('sub-work', 'sub-third')
    expect(live()).toHaveLength(0)
  })

  it('reconnect together', () => {
    inUse('sub-work')
    cloudController.init()
    cloudController.reconnect()
    expect(sockets).toHaveLength(4)
    expect(live()).toHaveLength(2)
  })
})

describe('an event', () => {
  it('on another sign-in’s socket goes into the same state, seen as that sign-in’s person', () => {
    inUse('sub-work')
    cloudController.init()
    sockets[1].handlers.message({ data: connected('session-1') })
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session-1', target: expect.objectContaining({ accountId: 'work' }) })
    )
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ authUserId: 'work' }))
  })

  it('that two sign-ins both see is handled once', () => {
    inUse('sub-work')
    cloudController.init()
    sockets[0].handlers.message({ data: connected('session-1') })
    sockets[1].handlers.message({ data: connected('session-1') })
    sockets[1].handlers.message({ data: JSON.stringify({ events: [JSON.parse(connected('session-1'))] }) })
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ authUserId: 'personal' }))
    sockets[1].handlers.message({ data: connected('session-2') })
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('is never passed over with one sign-in in use', () => {
    cloudController.init()
    sockets[0].handlers.message({ data: connected('session-1') })
    sockets[0].handlers.message({ data: connected('session-1') })
    expect(notify).toHaveBeenCalledTimes(2)
  })
})

/* Personal and Work are both signed in here, so both are told of what passes between them — and only the copy that
   comes first is handled. What is done cannot rest on which that is. */
describe('an event between two people signed in here', () => {
  const DEVICE = { id: 'dev-1', name: 'pi', application: 35, device: { id: 'dev-1', name: 'pi' } }
  const event = (more: object) =>
    JSON.stringify({ data: { event: { timestamp: '2026-11-22T00:00:00.000Z', target: [], ...more } } })
  const transfer = (to: string) =>
    event({
      type: 'DEVICE_TRANSFER',
      actor: { id: 'personal', email: 'personal@x.test' },
      target: [{ ...DEVICE, owner: { id: to } }],
    })
  const share = (action: string, by: string, to: string) =>
    event({
      type: 'DEVICE_SHARE',
      action,
      actor: { id: by, email: `${by}@x.test` },
      users: [{ id: to, email: `${to}@x.test` }],
      target: [{ ...DEVICE, owner: { id: by } }],
    })
  const both = (first: number, data: string) => {
    inUse('sub-work')
    cloudController.init()
    sockets[first].handlers.message({ data })
    sockets[1 - first].handlers.message({ data })
  }

  for (const first of [0, 1])
    it(`a transfer from one to the other reaches the new owner, whose copy comes ${
      first ? 'first' : 'second'
    }`, async () => {
      held.device = { id: 'dev-1' }
      both(first, transfer('work'))
      await vi.waitFor(() => expect(devices.fetchSingleFull).toHaveBeenCalledTimes(1))
      expect(devices.fetchSingleFull).toHaveBeenCalledWith({ id: 'dev-1', newDevice: true, accountId: 'work' })
      // Out of the old owner's list, into the new owner's — never dropped as if it had left.
      expect(dispatched.removeDevice).toHaveBeenCalledWith('dev-1')
      expect(devices.cleanup).not.toHaveBeenCalled()
      expect(notify).toHaveBeenCalledTimes(1)
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ authUserIds: ['personal', 'work'] }))
    })

  it('a transfer to someone who is not here takes the device away, as ever', () => {
    held.device = { id: 'dev-1' }
    both(0, transfer('someone'))
    expect(devices.cleanup).toHaveBeenCalledWith(['dev-1'])
    expect(devices.fetchSingleFull).not.toHaveBeenCalled()
  })

  for (const first of [0, 1])
    it(`a share from one to the other reaches the one shared with, whose copy comes ${
      first ? 'first' : 'second'
    }`, () => {
      both(first, share('add', 'personal', 'work'))
      expect(devices.fetchSingleFull).toHaveBeenCalledTimes(1)
      expect(devices.fetchSingleFull).toHaveBeenCalledWith({ id: 'dev-1', newDevice: true, accountId: 'work' })
    })

  it('an unshare from one to the other leaves the owner’s list alone', () => {
    both(1, share('remove', 'personal', 'work'))
    expect(devices.cleanupFor).toHaveBeenCalledWith({ ids: ['dev-1'], accountIds: ['work'] })
    expect(devices.cleanup).not.toHaveBeenCalled()
  })

  it('a share with both, then an unshare from one, by someone who is not here: only that one loses it', () => {
    inUse('sub-work')
    cloudController.init()
    const withBoth = JSON.parse(share('add', 'someone', 'personal'))
    withBoth.data.event.users.push({ id: 'work', email: 'work@x.test' })
    sockets[0].handlers.message({ data: JSON.stringify(withBoth) })
    expect(devices.fetchSingleFull.mock.calls.map(([asked]) => asked.accountId)).toEqual(['personal', 'work'])
    sockets[1].handlers.message({ data: share('remove', 'someone', 'work') })
    expect(devices.cleanupFor).toHaveBeenCalledWith({ ids: ['dev-1'], accountIds: ['work'] })
    expect(devices.cleanup).not.toHaveBeenCalled()
  })

  it('a share someone here made with an account they reach themselves is their own doing: not handled', () => {
    both(1, share('add', 'personal', 'acme'))
    expect(devices.fetchSingleFull).not.toHaveBeenCalled()
  })

  it('a share by someone who is not here is handled for whoever it is with', () => {
    both(0, share('add', 'someone', 'personal'))
    expect(devices.fetchSingleFull).toHaveBeenCalledWith({ id: 'dev-1', newDevice: true, accountId: 'personal' })
    both(0, share('remove', 'someone', 'work'))
    expect(devices.cleanupFor).toHaveBeenCalledWith({ ids: ['dev-1'], accountIds: ['work'] })
  })
})

/* Someone who is not here shared a device with Personal and with Work: it is in both their lists, each its own copy.
   What happens to it is told once (the other socket's copy is passed over), so it goes into both. */
describe('an event about a device two accounts here both hold', () => {
  const copy = (accountId: string) => ({
    id: 'dev-1',
    accountId,
    state: 'inactive',
    services: [{ id: 'svc-1', state: 'inactive' }],
  })
  const stateOf = (id: string) =>
    JSON.stringify({
      data: {
        event: {
          type: 'DEVICE_STATE',
          state: 'active',
          timestamp: new Date().toISOString(),
          target: [
            {
              id,
              name: 'pi',
              application: id === 'dev-1' ? 35 : 28,
              owner: { id: 'someone' },
              device: { id: 'dev-1' },
            },
          ],
        },
      },
    })
  beforeEach(() => {
    held.device = copy('personal') as any
    // By row (helpers/rowKey): Work's own account under its sign-in; Acme, which both belong to, once under each.
    state.devices = {
      personal: { all: [copy('personal')] },
      [WORK]: { all: [copy('work')] },
      connections: { all: [copy('connections')] },
    }
  })

  it('a change of state goes into each account’s copy, not the first found alone', () => {
    inUse('sub-work')
    cloudController.init()
    const data = stateOf('dev-1')
    sockets[0].handlers.message({ data })
    sockets[1].handlers.message({ data })
    expect(
      dispatched.setDevice.mock.calls.map(([set]) => [set.accountId, set.device.accountId, set.device.state])
    ).toEqual([
      ['personal', 'personal', 'active'],
      ['work', 'work', 'active'],
    ])
    expect(dispatched.setDevice.mock.calls.map(([set]) => set.row)).toEqual(['personal', WORK])
    expect(devices.sortByState.mock.calls).toEqual([
      [{ accountId: 'personal', row: 'personal' }],
      [{ accountId: 'work', row: WORK }],
    ])
    // The copies in the store are not written to in place.
    expect(state.devices[WORK].all[0].state).toBe('inactive')
  })

  it('a device of an organization both belong to: the copy in its row under each sign-in is written', () => {
    state.devices = { acme: { all: [copy('acme')] }, [rowKey('acme', 'sub-work')]: { all: [copy('acme')] } }
    inUse('sub-work')
    cloudController.init()
    // Later than any other test's event about the device: an older one is passed over.
    const later = (data: string, by: number) => {
      const message = JSON.parse(data)
      message.data.event.timestamp = new Date(Date.now() + by).toISOString()
      return message
    }
    sockets[0].handlers.message({ data: JSON.stringify(later(stateOf('dev-1'), 60_000)) })
    expect(dispatched.setDevice.mock.calls.map(([set]) => [set.accountId, set.row, set.device.state])).toEqual([
      ['acme', 'acme', 'active'],
      ['acme', rowKey('acme', 'sub-work'), 'active'],
    ])
    // And read again for each, as the row's own sign-in.
    const refresh = later(stateOf('dev-1'), 120_000)
    refresh.data.event.type = 'DEVICE_REFRESH'
    sockets[0].handlers.message({ data: JSON.stringify(refresh) })
    expect(devices.fetchDevices.mock.calls).toEqual([
      [{ ids: ['dev-1'], accountId: 'acme', sub: '' }],
      [{ ids: ['dev-1'], accountId: 'acme', sub: 'sub-work' }],
    ])
  })

  it('a refresh reads it again for each account that holds it', () => {
    inUse('sub-work')
    cloudController.init()
    const refresh = JSON.parse(stateOf('dev-1'))
    refresh.data.event.type = 'DEVICE_REFRESH'
    sockets[1].handlers.message({ data: JSON.stringify(refresh) })
    expect(devices.fetchDevices.mock.calls).toEqual([
      [{ ids: ['dev-1'], accountId: 'personal', sub: '' }],
      [{ ids: ['dev-1'], accountId: 'work', sub: 'sub-work' }],
    ])
  })
})
