import { describe, it, expect, vi, beforeEach } from 'vitest'

// The DNS beacon's sign-in answer (graphql-api docs/PROXY-GROUPS.md §15, "The portal and an installed daemon"): whether
// the daemon here would serve this person once they sign in on it, and the app's sign-in link — read only from an API
// that has the fields, and only a link of the app's own shape.
const { request, browser } = vi.hoisted(() => ({ request: vi.fn(), browser: { isElectron: false } }))
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
