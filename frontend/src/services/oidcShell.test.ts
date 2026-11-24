import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockBridge, MockBridgeOptions } from './thisDeviceMock'

// The token-source seam (services/oidc, "the SHELL's sign-in"): with thisDevice present and offering `auth`, the
// portal starts no flow, stores nothing, and asks the shell for every token, proof and account change; a plain
// browser (no transport) keeps its own sign-in.

const { leaveTo } = vi.hoisted(() => ({ leaveTo: vi.fn() }))
vi.mock('./browser', () => ({ default: { isNative: false, isElectron: false }, leaveTo }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('../i18n', () => ({ default: { language: 'en', resolvedLanguage: 'en' } }))
vi.mock('../constants', () => ({
  OAUTH_ISSUER: 'https://login.solo.remote.it',
  OAUTH_CLIENT_ID: 'remoteit_portal',
  OAUTH_GRAPHQL_RESOURCE: 'https://cloud.solo.remote.it/api',
  OAUTH_MCP_RESOURCE: 'https://cloud.solo.remote.it/mcp',
  OAUTH_MCP_DETAIL: 'remoteit_mcp',
  OAUTH_AGENT_ACTOR: 'svc_ai_agent',
  OAUTH_ACCOUNT_RESOURCE: 'https://login.solo.remote.it/account/api',
  PROTOCOL: 'remoteit://',
  EMBEDDED: true,
}))

const API = 'https://cloud.solo.remote.it/api'

async function boot(options?: MockBridgeOptions | null) {
  vi.resetModules()
  const bridge = options === null ? undefined : createMockBridge(options)
  const td = await import('./thisDevice')
  if (bridge) td.registerBridgeTransport(async () => bridge.transport)
  const oidc = await import('./oidc')
  const reload = vi.fn()
  oidc.oidcShellHooks.reload = reload
  const used = await oidc.oidcUseShell()
  return { oidc, bridge, reload, used }
}

const fetchSpy = vi.fn()
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  leaveTo.mockReset()
  fetchSpy.mockReset().mockRejectedValue(new Error('no network in this test'))
  vi.stubGlobal('fetch', fetchSpy)
})
afterEach(() => vi.unstubAllGlobals())

const headersFor = (oidc: typeof import('./oidc')) =>
  oidc.oidcAuthorized('POST', API + '/graphql', API, async headers => headers, () => undefined)

const stored = () => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]

