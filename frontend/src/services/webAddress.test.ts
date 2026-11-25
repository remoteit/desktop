import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { env, post, basic, openInSystem, windowOpen, state, info, readInfo, localName } = vi.hoisted(() => ({
  env: { isNative: false, isMobile: false, hasBackend: false, embedded: false },
  post: vi.fn(),
  basic: vi.fn(),
  openInSystem: vi.fn(),
  windowOpen: vi.fn(),
  state: { deviceSessions: true, api: 'https://api.one', setting: undefined as string | undefined },
  info: vi.fn(),
  readInfo: vi.fn(),
  localName: vi.fn(),
}))
vi.mock('./browser', () => ({ default: env, openInSystem, windowOpen }))
vi.mock('../constants', () => ({
  get EMBEDDED() {
    return env.embedded
  },
}))
vi.mock('../store', () => ({
  store: {
    getState: () => ({
      ui: { proxyFleet: state.setting },
      applicationTypes: { all: [{ id: 7, scheme: 'http' }, { id: 28 }] },
    }),
  },
}))
vi.mock('@common/applications', () => ({
  getApplicationType: () => ({}),
  isWebType: (_app: unknown, type?: { scheme?: string }) => type?.scheme === 'http',
}))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => state.api }))
vi.mock('../hooks/useDeviceSessions', () => ({ selectDeviceSessions: () => state.deviceSessions }))
vi.mock('../selectors/signIns', () => ({
  requestSignIn: (_state: unknown, { about }: any) => (about[0] === 'D-work' ? 'work' : undefined),
}))
vi.mock('../selectors/devices', () => ({
  selectById: () => [
    { id: 'S1', typeID: 7, port: 8123 },
    { id: 'D1', services: [] },
  ],
}))
vi.mock('./accountCaches', () => ({ accountCache: vi.fn() }))
vi.mock('./deviceSessionInfo', () => ({ deviceSessionInfo: info, readDeviceSessionInfo: readInfo }))
vi.mock('./graphQLDetectedScheme', () => ({ defaultHttpOnName: () => false }))
vi.mock('./localSubnet', () => ({
  localSubnetName: localName,
  subnetWebPort: (port?: number) => port || 443,
  subnetWebURL: (name: string, port: number) => (port === 443 ? `https://${name}` : `https://${name}:${port}`),
}))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({
  graphQLBasicRequest: basic,
  graphQLGetErrors: (response: any) => response.data?.errors,
}))
vi.mock('./graphQLDaemon', () => ({
  UNSUPPORTED: 'UNSUPPORTED',
  withoutDeviceSessions: (errors: any, marker: string) =>
    !!errors?.some((e: any) => e.message.startsWith(`Cannot query field "${marker}"`)),
}))

import {
  WEB_ADDRESS_WAIT_MS,
  WebTarget,
  decideWebAddress,
  knownWebAddress,
  openWebAddress,
  openWebService,
  opensAtWebAddress,
  readyWebAddress,
  requestWebAddress,
  resetWebAddresses,
  subscribeWebAddresses,
  webAddressGate,
  webTarget,
} from './webAddress'

const ADDRESS = 'https://web-acme.solo.r3proxy.com'
const NAME = 'server-acme.on.solo.remote.it'
const answered = (url: unknown) => ({ data: { data: { openWebAddress: url } } })
const unknownField = { data: { errors: [{ message: 'Cannot query field "openWebAddress" on type "Mutation".' }] } }

// The API: what its schema has, and its stage's fleet. 'ERROR' for a read that fails, a promise for one that is slow.
let api: {
  mutation: string[]
  query: string[]
  service: string[]
  fleet: unknown
  schema?: unknown
  addresses?: unknown
}
const fields = (names: string[]) => ({ fields: names.map(name => ({ name })) })
const asked = (what: string) => basic.mock.calls.filter(([query]) => query.includes(what)).length

