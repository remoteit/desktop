import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rowKey } from '../helpers/rowKey'

// Work's own account, in its row: under the sign-in that read it.
const WORK = rowKey('work', 'sub-work')

// The DNS beacon's sign-in answer (graphql-api docs/PROXY-GROUPS.md §15, "The portal and an installed daemon"): whether
// the daemon here would serve this person once they sign in on it, and the app's sign-in link — read only from an API
// that has the fields, and only a link of the app's own shape.
const { request, browser, state } = vi.hoisted(() => ({
  request: vi.fn(),
  browser: { isElectron: false },
  state: {} as Record<string, any>, // who is signed in, where a test says
}))
vi.mock('../selectors/signIns', async importOriginal => {
  const signIns = await importOriginal<typeof import('../selectors/signIns')>()
  signIns.readStateWith(() => ({ ...state } as any))
  return signIns
})
vi.mock('./graphQL', () => ({ graphQLBasicRequest: (...args: unknown[]) => request(...args) }))
vi.mock('./browser', () => ({ default: browser }))

const LINK = 'remoteit-solo://sign-in'
const FIELDS = ['seen', 'name', 'deviceId', 'signInNeeded', 'signInLink']

type Answers = { fields?: string[] | 'ERROR'; signIn?: any; name?: string | null }

function answer(a: Answers) {
  request.mockImplementation(async (query: string) => {
    const data = (d: any) => ({ data: { data: d } })
    if (query.includes('CreateSubnetProbe'))
      return data({ createSubnetProbe: { token: 'a'.repeat(24), name: `${'a'.repeat(24)}-probe.on.solo.remote.it` } })
    if (query.includes('SubnetProbeSeen')) return data({ subnetProbe: { seen: true } })
    if (query.includes('SubnetProbeFields'))
      return a.fields === 'ERROR' ? 'ERROR' : data({ answer: { fields: (a.fields ?? FIELDS).map(name => ({ name })) } })
    if (query.includes('SubnetProbeSignIn')) return data({ subnetProbe: { seen: true, ...a.signIn } })
    if (query.includes('query SubnetProbe(')) return data({ subnetProbe: { seen: true, name: a.name ?? null } })
    throw new Error(`unexpected ${query}`)
  })
}

const load = async () => {
  vi.resetModules()
  return import('./localSubnet')
}

beforeEach(() => {
  request.mockReset()
  browser.isElectron = false
})

describe('signInLinkOf', () => {
  it("takes only the app's own link: remoteit-<stage>://sign-in, nothing in it", async () => {
    const { signInLinkOf } = await load()
    expect(signInLinkOf(LINK)).toBe(LINK)
    expect(signInLinkOf('remoteit-local2://sign-in')).toBe('remoteit-local2://sign-in')
    expect(signInLinkOf('remoteit-solo://sign-in?token=x')).toBeUndefined()
    expect(signInLinkOf('remoteit-solo://sign-in#x')).toBeUndefined()
    expect(signInLinkOf('https://evil.example/sign-in')).toBeUndefined()
    expect(signInLinkOf('javascript:alert(1)//remoteit-solo://sign-in')).toBeUndefined()
    expect(signInLinkOf(undefined)).toBeUndefined()
  })
})

