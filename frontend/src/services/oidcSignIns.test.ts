import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Several sign-ins in use at once (services/oidc, "SEVERAL SIGN-INS ARE IN USE AT ONCE"): each saved account mints
// its own tokens beside the primary's, rotates its own family under its own lock, and signs out on its own.

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
  EMBEDDED: false,
}))

const ISSUER = 'https://login.solo.remote.it'
const API = 'https://cloud.solo.remote.it/api'
const ACCOUNT = 'https://login.solo.remote.it/account/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const b64u = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jwt = (claims: object) => `${b64u('{"alg":"none"}')}.${b64u(JSON.stringify(claims))}.sig`
const idToken = (sub: string, more: object = {}) => jwt({ sub, email: `${sub}@x.test`, ...more })

type TokenCall = { refresh: string | null; resource: string | null; grant: string | null }
let tokenCalls: TokenCall[]
let tokenReply: (call: TokenCall) => Response | Promise<Response>
let ended: string[]
const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (url === `${ISSUER}/.well-known/openid-configuration`)
    return json({ authorization_endpoint: `${ISSUER}/authorize`, token_endpoint: `${ISSUER}/token` })
  if (url === `${ISSUER}/token`) {
    const body = new URLSearchParams(String(init?.body))
    const call = { refresh: body.get('refresh_token'), resource: body.get('resource'), grant: body.get('grant_type') }
    tokenCalls.push(call)
    return tokenReply(call)
  }
  if (url === `${ISSUER}/session/end`) {
    ended.push(JSON.parse(String(init?.body)).id_token_hint)
    return new Response(null, { status: 204 })
  }
  if (url === `${ISSUER}/revoke`) return new Response(null, { status: 200 })
  throw new Error(`no network in this test: ${url}`)
})

/** Tokens named for what they were minted from, so a test reads whose they are. */
const minted = (call: TokenCall) =>
  json({ access_token: `at:${call.refresh}:${call.resource}`, refresh_token: `${call.refresh}+`, expires_in: 300 })

const registry = () => JSON.parse(localStorage.getItem('oidc.accounts') || '{}')
const active = () => JSON.parse(localStorage.getItem('oidc.tokens') || 'null')

/** a is the page's person; b is signed in beside them; k is known to the browser only. Several are used at once
 *  unless `several` is false: then b is saved, and not in use. */
function signedIn(several = true) {
  if (several) localStorage.setItem('oidc.several', '1')
  const a = { refresh_token: 'ra', id_token: idToken('a') }
  localStorage.setItem('oidc.tokens', JSON.stringify(a))
  localStorage.setItem(
    'oidc.accounts',
    JSON.stringify({
      a: { ...a, email: 'a@x.test' },
      b: { refresh_token: 'rb', id_token: idToken('b'), email: 'b@x.test' },
      k: { email: 'k@x.test' },
    })
  )
}

async function load() {
  vi.resetModules()
  return import('./oidc')
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  tokenCalls = []
  ended = []
  tokenReply = minted
  fetchSpy.mockClear()
  vi.stubGlobal('fetch', fetchSpy)
  history.replaceState({}, '', '/')
})
afterEach(() => vi.unstubAllGlobals())

describe('sign-ins in use', () => {
  it('lists every saved account, the page’s person first, and leaves out an account only known to the browser', async () => {
    signedIn()
    const oidc = await load()
    expect(oidc.oidcSignIns()).toEqual([
      { sub: 'a', email: 'a@x.test', name: undefined, picture: undefined, primary: true },
      { sub: 'b', email: 'b@x.test', name: undefined, picture: undefined, primary: false },
    ])
    expect(oidc.oidcAccounts().map(account => [account.sub, account.signedIn, account.known])).toEqual([
      ['a', true, false],
      ['b', true, false],
      ['k', false, true],
    ])
  })
})

