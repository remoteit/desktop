import { describe, it, expect, vi, beforeEach } from 'vitest'
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
    expect(mod.localAbsent()).toBe(false)
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

  it('no daemon here: no, without asking, even asked again, until its backoff is past', async () => {
    vi.useFakeTimers()
    try {
      request.mockImplementation(async (query: string) => {
        if (query.includes('CreateSubnetProbe'))
          return { data: { data: { createSubnetProbe: { token: 'b'.repeat(24), name: 'b-probe.on.solo.remote.it' } } } }
        return { data: { data: { subnetProbe: { seen: false } } } }
      })
      const mod = await load()
      const first = mod.localSubnetName('S1', NAME)
      await vi.advanceTimersByTimeAsync(2_000)
      expect(await first).toBeNull()
      expect(mod.localAbsent()).toBe(true)
      const calls = request.mock.calls.length
      expect(await mod.localSubnetName('S1', NAME, true)).toBeNull()
      expect(request.mock.calls.length).toBe(calls)
      await vi.advanceTimersByTimeAsync(60_000)
      expect(mod.localAbsent()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
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

  it('whoever shows an answer is told to ask again when another sign-in comes to serve an account, and asks as them', async () => {
    const { localSubnetName, onLocalForgotten } = await load()
    const { forgetAccountCaches } = await import('./accountCaches')
    const told = vi.fn()
    const off = onLocalForgotten(told)
    await localSubnetName('s-work', 'pi')
    expect(read).toEqual([['s-work', 'sub-work']])
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
