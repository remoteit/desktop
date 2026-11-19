import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'

vi.mock('./browser', () => ({ default: {}, leaveTo: vi.fn() }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('../i18n', () => ({ default: { language: 'en' } }))
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.reject(new Error('offline')))
)

import {
  oidcReconcileIssuer,
  oidcSignedIn,
  oidcAccounts,
  oidcPicture,
  oidcSetPicture,
  oidcSubscribe,
  oidcAccessToken,
  invalidateOidcToken,
  oidcStart,
  oidcReopen,
  oidcCompleteFromUrl,
  oidcFlowPending,
  oidcCallbackReason,
  oidcActivateAccount,
  oidcTakeSwitched,
  oidcResourceRequest,
} from './oidc'
import { decodeBase64url } from '../helpers/base64url'
import browser, { leaveTo } from './browser'
import { OAUTH_ISSUER, OAUTH_GRAPHQL_RESOURCE, PROTOCOL } from '../constants'

const stubDiscovery = (
  doc: object,
  otherwise: (url: unknown, init?: RequestInit) => Promise<Response> = () => Promise.reject(new Error('offline'))
) =>
  vi
    .mocked(fetch)
    .mockImplementation((url, init) =>
      String(url).endsWith('/.well-known/openid-configuration')
        ? Promise.resolve(new Response(JSON.stringify(doc)))
        : otherwise(url, init)
    )

const OTHER = 'https://login.other.test'
const idToken = (sub: string, iss: string | null, nonce?: string) =>
  [
    'e30',
    btoa(JSON.stringify({ sub, iss: iss ?? undefined, email: `${sub}@x.test`, nonce })).replace(/=+$/, ''),
    'sig',
  ].join('.')
const signIn = (active: string | null = OAUTH_ISSUER, saved: string | null = OAUTH_ISSUER) => {
  window.localStorage.setItem('oidc.tokens', JSON.stringify({ refresh_token: 'r1', id_token: idToken('a', active) }))
  window.localStorage.setItem(
    'oidc.accounts',
    JSON.stringify({
      a: { refresh_token: 'r1', id_token: idToken('a', active) },
      b: { refresh_token: 'r2', id_token: idToken('b', saved) },
    })
  )
}

describe('oidcReconcileIssuer', () => {
  beforeEach(() => window.localStorage.clear())

  it('keeps a session across boots on the same login server', () => {
    signIn()
    oidcReconcileIssuer()
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts()).toHaveLength(2)
  })

  it('adopts an install that predates the record, without signing it out', () => {
    signIn()
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts()).toHaveLength(2)
    expect(window.localStorage.getItem('oidc.issuer')).toBe(OAUTH_ISSUER)
  })

  it('adopts tokens that carry no issuer at all', () => {
    signIn(null, null)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts()).toHaveLength(2)
  })

  it('judges a session stored before the record by its own issuer', () => {
    signIn(OTHER, OTHER)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(false)
    expect(oidcAccounts()).toHaveLength(0)
  })

  it('drops only the saved accounts another login server issued', () => {
    signIn(OAUTH_ISSUER, OTHER)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts().map(account => account.sub)).toEqual(['a'])
  })

  it('drops the session and every saved account once the marker names another login server', () => {
    signIn()
    window.localStorage.setItem('oidc.issuer', OTHER)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(false)
    expect(oidcAccounts()).toHaveLength(0)
    expect(window.localStorage.getItem('oidc.issuer')).toBe(OAUTH_ISSUER)
  })
})

describe('oidcPicture', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(
      'oidc.accounts',
      JSON.stringify({
        a: { email: 'Ada@X.test', picture: 'https://idp.example/ada.jpg' },
        b: { email: 'bob@x.test' },
      })
    )
  })

  it("finds a signed-in account's picture by email, ignoring case", () => {
    expect(oidcPicture('ada@x.test')).toBe('https://idp.example/ada.jpg')
  })

  it('answers null for an account here without one, and nothing for an email not signed in here', () => {
    expect(oidcPicture('bob@x.test')).toBeNull()
    expect(oidcPicture('eve@x.test')).toBeUndefined()
    expect(oidcPicture(undefined)).toBeUndefined()
  })

  it("sets the signed-in account's picture, tells subscribers, and is read back at once", () => {
    window.localStorage.setItem(
      'oidc.tokens',
      JSON.stringify({ refresh_token: 'r1', id_token: idToken('a', OAUTH_ISSUER) })
    )
    expect(oidcPicture('ada@x.test')).toBe('https://idp.example/ada.jpg')
    const heard = vi.fn()
    const unsubscribe = oidcSubscribe(heard)

    oidcSetPicture('https://login.example/avatar/a?v=2')
    expect(heard).toHaveBeenCalledTimes(1)
    expect(oidcPicture('ada@x.test')).toBe('https://login.example/avatar/a?v=2')

    oidcSetPicture(null)
    expect(oidcPicture('ada@x.test')).toBeNull()

    unsubscribe()
    oidcSetPicture('https://login.example/avatar/a?v=3')
    expect(heard).toHaveBeenCalledTimes(2)
  })
})

