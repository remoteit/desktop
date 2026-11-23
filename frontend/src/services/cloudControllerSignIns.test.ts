import { describe, it, expect, vi, beforeEach } from 'vitest'

// One events socket per sign-in (services/cloudController, "ONE SOCKET PER SIGN-IN"): each subscribed with its own
// token, opened and closed as sign-ins join and leave, and an event two of them see handled once.

const { sockets, signIns, listeners, state, notify, setSession, getToken } = vi.hoisted(() => ({
  sockets: [] as any[],
  signIns: { list: [] as { sub: string; primary: boolean }[] },
  listeners: new Set<() => void>(),
  state: {} as Record<string, any>,
  notify: vi.fn(),
  setSession: vi.fn(),
  getToken: vi.fn(async (sub?: string) => `Bearer token-of:${sub ?? 'primary'}`),
}))

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
vi.mock('../models/accounts', () => ({ getAccountIds: () => ['personal', 'work'], accountFromDevice: () => 'work' }))
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
  store: { getState: () => state, dispatch: { sessions: { setSession, removeSession: vi.fn() } } },
}))
vi.mock('./Notifications', () => ({ notify }))
vi.mock('./productMaxDevices', () => ({ productFullEventFields: async () => '' }))
vi.mock('../selectors/devices', () => ({ selectById: () => [undefined, undefined] }))
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
  Object.assign(state, {
    auth: { authenticated: true, user: { id: 'personal' } },
    accounts: {
      membership: [],
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