describe('a token for a sign-in', () => {
  it('is minted from that account’s own refresh token, and the primary’s from its own', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcAccessToken(API, 'b')).toBe(`at:rb:${API}`)
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
    expect(tokenCalls.map(call => call.refresh)).toEqual(['rb', 'ra'])
  })

  it('is cached per sign-in and audience: one account’s token is never handed to a request about another', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcAccessToken(API, 'b')
    await oidc.oidcAccessToken(API)
    expect(await oidc.oidcAccessToken(API, 'b')).toBe(`at:rb:${API}`)
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
    expect(tokenCalls).toHaveLength(2)
    expect(await oidc.oidcAccessToken(ACCOUNT, 'b')).toBe(`at:rb+:${ACCOUNT}`)
    expect(tokenCalls).toHaveLength(3)
  })

  it('asked for the primary by its own sub is the primary’s, from the one cache', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcAccessToken(API, 'a')).toBe(`at:ra:${API}`)
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
    expect(tokenCalls).toHaveLength(1)
  })

  it('writes the rotation to that account’s registry entry and leaves the active set alone', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcAccessToken(API, 'b')
    expect(registry().b.refresh_token).toBe('rb+')
    expect(registry().a.refresh_token).toBe('ra')
    expect(active().refresh_token).toBe('ra')
    await oidc.oidcAccessToken(API)
    expect(registry().a.refresh_token).toBe('ra+')
    expect(active().refresh_token).toBe('ra+')
    expect(registry().b.refresh_token).toBe('rb+')
  })

  it('is one refresh for callers that ask together, each account in its own queue', async () => {
    signedIn()
    const oidc = await load()
    const tokens = await Promise.all([
      oidc.oidcAccessToken(API, 'b'),
      oidc.oidcAccessToken(API, 'b'),
      oidc.oidcAccessToken(API),
      oidc.oidcAccessToken(API),
    ])
    expect(tokens).toEqual([`at:rb:${API}`, `at:rb:${API}`, `at:ra:${API}`, `at:ra:${API}`])
    expect(tokenCalls).toHaveLength(2)
  })

  it('refreshes under a lock named for the account, so accounts do not wait on each other across tabs', async () => {
    signedIn()
    const names: string[] = []
    vi.stubGlobal('navigator', {
      ...navigator,
      onLine: true,
      locks: {
        request: (name: string, _options: unknown, run: () => Promise<string>) => {
          names.push(name)
          return run()
        },
      },
    })
    const oidc = await load()
    await oidc.oidcAccessToken(API, 'b')
    await oidc.oidcAccessToken(API)
    expect(names).toEqual(['oidc.refresh:b', 'oidc.refresh:a'])
  })

  it('is none for an account with no tokens here, and none is asked for', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcAccessToken(API, 'k')).toBe('')
    expect(await oidc.oidcAccessToken(API, 'nobody')).toBe('')
    expect(tokenCalls).toHaveLength(0)
  })

  it('does not come back for an account signed out while its refresh was in flight', async () => {
    signedIn()
    const oidc = await load()
    let release!: (response: Response) => void
    tokenReply = () => new Promise<Response>(resolve => (release = resolve))
    const pending = oidc.oidcAccessToken(API, 'b')
    await vi.waitFor(() => expect(tokenCalls).toHaveLength(1))
    const reg = registry()
    delete reg.b
    localStorage.setItem('oidc.accounts', JSON.stringify(reg))
    release(minted(tokenCalls[0]))
    expect(await pending).toBe('')
    expect(registry().b).toBeUndefined()
  })

  it('carries its own token on a request made for it', async () => {
    signedIn()
    const oidc = await load()
    const send = async (headers: Record<string, string>) => headers
    expect(await oidc.oidcAuthorized('POST', API + '/graphql', API, send, () => undefined, 'b')).toEqual({
      authorization: `Bearer at:rb:${API}`,
    })
    expect(await oidc.oidcAuthorized('POST', API + '/graphql', API, send, () => undefined)).toEqual({
      authorization: `Bearer at:ra:${API}`,
    })
  })
})

describe('a sign-in whose grant has died', () => {
  it('loses its tokens alone: it is known to the browser again, and the others stay signed in', async () => {
    signedIn()
    const oidc = await load()
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    tokenReply = call =>
      call.refresh === 'rb' ? json({ error: 'invalid_grant', error_description: 'revoked' }, 400) : minted(call)
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(registry().b).toEqual({ email: 'b@x.test' })
    expect(heard).toHaveBeenCalled()
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['a'])
    expect(oidc.oidcSignedIn()).toBe(true)
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
    expect(leaveTo).not.toHaveBeenCalled()
  })

  it('keeps its tokens through a failure that is not the grant’s (the network, the server)', async () => {
    signedIn()
    const oidc = await load()
    tokenReply = () => json({ error: 'server_error' }, 503)
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(registry().b.refresh_token).toBe('rb')
  })
})