describe('a refresh that brings no new id_token', () => {
  afterEach(() => vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline'))))

  it("keeps the picture set since sign-in rather than the sign-in id_token's", async () => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    const tokens = { refresh_token: 'r1', id_token: idToken('a', OAUTH_ISSUER) }
    window.localStorage.setItem('oidc.tokens', JSON.stringify(tokens))
    window.localStorage.setItem('oidc.accounts', JSON.stringify({ a: { ...tokens, email: 'a@x.test' } }))
    oidcSetPicture('https://login.example/avatar/a?v=2')
    stubDiscovery(
      { authorization_endpoint: 'https://login.test/authorize', token_endpoint: 'https://login.test/token' },
      (_, init) =>
        String(init?.body ?? '').includes('grant_type=refresh_token')
          ? Promise.resolve(new Response(JSON.stringify({ refresh_token: 'r2', access_token: 'at', expires_in: 300 })))
          : Promise.reject(new Error('offline'))
    )
    invalidateOidcToken()

    expect(await oidcAccessToken()).toBe('at')
    expect(oidcPicture('a@x.test')).toBe('https://login.example/avatar/a?v=2')
  })
})

describe('oidcReopen', () => {
  const sharedFlows = () => Object.keys(window.localStorage).filter(key => key.startsWith('oidc.flow:'))

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    vi.mocked(leaveTo).mockClear()
    stubDiscovery({ authorization_endpoint: 'https://login.test/authorize' })
  })
  afterEach(() => vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline'))))

  it('sends the person back to the outstanding authorize without starting another flow', async () => {
    expect(await oidcStart()).toBe(true)
    const flows = sharedFlows()

    expect(await oidcReopen()).toBe(true)
    expect(leaveTo).toHaveBeenCalledTimes(2)
    expect(vi.mocked(leaveTo).mock.calls[1][0]).toBe(vi.mocked(leaveTo).mock.calls[0][0])
    expect(sharedFlows()).toEqual(flows)
  })

  it('resolves false when no flow is outstanding', async () => {
    expect(await oidcReopen()).toBe(false)
    expect(leaveTo).not.toHaveBeenCalled()
  })
})

describe('oidcTakeSwitched', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  it('answers true once, for the boot a saved-account switch causes, and not for a later reload', () => {
    signIn()
    expect(oidcTakeSwitched()).toBe(false)
    expect(oidcActivateAccount('b')).toBe(true)
    expect(oidcTakeSwitched()).toBe(true)
    expect(oidcTakeSwitched()).toBe(false)
  })
})

describe('oidcCallbackReason', () => {
  const ownState = () => JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')?.state

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    stubDiscovery({ authorization_endpoint: 'https://login.test/authorize' })
  })
  afterEach(() => vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline'))))

  it('names the automatic reason the callback’s authorize was started with', async () => {
    await oidcStart({ prompt: 'none', loginHint: 'a@x.test', auto: 'heal' })
    expect(oidcCallbackReason(`?error=login_required&state=${ownState()}`)).toBe('heal')
  })

  it('is undefined for an authorize someone clicked for, and for a callback with no flow', async () => {
    await oidcStart({ prompt: 'select_account' })
    expect(oidcCallbackReason(`?code=c&state=${ownState()}`)).toBeUndefined()
    expect(oidcCallbackReason('?code=c&state=unknown')).toBeUndefined()
  })
})

