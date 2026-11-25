import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Single mode and multi mode in a browser (graphql-api docs/ACCOUNT-LINKS.md): the setting Use several at once is this
// browser's own, off until chosen. Off, one sign-in is in use — the page's own person — whatever else is saved;
// on, each saved account that is checked is in use beside them.

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

/** An account arriving through the chooser while a is signed in. */
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
const inUse = (oidc: typeof import('./oidc')) => oidc.oidcSignIns().map(signIn => signIn.sub)

describe('one used at a time (the default)', () => {
  it('is the mode until the person chooses otherwise, and a browser offers the setting', async () => {
    signedIn(false)
    const oidc = await load()
    expect(oidc.oidcSeveral()).toBe(false)
    expect(oidc.oidcSeveralOffered()).toBe(true)
  })

  it('has one sign-in in use, the page’s person: the other saved accounts are listed, and used for nothing', async () => {
    signedIn(false)
    const oidc = await load()
    expect(oidc.oidcSignIns()).toEqual([
      { sub: 'a', email: 'a@x.test', name: undefined, picture: undefined, primary: true },
    ])
    expect(oidc.oidcAccounts().map(account => [account.sub, account.signedIn, account.saved, account.known])).toEqual([
      ['a', true, true, false],
      ['b', false, true, false],
      ['k', false, false, true],
    ])
  })

  it('mints nothing for a saved account that is not in use: no request is made as it, and its tokens are kept', async () => {
    signedIn(false)
    const oidc = await load()
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(tokenCalls).toEqual([])
    expect(registry().b.refresh_token).toBe('rb')
    const send = async (headers: Record<string, string>) => headers
    expect(await oidc.oidcAuthorized('POST', API + '/graphql', API, send, () => undefined, 'b')).toEqual({})
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
  })

  it('makes an account that signs in the page’s person, and keeps the one it replaces saved, its tokens not revoked', async () => {
    signedIn(false)
    const { oidc, claims } = await arrive('c')
    expect(claims?.sub).toBe('c')
    expect(oidc.oidcClaims()?.sub).toBe('c')
    expect(active().refresh_token).toBe('r-new-c')
    expect(inUse(oidc)).toEqual(['c'])
    expect(registry().a.refresh_token).toBe('ra')
    expect(registry().b.refresh_token).toBe('rb')
    expect(revoked()).toEqual([])
  })

  it('switches to a saved account by making it the active set, for the reload the caller does; the one left stays saved', async () => {
    signedIn(false)
    const oidc = await load()
    expect(oidc.oidcActivateAccount('b')).toBe(true)
    expect(active().refresh_token).toBe('rb')
    expect(sessionStorage.getItem('oidc.switched')).toBe('1')
    const booted = await load()
    expect(booted.oidcClaims()?.sub).toBe('b')
    expect(inUse(booted)).toEqual(['b'])
    expect(registry().a.refresh_token).toBe('ra')
    expect(await booted.oidcAccessToken(API, 'a')).toBe('')
  })

  it('leaves no one in use when the page’s person signs out: the saved accounts are not promoted', async () => {
    signedIn(false)
    const oidc = await load()
    oidc.oidcClearLocal()
    expect(oidc.oidcSignedIn()).toBe(false)
    expect(inUse(oidc)).toEqual([])
    expect(oidc.oidcPromoteSignIn()).toBe(false)
    expect(registry().b.refresh_token).toBe('rb')
  })

  it('signs a saved account out on its own, which forgets it', async () => {
    signedIn(false)
    const oidc = await load()
    expect(await oidc.oidcSignOutAccount('b')).toBe(true)
    expect(ended).toEqual([idToken('b')])
    expect(registry().b).toBeUndefined()
    expect(oidc.oidcClaims()?.sub).toBe('a')
  })

  it('has no check to set: an account comes into use only by being switched to', async () => {
    signedIn(false)
    const oidc = await load()
    expect(await oidc.oidcUseAccount('b', true)).toBe(false)
    expect(inUse(oidc)).toEqual(['a'])
  })
})

describe('turning Use several at once on', () => {
  it('brings every saved account into use, each checked, to be unchecked by the person', async () => {
    signedIn(false)
    const oidc = await load()
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(await oidc.oidcSetSeveral(true)).toBe(true)
    expect(oidc.oidcSeveral()).toBe(true)
    expect(localStorage.getItem('oidc.several')).toBe('1')
    expect(heard).toHaveBeenCalled()
    expect(inUse(oidc)).toEqual(['a', 'b'])
    expect(await oidc.oidcAccessToken(API, 'b')).toBe(`at:rb:${API}`)

    expect(await oidc.oidcUseAccount('b', false)).toBe(true)
    expect(inUse(oidc)).toEqual(['a'])
  })

  it('is read by a page that boots after, and by another tab when it changes', async () => {
    signedIn(false)
    const oidc = await load()
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    localStorage.setItem('oidc.several', '1')
    window.dispatchEvent(new StorageEvent('storage', { key: 'oidc.several' }))
    expect(heard).toHaveBeenCalled()
    expect(oidc.oidcSeveral()).toBe(true)
    expect((await load()).oidcSeveral()).toBe(true)
  })
})