describe('another account signing in', () => {
  async function arrive(sub: string) {
    const first = await load()
    expect(await first.oidcStart({ prompt: 'select_account' })).toBe(true)
    const authorize = new URL(leaveTo.mock.calls.at(-1)![0])
    const nonce = authorize.searchParams.get('nonce')!
    tokenReply = () =>
      json({
        access_token: `at-new:${sub}`,
        refresh_token: `r-new-${sub}`,
        id_token: idToken(sub, { nonce }),
        expires_in: 300,
      })
    history.replaceState({}, '', `/authCallback?code=c&state=${authorize.searchParams.get('state')}`)
    const oidc = await load()
    return { oidc, claims: await oidc.oidcCompleteFromUrl() }
  }
  const revoked = () =>
    fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/revoke')).map(([, init]) => String(init?.body))

  it('joins the page’s person: both are in use, the first stays the primary, and nothing of theirs is revoked', async () => {
    signedIn()
    const { oidc, claims } = await arrive('c')
    expect(claims?.sub).toBe('c')
    expect(oidc.oidcClaims()?.sub).toBe('a')
    expect(active().refresh_token).toBe('ra')
    expect(registry().c.refresh_token).toBe('r-new-c')
    expect(oidc.oidcSignIns().map(signIn => [signIn.sub, signIn.primary])).toEqual([
      ['a', true],
      ['b', false],
      ['c', false],
    ])
    expect(revoked()).toEqual([])
    expect(await oidc.oidcAccessToken(API, 'c')).toBe('at-new:c')
  })

  it('replaces its own family when it was already signed in beside the primary', async () => {
    signedIn()
    const { oidc } = await arrive('b')
    expect(registry().b.refresh_token).toBe('r-new-b')
    expect(oidc.oidcClaims()?.sub).toBe('a')
    expect(revoked().some(body => body.includes('token=rb&'))).toBe(true)
  })

  it('is the page’s person when no one was signed in', async () => {
    const { oidc } = await arrive('c')
    expect(oidc.oidcClaims()?.sub).toBe('c')
    expect(oidc.oidcSignIns()).toMatchObject([{ sub: 'c', primary: true }])
  })
})

describe('signing one account out', () => {
  it('ends that account’s session on its own id_token and drops its entry; the rest stay', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcAccessToken(API, 'b')
    expect(await oidc.oidcSignOutAccount('b')).toBe(true)
    expect(ended).toEqual([idToken('b')])
    expect(registry().b).toBeUndefined()
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['a'])
    expect(active().refresh_token).toBe('ra')
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
  })

  it('still signs it out here when the login server cannot be reached', async () => {
    signedIn()
    const oidc = await load()
    fetchSpy.mockImplementationOnce(async () => {
      throw new Error('offline')
    })
    expect(await oidc.oidcSignOutAccount('b')).toBe(true)
    expect(registry().b).toBeUndefined()
  })

  it('is signed out here at once, and the login server given only so long, when it never answers', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcAccessToken(API, 'b')
    let signal: AbortSignal | null | undefined
    fetchSpy.mockImplementationOnce((_input, init) => {
      signal = init?.signal
      return new Promise<Response>((_resolve, reject) =>
        signal?.addEventListener('abort', () => reject(new Error('aborted')))
      )
    })
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 20)
      return controller.signal
    })
    const signingOut = oidc.oidcSignOutAccount('b')
    // Nothing waited on yet: the stalled request is still out, and the account is already gone from here.
    expect(signal?.aborted).toBe(false)
    expect(registry().b).toBeUndefined()
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['a'])
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(await signingOut).toBe(true)
    expect(signal?.aborted).toBe(true)
    timeout.mockRestore()
  })

  it('is not how the page’s own person signs out, nor an account that is not signed in', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcSignOutAccount('a')).toBe(false)
    expect(await oidc.oidcSignOutAccount('k')).toBe(false)
    expect(ended).toEqual([])
    expect(Object.keys(registry())).toEqual(['a', 'b', 'k'])
  })

  it('leaves the others in use when the page’s person signs out', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcEndSession()).toBe(204)
    expect(ended).toEqual([idToken('a')])
    oidc.oidcClearLocal()
    expect(oidc.oidcSignedIn()).toBe(false)
    expect(oidc.oidcSignIns().map(signIn => signIn.sub)).toEqual(['b'])
    expect(oidc.oidcActivateAccount('b')).toBe(true)
    expect(oidc.oidcClaims()?.sub).toBe('b')
    expect(await oidc.oidcAccessToken(API)).toBe(`at:rb:${API}`)
  })
})