describe('oidcCompleteFromUrl with no flow for the callback', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    vi.mocked(fetch).mockClear()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.history.replaceState({}, '', '/?code=c2&state=already-used')
  })
  afterEach(() => warn.mockRestore())

  it('ignores the callback when a session is already stored, so the first tab’s sign-in stands', async () => {
    signIn()
    await expect(oidcCompleteFromUrl()).resolves.toBeUndefined()
    expect(window.location.search).toBe('')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('still fails as expired when no session is stored', async () => {
    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'expired' })
    expect(window.location.search).toBe('')
  })

  it('reads a deep link handed to the live window instead of the window’s own URL', async () => {
    window.history.replaceState({ key: 'k' }, '', '/#/devices')
    await expect(oidcCompleteFromUrl()).resolves.toBeUndefined()
    await expect(oidcCompleteFromUrl('?code=c2&state=already-used')).rejects.toMatchObject({ code: 'expired' })
    expect(window.history.state).toEqual({ key: 'k' })
  })
})

describe('oidcCompleteFromUrl with a flow begun on another login server', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    vi.mocked(fetch).mockClear()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const flow = { verifier: 'v', state: 's-old', nonce: 'n', redirectUri: `${PROTOCOL}authCallback`, issuer: OTHER }
    window.sessionStorage.setItem('oidc.flow', JSON.stringify(flow))
    window.localStorage.setItem('oidc.flow:s-old', JSON.stringify({ ...flow, at: Date.now() }))
    window.history.replaceState({}, '', '/?code=c-other&state=s-old')
  })
  afterEach(() => warn.mockRestore())

  it('drops it without exchanging its code, so a stage switch mid sign-in lands on the sign-in screen', async () => {
    await expect(oidcCompleteFromUrl()).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem('oidc.flow')).toBeNull()
    expect(window.localStorage.getItem('oidc.flow:s-old')).toBeNull()
    expect(window.location.search).toBe('')
  })
})

describe('oidcCompleteFromUrl keeps the flow until its exchange settles', () => {
  let exchange: () => Promise<Response>
  const ownFlow = () => JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')

  beforeEach(async () => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    stubDiscovery(
      { authorization_endpoint: 'https://login.test/authorize', token_endpoint: 'https://login.test/token' },
      (_, init) =>
        String(init?.body ?? '').includes('grant_type=authorization_code')
          ? exchange()
          : Promise.reject(new Error('offline'))
    )
    await oidcStart()
    window.history.replaceState({}, '', `/?code=c1&state=${ownFlow().state}`)
  })
  afterEach(() => vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline'))))

  it('still holds the flow mid-exchange, so a reload by the second tab’s callback can complete', async () => {
    const state = ownFlow().state
    exchange = () => new Promise(() => {})
    void oidcCompleteFromUrl()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(ownFlow()?.state).toBe(state)
    expect(window.localStorage.getItem(`oidc.flow:${state}`)).not.toBeNull()
  })

  it('stores nothing and revokes the new tokens when admit refuses the account', async () => {
    const { nonce } = ownFlow()
    exchange = () =>
      Promise.resolve(
        new Response(JSON.stringify({ refresh_token: 'r-new', id_token: idToken('b', null, nonce), access_token: 'a' }))
      )
    const admit = vi.fn(async () => false)
    await expect(oidcCompleteFromUrl(undefined, admit)).resolves.toBeUndefined()
    expect(admit).toHaveBeenCalledWith(expect.objectContaining({ sub: 'b' }))
    expect(oidcSignedIn()).toBe(false)
    expect(oidcAccounts()).toHaveLength(0)
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url, init]) => String(url).endsWith('/revoke') && String(init?.body).includes('r-new'))
    ).toBe(true)
  })

  it('revokes the new tokens when admit throws, too', async () => {
    const { nonce } = ownFlow()
    exchange = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ refresh_token: 'r-thrown', id_token: idToken('b', null, nonce), access_token: 'a' })
        )
      )
    await expect(oidcCompleteFromUrl(undefined, async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    expect(oidcSignedIn()).toBe(false)
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url, init]) => String(url).endsWith('/revoke') && String(init?.body).includes('r-thrown'))
    ).toBe(true)
  })

  it('drops the flow once the exchange fails', async () => {
    const state = ownFlow().state
    exchange = () => Promise.resolve(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }))
    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ oauthError: 'invalid_grant' })
    expect(ownFlow()).toBeNull()
    expect(window.localStorage.getItem(`oidc.flow:${state}`)).toBeNull()
  })
})