describe('the check beside an account, with several used at once', () => {
  it('unchecked, takes the account out of use and keeps it saved: nothing is ended at the login server', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcAccessToken(API, 'b')).toBe(`at:rb:${API}`)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    expect(await oidc.oidcUseAccount('b', false)).toBe(true)
    expect(heard).toHaveBeenCalled()
    expect(inUse(oidc)).toEqual(['a'])
    expect(ended).toEqual([])
    expect(registry().b.refresh_token).toBe('rb+')
    expect(oidc.oidcAccounts().find(account => account.sub === 'b')).toMatchObject({ signedIn: false, saved: true })
    // Its cached token went with its use.
    const calls = tokenCalls.length
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    expect(tokenCalls).toHaveLength(calls)
    // And a page that boots after still finds it unchecked.
    expect(inUse(await load())).toEqual(['a'])
  })

  it('checked again, brings it back into use from its saved tokens, with no sign-in', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcUseAccount('b', false)
    expect(await oidc.oidcUseAccount('b', true)).toBe(true)
    expect(inUse(oidc)).toEqual(['a', 'b'])
    expect(leaveTo).not.toHaveBeenCalled()
    expect(await oidc.oidcAccessToken(API, 'b')).toBe(`at:rb:${API}`)
  })

  it('is not signing out: Sign out ends the account’s session and forgets it', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcUseAccount('b', false)
    expect(registry().b).toBeDefined()
    expect(await oidc.oidcSignOutAccount('b')).toBe(true)
    expect(ended).toEqual([idToken('b')])
    expect(registry().b).toBeUndefined()
    expect(oidc.oidcAccounts().map(account => account.sub)).toEqual(['a', 'k'])
  })

  it('checked on an account the browser only knows, signs it in by a silent selection', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcUseAccount('k', true)).toBe(true)
    const authorize = new URL(leaveTo.mock.calls.at(-1)![0])
    expect(authorize.searchParams.get('prompt')).toBe('none')
    expect(authorize.searchParams.get('login_hint')).toBe('k@x.test')
  })

  it('is never the page’s own person’s to clear, nor an unknown account’s', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcUseAccount('a', false)).toBe(false)
    expect(await oidc.oidcUseAccount('nobody', true)).toBe(false)
    expect(inUse(oidc)).toEqual(['a', 'b'])
  })

  it('is set for an account that signs in, and for one made the page’s person', async () => {
    signedIn()
    const first = await load()
    await first.oidcUseAccount('b', false)
    const { oidc } = await arrive('b')
    expect(oidc.oidcClaims()?.sub).toBe('a')
    expect(inUse(oidc)).toEqual(['a', 'b'])

    await oidc.oidcUseAccount('b', false)
    expect(oidc.oidcActivateAccount('b')).toBe(true)
    const booted = await load()
    expect(booted.oidcClaims()?.sub).toBe('b')
    expect(inUse(booted)).toEqual(['b', 'a'])
  })
})

describe('turning Use several at once off', () => {
  it('keeps the page’s person and takes the others out of use: saved, not signed out, and no token of theirs is served', async () => {
    signedIn()
    const oidc = await load()
    expect(await oidc.oidcAccessToken(API, 'b')).toBe(`at:rb:${API}`)
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
    const heard = vi.fn()
    oidc.oidcSubscribe(heard)
    const calls = tokenCalls.length

    expect(await oidc.oidcSetSeveral(false)).toBe(true)
    expect(oidc.oidcSeveral()).toBe(false)
    expect(localStorage.getItem('oidc.several')).toBeNull()
    expect(heard).toHaveBeenCalled()
    expect(oidc.oidcClaims()?.sub).toBe('a')
    expect(inUse(oidc)).toEqual(['a'])
    expect(ended).toEqual([])
    expect(registry().b.refresh_token).toBe('rb+')
    expect(await oidc.oidcAccessToken(API, 'b')).toBe('')
    // The page's person's own token is still theirs, from the cache.
    expect(await oidc.oidcAccessToken(API)).toBe(`at:ra:${API}`)
    expect(tokenCalls).toHaveLength(calls)
  })

  it('and on again brings them all back, one unchecked before included', async () => {
    signedIn()
    const oidc = await load()
    await oidc.oidcUseAccount('b', false)
    await oidc.oidcSetSeveral(false)
    await oidc.oidcSetSeveral(true)
    expect(inUse(oidc)).toEqual(['a', 'b'])
  })
})