let tab: { location: { href: string }; opener: unknown; close: ReturnType<typeof vi.fn> }
let open: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  Object.assign(env, { isNative: false, isMobile: false, hasBackend: false, embedded: false })
  Object.assign(state, { deviceSessions: true, api: 'https://api.one', setting: undefined })
  api = { mutation: ['connect', 'openWebAddress'], query: ['proxyFleet'], service: ['webAddress'], fleet: 'CONNECTD' }
  for (const mock of [post, basic, openInSystem, windowOpen, info, readInfo, localName]) mock.mockReset()
  basic.mockImplementation(async (query: string) => {
    if (query.includes('WebAddressSchema'))
      return (
        api.schema ?? {
          data: { data: { mutation: fields(api.mutation), query: fields(api.query), service: fields(api.service) } },
        }
      )
    if (query.includes('ProxyFleetDefault'))
      return typeof api.fleet === 'string' && api.fleet !== 'ERROR'
        ? { data: { data: { proxyFleet: api.fleet } } }
        : api.fleet
    return api.addresses
  })
  const session = { services: { S1: NAME } }
  info.mockReturnValue(session)
  readInfo.mockResolvedValue(session)
  localName.mockResolvedValue(null)
  tab = { location: { href: '' }, opener: {}, close: vi.fn() }
  open = vi.spyOn(window, 'open').mockReturnValue(tab as any) as any
})
afterEach(() => {
  resetWebAddresses()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const target = (set: Partial<WebTarget> = {}): WebTarget => ({ id: 'S1', deviceID: 'D1', web: true, ...set })

describe('the gate: web addresses, where the new proxies are enabled', () => {
  it('is on for a stage on the new proxies, read once for each API', async () => {
    expect(webAddressGate()).toBeUndefined()
    expect(await Promise.all([decideWebAddress(target()), decideWebAddress(target())])).toEqual([true, true])
    expect(webAddressGate()).toBe(true)
    expect(await decideWebAddress(target())).toBe(true)
    expect([asked('WebAddressSchema'), asked('ProxyFleetDefault')]).toEqual([1, 1])
    // An API without any of it answers the schema's query all the same.
    expect(basic.mock.calls[0][0]).not.toMatch(/openWebAddress|proxyFleet/)
    Object.assign(state, { api: 'https://api.two' })
    api.fleet = 'LEGACY'
    expect(webAddressGate()).toBeUndefined()
    expect(await decideWebAddress(target())).toBe(false)
  })

  it('is off for a stage on the legacy fleet', async () => {
    api.fleet = 'LEGACY'
    expect(await decideWebAddress(target())).toBe(false)
    expect(webAddressGate()).toBe(false)
  })

  it.each([
    ['openWebAddress', { mutation: ['connect'] }],
    ['proxyFleet', { query: [] }],
  ])('is off on an API without %s, which is not asked its fleet', async (_what, without) => {
    Object.assign(api, without)
    expect(await decideWebAddress(target())).toBe(false)
    expect(webAddressGate()).toBe(false)
    expect(asked('ProxyFleetDefault')).toBe(0)
  })

  it('is the Test setting’s where it is set, whatever the stage’s', async () => {
    state.setting = 'CONNECTD'
    api.fleet = 'LEGACY'
    expect(await decideWebAddress(target())).toBe(true)
    expect(asked('ProxyFleetDefault')).toBe(0)
    state.setting = 'LEGACY'
    expect(webAddressGate()).toBe(false)
    state.setting = undefined
    expect(webAddressGate()).toBeUndefined()
    expect(await decideWebAddress(target())).toBe(false)
  })

  it('is off for the Test setting’s legacy fleet with nothing read, and for the new proxies without openWebAddress', async () => {
    state.setting = 'LEGACY'
    expect(await decideWebAddress(target())).toBe(false)
    expect(basic).not.toHaveBeenCalled()
    state.setting = 'CONNECTD'
    api.mutation = []
    expect(await decideWebAddress(target())).toBe(false)
  })

  it.each([
    ['schema', { schema: 'ERROR' }, { schema: undefined }],
    ['schema, partly', { schema: { data: { data: { mutation: null, query: null } } } }, { schema: undefined }],
    ['fleet', { fleet: 'ERROR' }, { fleet: 'CONNECTD' }],
  ])('a %s read that failed is not kept as off: it is read again', async (_what, failed, well) => {
    Object.assign(api, failed)
    expect(await decideWebAddress(target())).toBeUndefined()
    expect(webAddressGate()).toBeUndefined()
    Object.assign(api, well)
    expect(await decideWebAddress(target())).toBe(true)
  })

  it.each(['WebAddressSchema', 'ProxyFleetDefault'])(
    'a %s read that never answers is not waited on for good',
    async query => {
      vi.useFakeTimers()
      const answering = basic.getMockImplementation()!
      basic.mockImplementation((asked: string) => (asked.includes(query) ? new Promise(() => {}) : answering(asked)))
      const decided = decideWebAddress(target())
      await vi.advanceTimersByTimeAsync(WEB_ADDRESS_WAIT_MS)
      expect(await decided).toBeUndefined()
    }
  )
})

describe('whether a service is opened at its web address', () => {
  it('is a web service with a name in device subnets', async () => {
    expect(opensAtWebAddress(target())).toBeUndefined()
    expect(await decideWebAddress(target())).toBe(true)
    expect(opensAtWebAddress(target())).toBe(true)
    info.mockReturnValue({ services: { S1: null } })
    readInfo.mockResolvedValue({ services: { S1: null } })
    expect(opensAtWebAddress(target())).toBe(false)
    expect(await decideWebAddress(target())).toBe(false)
  })

  it('is not known until its device is, or where its device was read before it was added; nor waited on for good', async () => {
    await decideWebAddress(target())
    info.mockReturnValue(undefined)
    expect(opensAtWebAddress(target())).toBeUndefined()
    info.mockReturnValue({ services: {} })
    expect(opensAtWebAddress(target())).toBeUndefined()
    vi.useFakeTimers()
    readInfo.mockReturnValue(new Promise(() => {}))
    const decided = decideWebAddress(target())
    await vi.advanceTimersByTimeAsync(WEB_ADDRESS_WAIT_MS)
    expect(await decided).toBeUndefined()
  })

  it.each([
    ['not web', target({ web: false }), {}],
    ['set to peer to peer alone', target({ route: 'p2p' }), {}],
    ['of no device known', target({ deviceID: undefined }), {}],
    ['with device sessions off', target(), { deviceSessions: false }],
    ['where the app makes its own connections', target(), { hasBackend: true }],
  ])('is no service %s, and nothing is read for it', async (_what, service, set) => {
    Object.assign(state, set)
    Object.assign(env, set)
    expect(opensAtWebAddress(service)).toBe(false)
    expect(await decideWebAddress(service)).toBe(false)
    expect(basic).not.toHaveBeenCalled()
  })

  it('is looked at by the service, or by its connection alone', () => {
    const of = (service?: object, connection?: object) =>
      webTarget({ applicationTypes: { all: [{ id: 7, scheme: 'http' }] } } as any, service as any, connection as any)
    expect(of({ id: 'S1', deviceID: 'D1', typeID: 7, attributes: { route: 'p2p' } })).toEqual(target({ route: 'p2p' }))
    expect(of(undefined, { id: 'S1', deviceID: 'D1', typeID: 7 })).toEqual(target())
    expect(of({ id: 'S1', deviceID: 'D1', typeID: 28, attributes: {} })?.web).toBe(false)
    expect(of()).toBeUndefined()
  })
})

describe('opening a service at its web address', () => {
  it('reserves the tab on the click, then sends it to the address', async () => {
    let answer: (value: unknown) => void = () => {}
    post.mockReturnValue(new Promise(resolve => (answer = resolve)))
    const opening = openWebAddress('S1')
    expect(open).toHaveBeenCalledExactlyOnceWith('', '_blank')
    expect(tab.location.href).toBe('')
    answer(answered(ADDRESS))
    expect(await opening).toBe(true)
    expect(post.mock.calls[0][0].variables).toEqual({ serviceId: 'S1' })
    expect(post.mock.calls[0].at(-1)).toEqual({ about: ['S1'] }) // as the sign-in that serves the service
    expect(tab.location.href).toBe(ADDRESS)
    expect(tab.opener).toBeNull()
    expect(tab.close).not.toHaveBeenCalled()
  })

  it('closes the tab and gives a refusal in graphql’s words', async () => {
    post.mockResolvedValue({
      data: { errors: [{ message: 'X', extensions: { message: 'this service is not a web one' } }] },
    })
    expect(await openWebAddress('S1')).toEqual({ reason: 'This service is not a web one' })
    expect(tab.close).toHaveBeenCalledOnce()
    expect(tab.location.href).toBe('')
  })

  it('closes the tab when the request fails, or throws', async () => {
    post.mockResolvedValueOnce('ERROR').mockRejectedValueOnce(new Error('gone'))
    expect(await openWebAddress('S1')).toEqual({ reason: '' })
    await expect(openWebAddress('S1')).rejects.toThrow('gone')
    expect(tab.close).toHaveBeenCalledTimes(2)
  })

  it.each(['javascript:alert(1)', 'http://web-acme.solo.r3proxy.com', 'data:text/html,x', '', null, { href: ADDRESS }])(
    'opens nothing but an https address: %j',
    async url => {
      post.mockResolvedValue(answered(url))
      expect(await openWebAddress('S1')).toEqual({ reason: '' })
      expect(tab.close).toHaveBeenCalledOnce()
      expect(tab.location.href).toBe('')
      expect(windowOpen).not.toHaveBeenCalled()
      expect(openInSystem).not.toHaveBeenCalled()
    }
  )

  it('an API without it after all is noted, so it is not offered again', async () => {
    await decideWebAddress(target())
    const told = vi.fn()
    const off = subscribeWebAddresses(told)
    post.mockResolvedValue(unknownField)
    expect(await openWebAddress('S1')).toEqual({ reason: '' })
    expect(tab.close).toHaveBeenCalledOnce()
    expect(webAddressGate()).toBe(false)
    expect(told).toHaveBeenCalled()
    off()
  })

  it.each([true, false])(
    'the system browser is given it on a phone, reserving no tab, and says %s',
    async completed => {
      Object.assign(env, { isNative: true, isMobile: true })
      post.mockResolvedValue(answered(ADDRESS))
      openInSystem.mockResolvedValue(completed)
      expect(await openWebAddress('S1')).toEqual(completed || { reason: '' })
      expect(openInSystem).toHaveBeenCalledExactlyOnceWith(ADDRESS)
      expect(open).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['the desktop app', { isNative: true }],
    ['the portal in the desktop app', { embedded: true }],
  ])('%s has no tab to reserve: its window hands the address to the system browser', async (_what, shell) => {
    Object.assign(env, shell)
    post.mockResolvedValue(answered(ADDRESS))
    expect(await openWebAddress('S1')).toBe(true)
    expect(open).not.toHaveBeenCalled()
    expect(windowOpen).toHaveBeenCalledExactlyOnceWith(ADDRESS, '_blank', true)
  })
})

describe('opening a web service where nothing has asked yet whether an agent here reaches it', () => {
  it('reserves the tab on the click, and opens its name where one does', async () => {
    localName.mockResolvedValue({ name: NAME })
    const opening = openWebService(target())
    expect(open).toHaveBeenCalledExactlyOnceWith('', '_blank')
    expect(await opening).toBe(true)
    expect(localName).toHaveBeenCalledWith('S1', NAME)
    expect(tab.location.href).toBe(`https://${NAME}:8123`)
    expect(post).not.toHaveBeenCalled()
  })

  it('opens its own name’s port, and its device’s name at its own', async () => {
    info.mockReturnValue({ services: { S1: NAME }, serviceNames: { S1: { own: true, port: 443 } } })
    localName.mockResolvedValue({ name: NAME })
    await openWebService(target())
    expect(tab.location.href).toBe(`https://${NAME}`)
    localName.mockResolvedValue({ name: 'device-acme.on.solo.remote.it' })
    await openWebService(target())
    expect(tab.location.href).toBe('https://device-acme.on.solo.remote.it:8123')
  })

  it('opens its web address where none does, or none that can say', async () => {
    post.mockResolvedValue(answered(ADDRESS))
    expect(await openWebService(target())).toBe(true)
    expect(tab.location.href).toBe(ADDRESS)
    localName.mockRejectedValue(new Error('gone'))
    tab.location.href = ''
    expect(await openWebService(target())).toBe(true)
    expect(tab.location.href).toBe(ADDRESS)
    expect(open).toHaveBeenCalledTimes(2)
  })

  it('does not wait for good on whether one does', async () => {
    vi.useFakeTimers()
    post.mockResolvedValue(answered(ADDRESS))
    localName.mockReturnValue(new Promise(() => {}))
    const opening = openWebService(target())
    await vi.advanceTimersByTimeAsync(WEB_ADDRESS_WAIT_MS)
    expect(await opening).toBe(true)
    expect(tab.location.href).toBe(ADDRESS)
  })
})

describe('web services made ready', () => {
  it('opens nothing, and knows the address', async () => {
    post.mockResolvedValue(answered(ADDRESS))
    expect(await readyWebAddress('S1')).toBe(true)
    expect(open).not.toHaveBeenCalled()
    expect(windowOpen).not.toHaveBeenCalled()
    expect(openInSystem).not.toHaveBeenCalled()
    expect(knownWebAddress('S1')).toBe(ADDRESS)
  })

  it('gives a failure as it is, whatever it was, the others going on, so many at a time', async () => {
    const answers: ((value: unknown) => void)[] = []
    post.mockImplementation(() => new Promise(resolve => answers.push(resolve)))
    const all = Array.from({ length: 10 }, (_, i) => readyWebAddress(`S${i}`))
    for (let done = 0; done < 10; done++) {
      await vi.waitFor(() => expect(answers.length).toBe(Math.min(10, done + 4)))
      if (done === 3) answers[done](Promise.reject(new Error('gone')))
      else if (done === 5) answers[done]({ data: { errors: [{ message: 'no access' }] } })
      else if (done === 7) answers[done]('ERROR')
      else answers[done](answered(ADDRESS))
    }
    const results = await Promise.all(all)
    expect(results.filter(result => result === true)).toHaveLength(7)
    expect([results[3], results[5], results[7]]).toEqual([{ reason: '' }, { reason: 'No access' }, { reason: '' }])
    expect(post).toHaveBeenCalledTimes(10)
    // None is kept from being made by what failed before it.
    post.mockResolvedValue(answered(ADDRESS))
    expect(await Promise.all(Array.from({ length: 5 }, () => readyWebAddress('S1')))).toEqual(Array(5).fill(true))
  })
})

describe('the addresses there are', () => {
  const services = (...list: object[]) => ({ data: { data: { login: { device: [{ id: 'D1', services: list }] } } } })
  const settled = () => new Promise(resolve => setTimeout(resolve, 5))

  it('are read in one query for all that ask at once, each once', async () => {
    api.addresses = services(
      { id: 'S1', webAddress: ADDRESS },
      { id: 'S2', webAddress: null },
      { id: 'S3', webAddress: 'x' }
    )
    await decideWebAddress(target())
    const told = vi.fn()
    const off = subscribeWebAddresses(told)
    for (const id of ['S1', 'S2', 'S1']) requestWebAddress(target({ id }))
    await settled()
    off()
    expect(asked('webAddress }')).toBe(1)
    expect(basic.mock.calls.at(-1)!.slice(1)).toEqual([{ ids: ['D1'] }, true, { sub: '', about: ['D1'] }])
    expect([knownWebAddress('S1'), knownWebAddress('S2'), knownWebAddress('S3')]).toEqual([
      ADDRESS,
      undefined,
      undefined,
    ])
    expect(told).toHaveBeenCalled()
    requestWebAddress(target({ id: 'S2' }))
    await settled()
    expect(asked('webAddress }')).toBe(1)
  })

  it('are asked of each device’s own sign-in', async () => {
    api.addresses = services()
    await decideWebAddress(target())
    requestWebAddress(target())
    requestWebAddress(target({ id: 'S9', deviceID: 'D-work' }))
    await settled()
    expect(basic.mock.calls.slice(-2).map(call => call[3])).toEqual([
      { sub: '', about: ['D1'] },
      { sub: 'work', about: ['D-work'] },
    ])
  })

  it('are never asked of an API without them, nor before that is known; one that failed is asked again', async () => {
    requestWebAddress(target())
    await settled()
    expect(basic).not.toHaveBeenCalled()
    api.service = []
    await decideWebAddress(target())
    requestWebAddress(target())
    await settled()
    expect(asked('webAddress }')).toBe(0)
    resetWebAddresses()
    Object.assign(api, { service: ['webAddress'], addresses: 'ERROR' })
    await decideWebAddress(target())
    requestWebAddress(target())
    await settled()
    api.addresses = services({ id: 'S1', webAddress: ADDRESS })
    requestWebAddress(target())
    await settled()
    expect(knownWebAddress('S1')).toBe(ADDRESS)
  })
})