describe('oidcStart', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.mocked(leaveTo).mockClear()
    stubDiscovery({ authorization_endpoint: 'https://login.test/authorize' })
  })
  afterEach(() => vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline'))))

  it('names the hinted provider on the authorize', async () => {
    await oidcStart({ idpHint: 'google' })
    expect(new URL(vi.mocked(leaveTo).mock.calls[0][0]).searchParams.get('idp_hint')).toBe('google')
  })

  it.each([
    ['supports', ['none', 'login', 'select_account', 'create'], 'https://login.test/authorize'],
    ['lacks', ['none', 'login', 'select_account'], `${OAUTH_ISSUER}/signup`],
  ])('when discovery %s prompt=create, sign-up leaves for the right page', async (_, prompts, page) => {
    vi.resetModules()
    stubDiscovery({ authorization_endpoint: 'https://login.test/authorize', prompt_values_supported: prompts })
    const oidc = await import('./oidc')
    const browser = await import('./browser')
    const started = await oidc.oidcStart({ prompt: 'create' })
    const url = new URL(vi.mocked(browser.leaveTo).mock.calls[0][0])
    expect(url.origin + url.pathname).toBe(page)
    expect(started).toBe(page.endsWith('/authorize'))
    if (started) expect(url.searchParams.get('prompt')).toBe('create')
    else expect(window.sessionStorage.getItem('oidc.flow')).toBeNull()
  })
})

describe('oidcStart on desktop', () => {
  const LOOPBACK = 'http://127.0.0.1:29999/authCallback'
  let authRedirect: () => Promise<Response>
  const authorize = () => new URL(vi.mocked(leaveTo).mock.calls[0][0])

  beforeEach(() => {
    window.sessionStorage.clear()
    vi.mocked(leaveTo).mockClear()
    Object.assign(browser, { isNative: true, isElectron: true })
    stubDiscovery({ authorization_endpoint: 'https://login.test/authorize' }, url =>
      url === '/authRedirect' ? authRedirect() : Promise.reject(new Error('offline'))
    )
  })
  afterEach(() => {
    Object.assign(browser, { isNative: false, isElectron: false })
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline')))
  })

  it.each([
    ['deep links are on', () => Promise.resolve(new Response('{}'))],
    ['its server does not answer', () => Promise.reject(new Error('offline'))],
  ])('comes back through the app scheme when %s', async (_, answer) => {
    authRedirect = answer
    await oidcStart()
    expect(authorize().searchParams.get('redirect_uri')).toBe(PROTOCOL + 'authCallback')
  })

  it('comes back to the app’s own server when deep links are off', async () => {
    authRedirect = () => Promise.resolve(new Response(JSON.stringify({ redirectUri: LOOPBACK })))
    await oidcStart()
    expect(authorize().searchParams.get('redirect_uri')).toBe(LOOPBACK)
    expect(oidcFlowPending(authorize().searchParams.get('state')!)).toBe(true)
    expect(oidcFlowPending('someone-else')).toBe(false)
  })
})