describe('localSignIn', () => {
  it('signInNeeded with a link: the link', async () => {
    answer({ signIn: { signInNeeded: true, signInLink: LINK } })
    const { localSignIn } = await load()
    expect(await localSignIn()).toEqual({ link: LINK })
  })

  it('signInNeeded with no link, or one not of its shape: no link (sign in from the menu)', async () => {
    answer({ signIn: { signInNeeded: true, signInLink: null } })
    expect(await (await load()).localSignIn()).toEqual({})
    answer({ signIn: { signInNeeded: true, signInLink: 'https://evil.example' } })
    expect(await (await load()).localSignIn()).toEqual({})
  })

  it('served already: nothing', async () => {
    answer({ signIn: { signInNeeded: null, signInLink: null } })
    expect(await (await load()).localSignIn()).toBeNull()
  })

  it('an API without the fields is never asked them, and a failed schema read is read again', async () => {
    answer({ fields: ['seen', 'name', 'deviceId'] })
    expect(await (await load()).localSignIn()).toBeNull()
    expect(request.mock.calls.some(([q]) => q.includes('SubnetProbeSignIn'))).toBe(false)

    answer({ fields: 'ERROR', signIn: { signInNeeded: true } })
    const mod = await load()
    expect(await mod.localSignIn()).toBeNull()
    answer({ signIn: { signInNeeded: true, signInLink: LINK } })
    mod.forgetLocal()
    expect(await mod.localSignIn()).toEqual({ link: LINK })
  })

  it('the Desktop app asks nothing: its own sign-in, and its name API answers for its person', async () => {
    browser.isElectron = true
    answer({ signIn: { signInNeeded: true, signInLink: LINK } })
    expect(await (await load()).localSignIn()).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it('kept a while; forgetLocal asks again and tells every listener', async () => {
    answer({ signIn: { signInNeeded: true, signInLink: LINK } })
    const mod = await load()
    expect(await mod.localSignIn()).toEqual({ link: LINK })
    answer({ signIn: { signInNeeded: false }, name: 'pi-ada.on.solo.remote.it' })
    expect(await mod.localSignIn()).toEqual({ link: LINK })
    const heard = vi.fn()
    const off = mod.onLocalForgotten(heard)
    mod.forgetLocal()
    expect(heard).toHaveBeenCalledTimes(1)
    expect(await mod.localSignIn()).toBeNull()
    expect(await mod.localSubnetName('S1', 'pi-ada.on.solo.remote.it')).toEqual({ name: 'pi-ada.on.solo.remote.it' })
    off()
    mod.forgetLocal()
    expect(heard).toHaveBeenCalledTimes(1)
  })
})

describe('localSubnetName', () => {
  const NAME = 'pi-ada.on.solo.remote.it'
  const asked = () => request.mock.calls.filter(([q]) => q.includes('query SubnetProbe(')).length

  it('a "no" is kept a while; asked again, it is asked anew and a name kept', async () => {
    answer({ name: null })
    const mod = await load()
    expect(await mod.localSubnetName('S1', NAME)).toBeNull()
    expect(await mod.localSubnetName('S1', NAME)).toBeNull()
    expect(asked()).toBe(1)
    answer({ name: NAME })
    expect(await mod.localSubnetName('S1', NAME, true)).toEqual({ name: NAME })
    expect(asked()).toBe(2)
    expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    expect(asked()).toBe(2)
    expect(mod.localPresent()).toBe(true)
  })

  // presence-server docs/subnet-service-names.md: a service's own name turned on or off changes the name asked about,
  // and the answer for the old name is not the new one's.
  it("a service's name changed is asked anew, not answered with the old name's", async () => {
    answer({ name: NAME })
    const mod = await load()
    expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    answer({ name: 'piconsole-ada.on.solo.remote.it' })
    expect(await mod.localSubnetName('S1', 'piconsole-ada.on.solo.remote.it')).toEqual({
      name: 'piconsole-ada.on.solo.remote.it',
    })
    expect(asked()).toBe(2)
  })
})

/* Whether an agent is here: one answer for every page, asked as the page loads and again behind what is shown. */
describe('whether an agent is here', () => {
  const NAME = 'pi-ada.on.solo.remote.it'
  let here: boolean | 'ERROR' | 'SLOW' // what its machine says
  let made: number
  let known: Set<string> // the tokens graphql has
  let stop: (() => void) | undefined
  let hidden = false

  const count = (what: string) => request.mock.calls.filter(([query]) => query.includes(what)).length
  const looked = () => document.dispatchEvent(new Event('visibilitychange'))
  const pass = (ms: number) => vi.advanceTimersByTimeAsync(ms)

  beforeEach(() => {
    vi.useFakeTimers()
    here = false
    made = 0
    known = new Set()
    hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    request.mockImplementation(async (query: string, variables: any = {}) => {
      const data = (d: any) => ({ data: { data: d } })
      if (here === 'SLOW') return new Promise(() => {})
      if (here === 'ERROR') return 'ERROR'
      if (query.includes('CreateSubnetProbe')) {
        const token = `token-${++made}`
        known.add(token)
        return data({ createSubnetProbe: { token, name: `${token}-probe.on.solo.remote.it` } })
      }
      if (query.includes('SubnetProbeSeen')) return data({ subnetProbe: { seen: here } })
      const seen = known.has(variables.token)
      if (query.includes('SubnetProbeFields')) return data({ answer: { fields: [] } })
      if (query.includes('SubnetProbeDevice')) return data({ subnetProbe: { seen, deviceId: seen ? 'D1' : null } })
      if (query.includes('query SubnetProbe(')) return data({ subnetProbe: { seen, name: seen ? NAME : null } })
      throw new Error(`unexpected ${query}`)
    })
  })
  afterEach(() => {
    stop?.()
    stop = undefined
    vi.restoreAllMocks()
    vi.useRealTimers()
  })
  const follow = async () => {
    const mod = await load()
    stop = mod.followLocalAgent()
    return mod
  }

  it('is asked once as the page loads, however many pages ask: one probe, four requests with none here', async () => {
    const mod = await follow()
    const asked = [
      mod.localSubnetName('S1', NAME),
      mod.localSubnetName('S2', NAME),
      mod.beaconDevice(),
      mod.localSignIn(),
    ]
    await pass(2_000)
    expect(await Promise.all(asked)).toEqual([null, null, null, null])
    expect([made, count('SubnetProbeSeen'), request.mock.calls.length]).toEqual([1, 3, 4])
    request.mockClear()
    // No later page waits, nor asks.
    for (const id of ['S1', 'S3', 'S4']) {
      expect(mod.localNow(id, NAME)).toEqual({ checked: true })
      expect(await mod.localSubnetName(id, NAME, true)).toBeNull()
    }
    expect(await mod.beaconDevice()).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it('with one here is two requests, and each service is asked of it', async () => {
    here = true
    const mod = await follow()
    await pass(200)
    expect(mod.localPresent()).toBe(true)
    expect([made, count('SubnetProbeSeen'), request.mock.calls.length]).toEqual([1, 1, 2])
    expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    expect(await mod.beaconDevice()).toBe('D1')
    expect(made).toBe(1)
  })

  it('is never asked by a timer', async () => {
    await follow()
    await pass(60 * 60_000)
    expect(made).toBe(1)
  })

  it('is asked again when the page is looked at, at a pace: a minute, then less and less where none is found', async () => {
    const mod = await follow()
    await pass(2_000)
    const at = async (ms: number) => {
      await pass(ms)
      looked()
      window.dispatchEvent(new Event('focus'))
      await pass(2_000)
    }
    await at(30_000)
    expect(made).toBe(1)
    request.mockClear()
    await at(30_000)
    expect(made).toBe(2)
    expect(request).toHaveBeenCalledTimes(3) // hurried for no one, and asked after less
    await at(90_000)
    expect(made).toBe(2)
    await at(30_000)
    expect(made).toBe(3)
    await at(200_000)
    expect(made).toBe(3)
    await at(100_000)
    expect(made).toBe(4)
    expect(mod.localPresent()).toBe(false)
  })

  it('is asked again at once when the network comes back', async () => {
    await follow()
    await pass(2_000)
    window.dispatchEvent(new Event('online'))
    window.dispatchEvent(new Event('online'))
    await pass(2_000)
    expect(made).toBe(2)
  })

  it('is asked again when the sign-ins change, at that pace, and when a service is opened with an answer over a minute old', async () => {
    const mod = await follow()
    await pass(2_000)
    const { forgetAccountCaches } = await import('./accountCaches')
    forgetAccountCaches(['a'])
    await pass(2_000)
    expect(made).toBe(1)
    await pass(60_000)
    forgetAccountCaches(['a'])
    await pass(2_000)
    expect(made).toBe(2)
    await pass(61_000)
    // Behind the page: it has the answer there is, at once.
    const opened = mod.localSubnetName('S1', NAME)
    expect(await opened).toBeNull()
    await pass(2_000)
    expect(made).toBe(3)
    await mod.localSubnetName('S2', NAME)
    await pass(2_000)
    expect(made).toBe(3)
  })

  it('is asked again by a sign-in on this machine where none was known, every ten seconds at most; not where one is here', async () => {
    const mod = await follow()
    await pass(2_000)
    for (let i = 0; i < 10; i++) {
      mod.forgetLocal()
      await pass(3_000)
    }
    expect(made).toBe(3)
    here = true
    await pass(10_000)
    mod.forgetLocal()
    await pass(2_000)
    expect(mod.localPresent()).toBe(true)
    made = 0
    for (let i = 0; i < 10; i++) {
      mod.forgetLocal()
      await pass(3_000)
    }
    expect(made).toBe(0)
  })

  it('tells who shows it when one comes, and when it goes', async () => {
    const mod = await follow()
    await pass(2_000)
    const told = vi.fn()
    const changed = vi.fn()
    mod.onLocalForgotten(told)
    mod.onLocalAgent(changed)
    here = true
    window.dispatchEvent(new Event('online'))
    await pass(1_000)
    expect([told.mock.calls.length, changed.mock.calls.length]).toEqual([1, 1])
    expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    expect(mod.localNow('S1', NAME)).toEqual({ local: { name: NAME }, checked: true })
    window.dispatchEvent(new Event('online'))
    await pass(1_000)
    expect(told).toHaveBeenCalledTimes(1) // the same answer tells no one
    here = false
    window.dispatchEvent(new Event('online'))
    await pass(2_000)
    expect([told.mock.calls.length, changed.mock.calls.length]).toEqual([2, 2])
    expect(mod.localNow('S1', NAME)).toEqual({ checked: true })
    expect(await mod.localSubnetName('S1', NAME)).toBeNull()
  })

  it('shows the last answer for a service while it is asked again', async () => {
    here = true
    const mod = await follow()
    await pass(1_000)
    await mod.localSubnetName('S1', NAME)
    await pass(20_000)
    request.mockClear()
    expect(mod.localNow('S1', NAME)).toEqual({ local: { name: NAME }, checked: true })
    expect(mod.localNow('S2', NAME)).toEqual({ checked: false })
    expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    expect(count('query SubnetProbe(')).toBe(1)
  })

  it('makes a token anew once it has been used its minute, as it is needed: quick where one is here', async () => {
    here = true
    const mod = await follow()
    await pass(1_000)
    expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    await pass(61_000)
    expect(made).toBe(1)
    const asked = mod.localSubnetName('S1', NAME)
    const other = mod.localSubnetName('S2', NAME)
    await pass(200)
    expect(await Promise.all([asked, other])).toEqual([{ name: NAME }, { name: NAME }])
    expect(made).toBe(2)
    // Gone meanwhile: found as it is renewed.
    here = false
    await pass(61_000)
    const gone = mod.localSubnetName('S1', NAME)
    await pass(2_000)
    expect(await gone).toBeNull()
    expect(mod.localPresent()).toBe(false)
  })

  it('a token graphql does not know any more is no answer, and is made anew at the pace kept for it', async () => {
    here = true
    const mod = await follow()
    await pass(1_000)
    known.clear()
    expect(await mod.localSubnetName('S1', NAME)).toBeUndefined()
    expect(await mod.localSubnetName('S2', NAME)).toBeUndefined()
    expect(made).toBe(1)
    await pass(60_000)
    const asked = mod.localSubnetName('S1', NAME)
    await pass(1_000)
    expect(await asked).toEqual({ name: NAME })
    expect(made).toBe(2)
  })

  it.each(['ERROR', 'SLOW'] as const)(
    'a request that fails, or never answers, is not that none is here: %s',
    async how => {
      here = how
      const mod = await follow()
      const first = mod.localSubnetName('S1', NAME)
      await pass(4_000)
      expect(await first).toBeUndefined()
      expect(mod.localPresent()).toBe(false)
      expect(mod.localNow('S1', NAME)).toEqual({ checked: false })
      here = true
      // Asked again at the pace kept for it, or where the network comes back.
      window.dispatchEvent(new Event('online'))
      await pass(1_000)
      expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME })
    }
  )

  it('nor is what it was, where it was here', async () => {
    here = true
    const mod = await follow()
    await pass(1_000)
    await mod.localSubnetName('S1', NAME)
    here = 'ERROR'
    window.dispatchEvent(new Event('online'))
    await pass(2_000)
    expect(mod.localPresent()).toBe(true)
    expect(await mod.localSubnetName('S9', NAME)).toBeUndefined()
    expect(mod.localNow('S1', NAME)).toEqual({ local: { name: NAME }, checked: true })
  })

  it('nor is a probe whose last poll failed: whether it was seen is not known', async () => {
    const answering = request.getMockImplementation()!
    request.mockImplementation(async (query: string, variables: any) =>
      query.includes('SubnetProbeSeen') ? 'ERROR' : answering(query, variables)
    )
    const mod = await follow()
    const first = mod.localSubnetName('S1', NAME)
    await pass(2_000)
    expect(await first).toBeUndefined()
    expect(mod.localNow('S1', NAME)).toEqual({ checked: false })
  })

  it('a poll that fails before the last is asked again; the last says', async () => {
    const answering = request.getMockImplementation()!
    let polls = 0
    request.mockImplementation(async (query: string, variables: any) =>
      query.includes('SubnetProbeSeen') && ++polls < 3 ? 'ERROR' : answering(query, variables)
    )
    const mod = await follow()
    await pass(2_000)
    expect(mod.localNow('S1', NAME)).toEqual({ checked: true })
  })

  it('sends nothing while the page is hidden, and asks once it is shown', async () => {
    hidden = true
    const mod = await follow()
    expect(await mod.localSubnetName('S1', NAME)).toBeUndefined()
    window.dispatchEvent(new Event('online'))
    looked()
    await pass(120_000)
    expect(request).not.toHaveBeenCalled()
    hidden = false
    here = true
    looked()
    await pass(1_000)
    expect(made).toBe(1)
    expect(mod.localPresent()).toBe(true)
  })

  it('asks once shown what the network coming back asked while it was hidden, whatever the pace', async () => {
    await follow()
    await pass(2_000)
    hidden = true
    window.dispatchEvent(new Event('online'))
    await pass(1_000)
    expect(made).toBe(1)
    // Looked at so soon, it would not be asked again but for that.
    hidden = false
    looked()
    await pass(2_000)
    expect(made).toBe(2)
    looked()
    await pass(2_000)
    expect(made).toBe(2)
  })

  it('stops asking where the page is hidden meanwhile: no try, and asked again once shown', async () => {
    const mod = await follow()
    await pass(300)
    hidden = true
    request.mockClear()
    await pass(5_000)
    expect(request).not.toHaveBeenCalled()
    expect(mod.localNow('S1', NAME)).toEqual({ checked: false })
    hidden = false
    looked()
    await pass(2_000)
    expect(made).toBe(2)
    expect(mod.localNow('S1', NAME)).toEqual({ checked: true })
  })

  it('is forgotten at sign-out, and what was under way says nothing to whoever signs in next', async () => {
    here = true
    const mod = await follow()
    await pass(100)
    stop!()
    await pass(1_000)
    expect(mod.localPresent()).toBe(false)
    request.mockClear()
    looked()
    window.dispatchEvent(new Event('online'))
    await pass(2_000)
    expect(request).not.toHaveBeenCalled()
    stop = mod.followLocalAgent()
    await pass(1_000)
    expect(made).toBe(2)
  })

  it('sends nothing before it is followed, nor unless it is asked', async () => {
    await load()
    looked()
    window.dispatchEvent(new Event('focus'))
    await pass(120_000)
    expect(request).not.toHaveBeenCalled()
  })

  describe('in the Desktop app', () => {
    let answers: boolean
    const fetched = vi.fn()
    beforeEach(() => {
      browser.isElectron = true
      answers = true
      fetched.mockReset().mockImplementation(async (url: string) => {
        if (!answers) throw new Error('refused')
        const name = new URL(url).searchParams.get('name')
        return { ok: true, json: async () => (name ? { name, address: '10.0.0.1' } : {}) }
      })
      vi.stubGlobal('fetch', fetched)
    })
    afterEach(() => vi.unstubAllGlobals())

    it('is the name API’s to say, and nothing is asked of graphql', async () => {
      const mod = await follow()
      await pass(0)
      expect(mod.localPresent()).toBe(true)
      expect(await mod.localSubnetName('S1', NAME)).toEqual({ name: NAME, address: '10.0.0.1' })
      expect(request).not.toHaveBeenCalled()
      answers = false
      window.dispatchEvent(new Event('online'))
      await pass(0)
      expect(mod.localPresent()).toBe(false)
      fetched.mockClear()
      expect(await mod.localSubnetName('S1', NAME)).toBeNull()
      expect(fetched).not.toHaveBeenCalled()
      answers = true
      await pass(61_000)
      expect(await mod.localSubnetName('S1', NAME)).toBeNull()
      await pass(0)
      expect(mod.localPresent()).toBe(true)
    })

    it('a local port’s machine is the beacon’s still, which says nothing of the name API', async () => {
      const mod = await follow()
      await pass(0)
      here = true
      const device = mod.beaconDevice()
      await pass(1_000)
      expect(await device).toBe('D1')
      here = false
      await pass(61_000)
      const none = mod.beaconDevice()
      await pass(2_000)
      expect(await none).toBeNull()
      expect(mod.localPresent()).toBe(true)
    })
  })
})

/* graphql ties a probe to the person who made it. A service of an account another sign-in serves is asked of that
   sign-in's own probe — made, waited for and read as them. */
describe('with several sign-ins in use', () => {
  const made: (string | undefined)[] = []
  const read: [string, string | undefined][] = []
  beforeEach(() => {
    made.length = 0
    read.length = 0
    Object.assign(state, {
      auth: { user: { id: 'me' } },
      accounts: {
        membership: [],
        signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
      },
      devices: {
        me: { all: [{ id: 'd-me', services: [{ id: 's-me' }] }] },
        [WORK]: { all: [{ id: 'd-work', services: [{ id: 's-work' }] }] },
      },
    })
    request.mockImplementation(
      async (query: string, variables: any, _silent?: boolean, requestFor?: { sub: string }) => {
        const data = (d: any) => ({ data: { data: d } })
        const who = requestFor?.sub || 'primary'
        if (query.includes('CreateSubnetProbe')) {
          made.push(requestFor?.sub)
          return data({ createSubnetProbe: { token: `token-of-${who}`, name: `${who}-probe.on.solo.remote.it` } })
        }
        // Only the person who made a probe can read it.
        const own = variables.token === `token-of-${who}`
        if (query.includes('SubnetProbeSeen')) return data({ subnetProbe: { seen: own } })
        if (query.includes('query SubnetProbe(')) {
          read.push([variables.id, requestFor?.sub])
          return data({ subnetProbe: { seen: own, name: own ? `${variables.id}.on.solo.remote.it` : null } })
        }
        throw new Error(`unexpected ${query}`)
      }
    )
  })

  it('a service is asked of the probe of the sign-in that serves it, made and read as them', async () => {
    const { localSubnetName } = await load()
    expect(await localSubnetName('s-work', 'pi')).toEqual({ name: 's-work.on.solo.remote.it' })
    expect(await localSubnetName('s-me', 'mac')).toEqual({ name: 's-me.on.solo.remote.it' })
    expect(made).toEqual(['sub-work', undefined])
    expect(read).toEqual([
      ['s-work', 'sub-work'],
      ['s-me', undefined],
    ])
    // One probe for each: the next service of the same sign-in makes no other.
    await localSubnetName('d-work', 'pi-device')
    expect(made).toHaveLength(2)
    Object.keys(state).forEach(key => delete state[key])
  })

  it('with none here, no sign-in but the first to ask sends a probe: it is the machine’s answer', async () => {
    vi.useFakeTimers()
    const answering = request.getMockImplementation()!
    request.mockImplementation(async (query: string, ...rest: any[]) =>
      query.includes('SubnetProbeSeen')
        ? { data: { data: { subnetProbe: { seen: false } } } }
        : answering(query, ...rest)
    )
    const { localSubnetName, followLocalAgent } = await load()
    const stop = followLocalAgent()
    await vi.advanceTimersByTimeAsync(2_000)
    expect(await localSubnetName('s-work', 'pi')).toBeNull()
    expect(await localSubnetName('s-me', 'mac')).toBeNull()
    expect(made).toEqual([undefined])
    stop()
    vi.useRealTimers()
    Object.keys(state).forEach(key => delete state[key])
  })

  it('a sign-in’s probe given up as the page was hidden is no try of it', async () => {
    vi.useFakeTimers()
    let hidden = false
    const spy = vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const { localSubnetName, followLocalAgent } = await load()
    const stop = followLocalAgent()
    await vi.advanceTimersByTimeAsync(1_000)
    const asked = localSubnetName('s-work', 'pi')
    await vi.advanceTimersByTimeAsync(50)
    hidden = true
    await vi.advanceTimersByTimeAsync(1_000)
    expect(await asked).toBeUndefined()
    hidden = false
    const again = localSubnetName('s-work', 'pi')
    await vi.advanceTimersByTimeAsync(1_000)
    expect(await again).toEqual({ name: 's-work.on.solo.remote.it' })
    stop()
    spy.mockRestore()
    vi.useRealTimers()
    Object.keys(state).forEach(key => delete state[key])
  })

  it('each sign-in has one probe under way, and its own token when one comes back', async () => {
    vi.useFakeTimers()
    const { localSubnetName, followLocalAgent } = await load()
    const stop = followLocalAgent()
    const asked = [localSubnetName('s-work', 'pi'), localSubnetName('d-work', 'x'), localSubnetName('s-me', 'mac')]
    await vi.advanceTimersByTimeAsync(1_000)
    expect((await Promise.all(asked)).every(Boolean)).toBe(true)
    expect(made).toEqual([undefined, 'sub-work'])
    stop()
    vi.useRealTimers()
    Object.keys(state).forEach(key => delete state[key])
  })

  it('whoever shows an answer is told to ask again when another sign-in comes to serve an account, and asks as them', async () => {
    const { localSubnetName, onLocalForgotten } = await load()
    const { forgetAccountCaches } = await import('./accountCaches')
    const told = vi.fn()
    const off = onLocalForgotten(told)
    await localSubnetName('s-work', 'pi')
    expect(read).toEqual([['s-work', 'sub-work']])
    told.mockClear() // told that an agent is here
    // The service's account is the page's own person's to serve from now on: the same name, another's answer.
    state.devices = { me: { all: [...state.devices.me.all, ...state.devices[WORK].all] } }
    forgetAccountCaches(['work'])
    expect(told).toHaveBeenCalledTimes(1)
    await localSubnetName('s-work', 'pi')
    expect(read).toEqual([
      ['s-work', 'sub-work'],
      ['s-work', undefined],
    ])
    off()
    Object.keys(state).forEach(key => delete state[key])
  })
})