describe('with the shell signing in', () => {
  it('takes the shell’s person as signed in, with no flow and nothing stored', async () => {
    const { oidc, used } = await boot()
    expect(used).toBe(true)
    expect(oidc.oidcShell()).toBe(true)
    expect(oidc.oidcSignedIn()).toBe(true)
    expect(oidc.oidcClaims()).toMatchObject({ sub: 'sub-person', email: 'person@example.com' })
    expect(await oidc.oidcCompleteFromUrl()).toBeUndefined()
    expect(oidc.oidcGrantStale()).toBe(false)
    expect(oidc.oidcActor()).toBeNull()
    expect(stored()).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled() // no discovery, no token endpoint, no MCP metadata
  })

  it('asks the shell for an access token per resource, once while it is fresh', async () => {
    const { oidc, bridge } = await boot()
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    const account = 'https://login.solo.remote.it/account/api'
    expect(await oidc.oidcAccessToken(account)).toBe('token-for:sub-person:' + account)
    const asked = bridge!.calls.filter(c => c.method === 'auth.accessToken').map(c => c.args.resource)
    expect(asked).toEqual([API, account])
    expect(await headersFor(oidc)).toEqual({ authorization: 'Bearer token-for:sub-person:' + API })
    expect(stored()).toEqual([])
  })

  it('presents a DPoP-bound token with the shell’s proof, and makes no key of its own', async () => {
    const { oidc, bridge } = await boot({ tokenType: 'DPoP' })
    const headers = await headersFor(oidc)
    expect(headers).toEqual({ authorization: 'DPoP token-for:sub-person:' + API, DPoP: 'proof:POST:' + API + '/graphql' })
    expect(bridge!.calls.find(c => c.method === 'auth.dpopProof')!.args).toEqual({
      method: 'POST',
      url: API + '/graphql',
      accessToken: 'token-for:sub-person:' + API,
    })
  })

  it('is signed out when the shell is: no token, and no flow of its own', async () => {
    const { oidc } = await boot({ accounts: [] })
    expect(oidc.oidcSignedIn()).toBe(false)
    expect(await oidc.oidcAccessToken(API)).toBe('')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('signs in through the shell, never leaving for the AS, and reloads as the new person', async () => {
    const { oidc, bridge, reload } = await boot({ accounts: [] })
    expect(await oidc.oidcStart({ prompt: 'select_account' })).toBe(true)
    expect(bridge!.calls.find(c => c.method === 'auth.signIn')!.args).toEqual({ addAccount: false })
    expect(leaveTo).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalled()
    expect(stored().filter(k => !k.startsWith('oidc.autoStarts'))).toEqual([])
  })

  it('leaves silent rounds to the shell', async () => {
    const { oidc, bridge } = await boot()
    expect(await oidc.oidcStart({ prompt: 'none', loginHint: 'person@example.com' })).toBe(false)
    expect(bridge!.calls.some(c => c.method === 'auth.signIn')).toBe(false)
  })

  it('signs out through the shell, and its own sign-out does not reload the page', async () => {
    const { oidc, bridge, reload } = await boot()
    expect(await oidc.oidcEndSession()).toBe(204)
    expect(bridge!.calls.find(c => c.method === 'auth.signOut')!.args).toEqual({ sub: 'sub-person' })
    oidc.oidcClearLocal()
    expect(oidc.oidcSignedIn()).toBe(false)
    await new Promise(r => setTimeout(r)) // the shell's auth event
    expect(reload).not.toHaveBeenCalled()
  })

  it('lists the shell’s accounts and switches through it', async () => {
    const { oidc, bridge, reload } = await boot({
      accounts: [
        { sub: 'sub-person', email: 'person@example.com', active: true },
        { sub: 'sub-other', email: 'other@example.com', active: false },
      ],
    })
    expect(oidc.oidcAccounts().map(a => [a.email, a.active, a.known])).toEqual([
      ['person@example.com', true, false],
      ['other@example.com', false, false],
    ])
    expect(oidc.oidcActivateAccount('sub-other')).toBe(false)
    expect(await oidc.oidcSelectKnownAccount('sub-other')).toBe(true)
    expect(bridge!.calls.find(c => c.method === 'auth.switch')!.args).toEqual({ sub: 'sub-other' })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads when the shell’s person changes under it (the menu signed someone else in)', async () => {
    const { bridge, reload } = await boot()
    bridge!.emit('auth', { active: { sub: 'sub-person', email: 'person@example.com', active: true } })
    await new Promise(r => setTimeout(r))
    expect(reload).not.toHaveBeenCalled()
    bridge!.emit('auth', { active: { sub: 'sub-else', email: 'else@example.com', active: true } })
    await new Promise(r => setTimeout(r))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('with a shell that keeps several credentials in use', () => {
  const SEVERAL = {
    several: true,
    accounts: [
      { sub: 'sub-person', email: 'person@example.com', active: true, signedIn: true },
      { sub: 'sub-work', email: 'work@example.com', active: false, signedIn: true },
      { sub: 'sub-old', email: 'old@example.com', active: false, signedIn: false },
    ],
  }
  const tick = () => new Promise(r => setTimeout(r))

  it('takes every credential in use as a sign-in, the active one as the page’s person', async () => {
    const { oidc } = await boot(SEVERAL)
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(oidc.oidcSignIns().map(signIn => [signIn.sub, signIn.primary])).toEqual([
      ['sub-person', true],
      ['sub-work', false],
    ])
    expect(oidc.oidcAccounts().map(account => [account.sub, account.signedIn])).toEqual([
      ['sub-person', true],
      ['sub-old', false],
      ['sub-work', true],
    ])
  })

  it('asks for each sign-in’s token and proof by name, and caches them apart', async () => {
    const { oidc, bridge } = await boot({ ...SEVERAL, tokenType: 'DPoP' })
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('token-for:sub-work:' + API)
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('token-for:sub-work:' + API)
    expect(bridge!.calls.filter(c => c.method === 'auth.accessToken').map(c => c.args.sub)).toEqual([
      'sub-work',
      'sub-person',
    ])
    const send = async (headers: Record<string, string>) => headers
    expect(await oidc.oidcAuthorized('POST', API + '/graphql', API, send, () => undefined, 'sub-work')).toEqual({
      authorization: 'DPoP token-for:sub-work:' + API,
      DPoP: 'proof:POST:' + API + '/graphql:sub-work',
    })
  })

  it('gives no token for a credential that is not in use', async () => {
    const { oidc, bridge } = await boot(SEVERAL)
    expect(await oidc.oidcAccessToken(API, 'sub-old')).toBe('')
    expect(bridge!.calls.some(c => c.method === 'auth.accessToken')).toBe(false)
  })

  it('adds an account beside the page’s person: nothing reloads, and it is a sign-in at once', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    expect(await oidc.oidcStart({ prompt: 'select_account' })).toBe(true)
    await tick()
    expect(bridge!.calls.find(c => c.method === 'auth.signIn')!.args).toEqual({ addAccount: true })
    expect(reload).not.toHaveBeenCalled()
    expect(heard).toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-person', 'sub-new', 'sub-work'])
    // The shell made the new account active: the page's own person is still asked for by name.
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
  })

  it('signs a remembered credential in beside the page’s person, with no reload', async () => {
    const { oidc, reload } = await boot(SEVERAL)
    expect(await oidc.oidcSelectKnownAccount('sub-old')).toBe(true)
    await tick()
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-person', 'sub-old', 'sub-work'])
  })

  it('signs one account out through the shell and keeps the rest, with no reload', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    expect(await oidc.oidcSignOutAccount('sub-work')).toBe(true)
    await tick()
    expect(bridge!.calls.find(c => c.method === 'auth.signOut')!.args).toEqual({ sub: 'sub-work' })
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-person'])
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('')
  })

  it('does not reload when the menu signs another account out, or makes active one the page holds', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    await bridge!.transport.call('auth.switch', { sub: 'sub-work' })
    await tick()
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    await bridge!.transport.call('auth.signOut', { sub: 'sub-work' })
    await tick()
    expect(reload).not.toHaveBeenCalled()
    expect(heard).toHaveBeenCalled()
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-person'])
  })

  it('reloads when the menu makes active someone the page holds nothing for', async () => {
    const { bridge, reload } = await boot(SEVERAL)
    await bridge!.transport.call('auth.signIn', { addAccount: true })
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads when the menu signs the page’s person out', async () => {
    const { bridge, reload } = await boot(SEVERAL)
    await bridge!.transport.call('auth.signOut', { sub: 'sub-person' })
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('signs the page’s person out without a reload of the shell’s making, and lists who is left', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    expect(await oidc.oidcEndSession()).toBe(204)
    expect(bridge!.calls.find(c => c.method === 'auth.signOut')!.args).toEqual({ sub: 'sub-person' })
    oidc.oidcClearLocal()
    await tick()
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcSignedIn()).toBe(false)
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-work'])
  })
})

describe('with a shell that has the setting Use several at once (auth.mode)', () => {
  // As the shell lists them with one in use: only the active account is signedIn, the others are remembered.
  const ONE = {
    several: false,
    accounts: [
      { sub: 'sub-person', email: 'person@example.com', active: true, signedIn: true },
      { sub: 'sub-work', email: 'work@example.com', active: false, signedIn: false },
    ],
  }
  const SEVERAL = {
    several: true,
    accounts: [
      { sub: 'sub-person', email: 'person@example.com', active: true, signedIn: true },
      { sub: 'sub-work', email: 'work@example.com', active: false, signedIn: true },
      { sub: 'sub-old', email: 'old@example.com', active: false, signedIn: false },
    ],
  }
  const tick = () => new Promise(r => setTimeout(r))
  const inUse = (oidc: typeof import('./oidc')) => oidc.oidcSignIns().map(signIn => signIn.sub)
  const called = (bridge: ReturnType<typeof createMockBridge>, method: string) =>
    bridge.calls.filter(c => c.method === method).map(c => c.args)

  it('follows the shell’s mode, and stores none of its own', async () => {
    const { oidc, bridge } = await boot(ONE)
    expect(called(bridge!, 'auth.mode')).toEqual([{}])
    expect(oidc.oidcSeveralOffered()).toBe(true)
    expect(oidc.oidcSeveral()).toBe(false)
    expect((await boot(SEVERAL)).oidc.oidcSeveral()).toBe(true)
    expect(stored()).toEqual([])
  })

  it('ignores the browser’s own setting', async () => {
    localStorage.setItem('oidc.several', '1')
    const { oidc } = await boot(ONE)
    expect(oidc.oidcSeveral()).toBe(false)
  })

  it('with one in use, has one sign-in — the active account — and asks for no other by name', async () => {
    const { oidc, bridge } = await boot(ONE)
    expect(inUse(oidc)).toEqual(['sub-person'])
    expect(oidc.oidcAccounts().map(account => [account.sub, account.signedIn, account.saved])).toEqual([
      ['sub-person', true, false],
      ['sub-work', false, false],
    ])
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('')
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    expect(called(bridge!, 'auth.accessToken')).toEqual([{ resource: API }])
    expect(await oidc.oidcUseAccount('sub-work', true)).toBe(false)
    expect(await oidc.oidcSignOutAccount('sub-work')).toBe(false)
  })

  it('with one in use, choosing another account switches through the shell and reloads as them', async () => {
    const { oidc, bridge, reload } = await boot(ONE)
    expect(await oidc.oidcSelectKnownAccount('sub-work')).toBe(true)
    await tick()
    expect(called(bridge!, 'auth.switch')).toEqual([{ sub: 'sub-work' }])
    expect(reload).toHaveBeenCalled()
    // The account left is remembered.
    expect(bridge!.accounts.map(a => [a.sub, a.signedIn])).toEqual([
      ['sub-person', false],
      ['sub-work', true],
    ])
  })

  it('with one in use, Sign in on this device makes the new account the page’s person, with a reload', async () => {
    const { oidc, bridge, reload } = await boot(ONE)
    expect(await oidc.oidcStart({ prompt: 'select_account' })).toBe(true)
    await tick()
    expect(called(bridge!, 'auth.signIn')).toEqual([{ addAccount: true }])
    expect(reload).toHaveBeenCalled()
  })

  it('with one in use, reloads when the menu switches accounts', async () => {
    const { bridge, reload } = await boot(ONE)
    await bridge!.transport.call('auth.switch', { sub: 'sub-work' })
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('turns the setting on through the shell: nothing reloads, the page’s person alone is in use until another is checked', async () => {
    const { oidc, bridge, reload } = await boot(ONE)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    expect(await oidc.oidcSetSeveral(true)).toBe(true)
    await tick()
    expect(called(bridge!, 'auth.setMode')).toEqual([{ several: true }])
    expect(oidc.oidcSeveral()).toBe(true)
    expect(heard).toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
    expect(inUse(oidc)).toEqual(['sub-person'])

    expect(await oidc.oidcUseAccount('sub-work', true)).toBe(true)
    await tick()
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(inUse(oidc)).toEqual(['sub-person', 'sub-work'])
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('token-for:sub-work:' + API)
  })

  it('unchecks an account through the shell’s sign-out of it, which keeps it remembered', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    expect(await oidc.oidcUseAccount('sub-work', false)).toBe(true)
    await tick()
    expect(called(bridge!, 'auth.signOut')).toEqual([{ sub: 'sub-work' }])
    expect(reload).not.toHaveBeenCalled()
    expect(inUse(oidc)).toEqual(['sub-person'])
    expect(oidc.oidcAccounts().map(account => account.sub)).toContain('sub-work')
  })

  it('turns the setting off through the shell: the page’s person stays, the others go out of use, nothing reloads', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('token-for:sub-work:' + API)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    expect(await oidc.oidcSetSeveral(false)).toBe(true)
    await tick()
    expect(called(bridge!, 'auth.setMode')).toEqual([{ several: false }])
    expect(called(bridge!, 'auth.switch')).toEqual([])
    expect(oidc.oidcSeveral()).toBe(false)
    expect(heard).toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(inUse(oidc)).toEqual(['sub-person'])
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('')
    expect(oidc.oidcAccounts().map(account => [account.sub, account.signedIn])).toEqual([
      ['sub-person', true],
      ['sub-old', false],
      ['sub-work', false],
    ])
  })

  it('turning it off keeps the PAGE’s person where the shell has made another active: that is switched back first', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    await bridge!.transport.call('auth.switch', { sub: 'sub-work' })
    await tick()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(await oidc.oidcSetSeveral(false)).toBe(true)
    await tick()
    expect(bridge!.calls.filter(c => c.method === 'auth.switch' || c.method === 'auth.setMode').map(c => c.args)).toEqual([
      { sub: 'sub-work' },
      { sub: 'sub-person' },
      { several: false },
    ])
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('sub-person')
    expect(inUse(oidc)).toEqual(['sub-person'])
  })

  it('follows the menu turning it off: the others’ rows go with no reload while the page’s person is the one kept', async () => {
    const { oidc, bridge, reload } = await boot(SEVERAL)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    await bridge!.transport.call('auth.setMode', { several: false })
    await tick()
    expect(oidc.oidcSeveral()).toBe(false)
    expect(heard).toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
    expect(inUse(oidc)).toEqual(['sub-person'])
  })

  it('reloads when the menu turns it off and keeps someone else: the page’s person was signed out', async () => {
    const { bridge, reload } = await boot(SEVERAL)
    await bridge!.transport.call('auth.switch', { sub: 'sub-work' })
    await tick()
    expect(reload).not.toHaveBeenCalled()
    await bridge!.transport.call('auth.setMode', { several: false })
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('follows the menu turning it on, with no reload', async () => {
    const { oidc, bridge, reload } = await boot(ONE)
    await bridge!.transport.call('auth.setMode', { several: true })
    await tick()
    expect(oidc.oidcSeveral()).toBe(true)
    expect(reload).not.toHaveBeenCalled()
    expect(inUse(oidc)).toEqual(['sub-person'])
  })

  it('keeps its mode when the shell refuses the change', async () => {
    const { oidc, bridge } = await boot(SEVERAL)
    const call = bridge!.transport.call
    bridge!.transport.call = (async (method: any, args: any) => {
      if (method === 'auth.setMode') throw new Error('refused')
      return call(method, args)
    }) as typeof call
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await oidc.oidcSetSeveral(false)).toBe(false)
    expect(oidc.oidcSeveral()).toBe(true)
    expect(inUse(oidc)).toEqual(['sub-person', 'sub-work'])
    vi.restoreAllMocks()
  })
})

describe('with a shell from before auth.mode', () => {
  const tick = () => new Promise(r => setTimeout(r))

  it('is one at a time and offers no setting, even where the shell says several are signed in', async () => {
    const { oidc, bridge } = await boot({
      accounts: [
        { sub: 'sub-person', email: 'person@example.com', active: true, signedIn: true },
        { sub: 'sub-work', email: 'work@example.com', active: false, signedIn: true },
      ],
    })
    expect(oidc.oidcSeveralOffered()).toBe(false)
    expect(oidc.oidcSeveral()).toBe(false)
    expect(await oidc.oidcSetSeveral(true)).toBe(false)
    expect(bridge!.calls.some(c => c.method === 'auth.setMode')).toBe(false)
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-person'])
    expect(await oidc.oidcAccessToken(API, 'sub-work')).toBe('')
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
  })

  it('switches accounts with a reload, as it always did', async () => {
    const { oidc, bridge, reload } = await boot({
      accounts: [
        { sub: 'sub-person', email: 'person@example.com', active: true },
        { sub: 'sub-work', email: 'work@example.com', active: false },
      ],
    })
    expect(oidc.oidcSeveralOffered()).toBe(false)
    expect(await oidc.oidcSelectKnownAccount('sub-work')).toBe(true)
    await tick()
    expect(bridge!.calls.find(c => c.method === 'auth.switch')!.args).toEqual({ sub: 'sub-work' })
    expect(reload).toHaveBeenCalled()
  })
})

describe('with a shell that keeps one credential in use', () => {
  it('has one sign-in, the active account, and asks for no other by name', async () => {
    const { oidc, bridge } = await boot({
      accounts: [
        { sub: 'sub-person', email: 'person@example.com', active: true },
        { sub: 'sub-other', email: 'other@example.com', active: false },
      ],
    })
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['sub-person'])
    expect(await oidc.oidcAccessToken(API, 'sub-other')).toBe('')
    expect(await oidc.oidcSignOutAccount('sub-other')).toBe(false)
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    expect(bridge!.calls.filter(c => c.method === 'auth.accessToken').map(c => c.args)).toEqual([{ resource: API }])
  })
})

describe('with the shell not able to say yet (its device has not said its stage)', () => {
  it('is not signed in meanwhile, and reloads as the person when the shell can say', async () => {
    const { oidc, bridge, reload, used } = await boot({ authUnavailable: true })
    expect(used).toBe(true)
    expect(oidc.oidcShell()).toBe(true)
    expect(oidc.oidcSignedIn()).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled() // no flow of its own meanwhile
    bridge!.authUnavailable = false
    bridge!.emit('auth', { active: { sub: 'sub-person', email: 'person@example.com', active: true } })
    await new Promise(r => setTimeout(r))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('stays as it is when the shell then says no one is signed in', async () => {
    const { bridge, reload } = await boot({ authUnavailable: true, accounts: [] })
    bridge!.authUnavailable = false
    bridge!.emit('auth', {})
    await new Promise(r => setTimeout(r))
    expect(reload).not.toHaveBeenCalled()
  })

  it('asks again once it listens: a change before that is not lost', async () => {
    vi.resetModules()
    const bridge = createMockBridge({ authUnavailable: true })
    const on = bridge.transport.on
    // The shell comes to know its stage between the first answer and the page's listening: no event reaches it.
    bridge.transport.on = (event, listener) => {
      bridge.authUnavailable = false
      return on(event, listener)
    }
    const td = await import('./thisDevice')
    td.registerBridgeTransport(async () => bridge.transport)
    const oidc = await import('./oidc')
    const reload = vi.fn()
    oidc.oidcShellHooks.reload = reload
    expect(await oidc.oidcUseShell()).toBe(true)
    expect(oidc.oidcSignedIn()).toBe(true)
    expect(oidc.oidcClaims()).toMatchObject({ sub: 'sub-person' })
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads when the shell turns out not to sign in here, so the page reads what it offers', async () => {
    const { bridge, reload } = await boot({ authUnavailable: true })
    bridge!.authUnavailable = false
    ;(bridge!.transport as any).call = async () => {
      throw Object.assign(new Error('auth.accounts is not offered here'), { code: 'unsupported' })
    }
    bridge!.emit('auth', {})
    await new Promise(r => setTimeout(r))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

// 1.7.0: whose sign-in the page is — the shell's or its own — is decided at boot from what the shell offered; when that
// changes (the info event), the page reloads once and decides again.
describe('when what the shell offers changes', () => {
  const desktop = ['status', 'vpn', 'exit', 'settings', 'access', 'protect'] as const
  const settle = () => new Promise(r => setTimeout(r))

  it('reloads when the shell comes to sign in here', async () => {
    const { bridge, reload, used } = await boot({ capabilities: [...desktop] })
    expect(used).toBe(false)
    bridge!.offer([...desktop, 'auth'])
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads when the shell no longer signs in here', async () => {
    const { bridge, reload, used } = await boot({ capabilities: [...desktop, 'auth'] })
    expect(used).toBe(true)
    bridge!.offer([...desktop])
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload for a change that is not the sign-in’s', async () => {
    const { bridge, reload, oidc } = await boot({ capabilities: [...desktop, 'auth'] })
    bridge!.offer([...desktop, 'auth', 'services', 'logging'])
    bridge!.offer([...desktop, 'auth'])
    await settle()
    expect(reload).not.toHaveBeenCalled()
    expect(oidc.oidcSignedIn()).toBe(true)
  })
})

describe('without the shell signing in', () => {
  it('a plain browser (no transport) keeps its own sign-in', async () => {
    const { oidc, used } = await boot(null)
    expect(used).toBe(false)
    expect(oidc.oidcShell()).toBe(false)
    expect(oidc.oidcSignedIn()).toBe(false)
  })

  it('a shell that does not offer auth leaves the sign-in to the page', async () => {
    const { oidc, used, bridge } = await boot({ capabilities: ['status', 'vpn'] })
    expect(used).toBe(false)
    expect(oidc.oidcShell()).toBe(false)
    // info alone: as it booted, and once more as it listened for a change (1.7.0)
    expect(new Set(bridge!.calls.map(c => c.method))).toEqual(new Set(['info']))
  })

  it('a shell of another major version is not used', async () => {
    const { used } = await boot({ info: { bridgeVersion: '2.0.0' } })
    expect(used).toBe(false)
  })
})