describe('a DPoP proof refused for its time', () => {
  const SERVER = Date.UTC(2026, 10, 19, 2, 10, 0)
  const LOCAL = SERVER + 60 * 60 * 1000
  const refusal = () =>
    new Response(
      JSON.stringify({
        error: 'invalid_dpop_proof',
        error_description: 'proof iat is missing or outside the acceptance window',
      }),
      { status: 400 }
    )
  const accessToken = (exp: number) => ['e30', btoa(JSON.stringify({ exp })).replace(/=+$/, ''), 'sig'].join('.')
  let tokenCalls: number
  let serverTimeCalls: number
  let serverTime: () => Promise<Response>
  let token: () => Promise<Response>

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    Object.assign(browser, { hasBackend: true })
    vi.spyOn(Date, 'now').mockReturnValue(LOCAL)
    tokenCalls = 0
    serverTimeCalls = 0
    serverTime = () => Promise.resolve(new Response(JSON.stringify({ serverTime: SERVER })))
    stubDiscovery(
      { authorization_endpoint: 'https://login.test/authorize', token_endpoint: 'https://login.test/token' },
      (url, init) => {
        if (String(url).startsWith('/serverTime')) {
          serverTimeCalls++
          return serverTime()
        }
        if (String(init?.body ?? '').includes('grant_type=')) {
          tokenCalls++
          return token()
        }
        return Promise.reject(new Error('offline'))
      }
    )
    invalidateOidcToken()
  })
  afterEach(() => {
    delete (browser as { hasBackend?: boolean }).hasBackend
    vi.restoreAllMocks()
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline')))
  })
  const startExchange = async () => {
    await oidcStart()
    const { state } = JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')
    window.history.replaceState({}, '', `/?code=c1&state=${state}`)
  }

  it('retries once on the server’s time, and judges the new token by that time too', async () => {
    const tokens = { refresh_token: 'r1', id_token: idToken('a', OAUTH_ISSUER) }
    window.localStorage.setItem('oidc.tokens', JSON.stringify(tokens))
    window.localStorage.setItem('oidc.accounts', JSON.stringify({ a: tokens }))
    const minted = accessToken(SERVER / 1000 + 300)
    token = () =>
      Promise.resolve(
        tokenCalls === 1 ? refusal() : new Response(JSON.stringify({ refresh_token: 'r2', access_token: minted }))
      )

    expect(await oidcAccessToken()).toBe(minted)
    expect(tokenCalls).toBe(2)
    expect(serverTimeCalls).toBe(1)

    // An hour past the token's expiry by this computer's clock, five minutes before it by the server's.
    expect(await oidcAccessToken()).toBe(minted)
    expect(tokenCalls).toBe(2)
  })

  it('names the clock when the server’s time can’t be learned', async () => {
    serverTime = () => Promise.reject(new Error('no desktop backend'))
    token = () => Promise.resolve(refusal())
    await startExchange()

    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock', oauthError: 'invalid_dpop_proof' })
    expect(tokenCalls).toBe(1)
  })

  it('asks no desktop backend where the page has none (web, mobile)', async () => {
    delete (browser as { hasBackend?: boolean }).hasBackend
    token = () => Promise.resolve(refusal())
    await startExchange()

    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock' })
    expect(serverTimeCalls).toBe(0)
  })

  it('takes the server’s time from the refusal itself when the AS exposes its Date', async () => {
    const exposed = refusal()
    exposed.headers.set('date', new Date(SERVER).toUTCString())
    token = () =>
      Promise.resolve(
        tokenCalls === 1 ? exposed : new Response(JSON.stringify({ refresh_token: 'r2', access_token: 'at' }), {})
      )
    await startExchange()

    await oidcCompleteFromUrl().catch(() => undefined)
    expect(serverTimeCalls).toBe(0)
    expect(tokenCalls).toBe(2)
  })

  it('does not blame a clock that matches the server’s', async () => {
    serverTime = () => Promise.resolve(new Response(JSON.stringify({ serverTime: LOCAL + 5000 })))
    token = () => Promise.resolve(refusal())
    await startExchange()

    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'refused' })
    expect(tokenCalls).toBe(1)
  })

  it('stops after one retry and reports how far off the clock was', async () => {
    token = () => Promise.resolve(refusal())
    await startExchange()

    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock', clockOffset: -3600 })
    expect(tokenCalls).toBe(2)
  })
})

/* RFC 9449 §8 server nonces. Last in the file: the key these tests install is memoized for the module,
   and the nonces they teach it are kept per server origin. */
describe('DPoP server nonces', () => {
  const SERVER = Date.UTC(2026, 10, 19, 2, 10, 0)
  const TOKEN = 'https://login.test/token'
  type Sent = { url: string; init?: RequestInit }
  let sent: Sent[]
  let answer: (url: string, init: RequestInit | undefined, calls: number) => Promise<Response>
  let serverTimeCalls: number
  const calls = (prefix: string) => sent.filter(s => s.url.startsWith(prefix))
  const proofOf = (s: Sent) => {
    const jwt = (s.init?.headers as Record<string, string>)?.DPoP
    return JSON.parse(decodeBase64url(jwt.split('.')[1]))
  }
  const json = (body: object, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers })
  const wantsNonce = (nonce: string) =>
    json({ error: 'use_dpop_nonce', error_description: 'nonce required' }, 400, { 'DPoP-Nonce': nonce })
  const resourceWantsNonce = (nonce: string) =>
    new Response('', {
      status: 401,
      headers: {
        'WWW-Authenticate':
          'DPoP error="use_dpop_nonce", error_description="nonce required", Bearer resource_metadata="https://x.test/m"',
        'DPoP-Nonce': nonce,
      },
    })
  const jwtWith = (claims: object) => ['e30', btoa(JSON.stringify(claims)).replace(/=+$/, ''), 'sig'].join('.')
  const bound = (claims: object = { exp: Math.floor(Date.now() / 1000) + 300 }) =>
    json({ refresh_token: 'r2', access_token: jwtWith(claims), token_type: 'DPoP' })
  const signedIn = () => {
    const tokens = { refresh_token: 'r1', id_token: idToken('a', OAUTH_ISSUER) }
    window.localStorage.setItem('oidc.tokens', JSON.stringify(tokens))
    window.localStorage.setItem('oidc.accounts', JSON.stringify({ a: tokens }))
  }

  beforeAll(() => {
    // Just enough IndexedDB for the DPoP key to be made and kept (jsdom has none).
    const data = new Map<string, unknown>()
    const request = (result?: unknown) => {
      const r: { result?: unknown; onsuccess?: () => void } = { result }
      queueMicrotask(() => r.onsuccess?.())
      return r
    }
    const store = {
      get: (key: string) => request(data.get(key)),
      put: (value: unknown, key: string) => (data.set(key, value), request(key)),
      delete: (key: string) => (data.delete(key), request()),
    }
    const db = { transaction: () => ({ objectStore: () => store }), createObjectStore: () => store }
    Object.assign(globalThis, { indexedDB: { open: () => request(db) } })
  })
  afterAll(() => {
    delete (globalThis as { indexedDB?: unknown }).indexedDB
  })
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    sent = []
    serverTimeCalls = 0
    answer = () => Promise.reject(new Error('offline'))
    stubDiscovery({ authorization_endpoint: 'https://login.test/authorize', token_endpoint: TOKEN }, (url, init) => {
      if (String(url).startsWith('/serverTime')) {
        serverTimeCalls++
        return Promise.resolve(json({ serverTime: SERVER }))
      }
      sent.push({ url: String(url), init })
      return answer(String(url), init, calls(String(url)).length)
    })
    invalidateOidcToken()
  })
  afterEach(() => {
    delete (browser as { hasBackend?: boolean }).hasBackend
    vi.restoreAllMocks()
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline')))
  })

  it('sends no nonce to servers that never asked for one', async () => {
    signedIn()
    answer = url => Promise.resolve(url === TOKEN ? bound() : json({ ok: true }))

    expect(await oidcResourceRequest('https://quiet.test', '/accounts')).toEqual({ status: 200, body: { ok: true } })
    expect(sent.map(s => s.url)).toEqual([TOKEN, 'https://quiet.test/accounts'])
    for (const s of sent) expect(proofOf(s).nonce).toBeUndefined()
  })

  it('retries a code exchange the AS answered with use_dpop_nonce once, on a fresh proof carrying the nonce', async () => {
    Object.assign(browser, { hasBackend: true })
    await oidcStart()
    const flow = JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')
    window.history.replaceState({}, '', `/?code=c1&state=${flow.state}`)
    answer = (_, __, n) =>
      Promise.resolve(
        n === 1
          ? wantsNonce('n-1')
          : json({ refresh_token: 'r1', access_token: 'at', id_token: idToken('a', OAUTH_ISSUER, flow.nonce) })
      )

    expect(await oidcCompleteFromUrl()).toMatchObject({ sub: 'a' })
    const [first, retry] = calls(TOKEN)
    expect(calls(TOKEN)).toHaveLength(2)
    expect(proofOf(first).nonce).toBeUndefined()
    expect(proofOf(retry).nonce).toBe('n-1')
    expect(proofOf(retry).jti).not.toBe(proofOf(first).jti)
    // The same code both times: the refused request spent nothing, and no clock was measured.
    for (const s of [first, retry]) expect(String(s.init?.body)).toContain('code=c1')
    expect(serverTimeCalls).toBe(0)
  })

  it('retries a refresh the same way, and judges the token by the time it was minted at', async () => {
    // An hour fast: on this clock every token the AS mints has already expired.
    vi.spyOn(Date, 'now').mockReturnValue(SERVER + 60 * 60 * 1000)
    signedIn()
    const iat = SERVER / 1000
    answer = (url, __, n) =>
      Promise.resolve(url !== TOKEN ? json({ ok: true }) : n === 1 ? wantsNonce('n-2') : bound({ iat, exp: iat + 300 }))

    const token = await oidcAccessToken()
    expect(token).toBeTruthy()
    const [first, retry] = calls(TOKEN)
    // The AS's last nonce (from the exchange above) has expired there, so it names a new one.
    expect(proofOf(first).nonce).toBe('n-1')
    expect(proofOf(retry).nonce).toBe('n-2')
    for (const s of [first, retry]) expect(String(s.init?.body)).toContain('refresh_token=r1')
    expect(JSON.parse(window.localStorage.getItem('oidc.tokens') || '{}').refresh_token).toBe('r2')

    // Fresh by the server's clock, so the next call spends no refresh token…
    expect(await oidcAccessToken()).toBe(token)
    expect(calls(TOKEN)).toHaveLength(2)
    // …and the proofs signed from here on are dated on the server's clock, not this one.
    expect(proofOf(retry).iat).toBe(iat + 60 * 60)
    await oidcResourceRequest(OAUTH_GRAPHQL_RESOURCE, '/graphql')
    expect(proofOf(calls(OAUTH_GRAPHQL_RESOURCE)[0]).iat).toBe(iat)
  })

  it('retries a resource 401 asking for a nonce once, with a new proof over the same token', async () => {
    signedIn()
    const account = 'https://account.test'
    answer = (url, __, n) =>
      Promise.resolve(url === TOKEN ? bound() : n === 1 ? resourceWantsNonce('rn-1') : json({ ok: true }))

    expect(await oidcResourceRequest(account, '/accounts')).toEqual({ status: 200, body: { ok: true } })
    const [first, retry] = calls(account)
    expect(calls(account)).toHaveLength(2)
    expect(calls(TOKEN)).toHaveLength(1)
    expect(proofOf(first).nonce).toBeUndefined()
    expect(proofOf(retry)).toMatchObject({
      nonce: 'rn-1',
      htm: 'GET',
      htu: `${account}/accounts`,
      ath: proofOf(first).ath,
    })
    expect(proofOf(retry).jti).not.toBe(proofOf(first).jti)
  })

  it('carries a nonce a server sent on a success into the next proof to it', async () => {
    signedIn()
    const graph = 'https://graph.test'
    answer = (url, __, n) =>
      Promise.resolve(url === TOKEN ? bound() : json({ ok: true }, 200, n === 1 ? { 'DPoP-Nonce': 'sn-1' } : {}))

    await oidcResourceRequest(graph, '/one')
    await oidcResourceRequest(graph, '/two')
    expect(calls(graph).map(s => proofOf(s).nonce)).toEqual([undefined, 'sn-1'])
  })

  it('does not loop on a resource that asks for a nonce again', async () => {
    signedIn()
    const stubborn = 'https://stubborn.test'
    answer = (url, __, n) => Promise.resolve(url === TOKEN ? bound() : resourceWantsNonce(`again-${n}`))

    expect(await oidcResourceRequest(stubborn, '/accounts')).toMatchObject({ status: 401 })
    expect(calls(stubborn)).toHaveLength(2)
  })

  it('does not loop on a token endpoint that asks for a nonce again, and names the clock', async () => {
    signedIn()
    answer = (_, __, n) => Promise.resolve(wantsNonce(`again-${n}`))

    await oidcStart()
    const flow = JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')
    window.history.replaceState({}, '', `/?code=c2&state=${flow.state}`)
    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock', oauthError: 'use_dpop_nonce' })
    expect(calls(TOKEN)).toHaveLength(2)
  })

  it('tries the server’s clock once after the nonce on the desktop, and stops there', async () => {
    Object.assign(browser, { hasBackend: true })
    vi.spyOn(Date, 'now').mockReturnValue(SERVER + 60 * 60 * 1000)
    answer = (_, __, n) => Promise.resolve(wantsNonce(`again-${n}`))

    await oidcStart()
    const flow = JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')
    window.history.replaceState({}, '', `/?code=c3&state=${flow.state}`)
    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock', clockOffset: -3600 })
    expect(calls(TOKEN)).toHaveLength(3)
    expect(serverTimeCalls).toBe(1)
  })
})
