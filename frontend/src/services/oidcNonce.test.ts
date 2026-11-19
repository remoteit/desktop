import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { decodeBase64url } from '../helpers/base64url'

vi.mock('./browser', () => ({ default: {}, leaveTo: vi.fn() }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('../i18n', () => ({ default: { language: 'en' } }))

/* RFC 9449 §8 server nonces. oidc.ts keeps module state a test must not inherit — the discovery
   document, the DPoP key, the nonces each server sent, the clock offset — so every test here loads
   it afresh, with its own fetch mock and its own key store, and stands on what it sets up itself. */

const SERVER = Date.UTC(2026, 10, 19, 2, 10, 0)
const TOKEN = 'https://login.test/token'
type Sent = { url: string; init?: RequestInit }

let oidc: typeof import('./oidc')
let browser: { hasBackend?: boolean }
let ISSUER: string
let GRAPHQL: string
let sent: Sent[]
let answer: (url: string, init: RequestInit | undefined, calls: number) => Promise<Response>
let serverTimeCalls: number

const urls = () => sent.map(s => s.url)
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
const idToken = (sub: string, iss: string, nonce?: string) => jwtWith({ sub, iss, email: `${sub}@x.test`, nonce })
const bound = (claims: object = { exp: Math.floor(Date.now() / 1000) + 300 }) =>
  json({ refresh_token: 'r2', access_token: jwtWith(claims), token_type: 'DPoP' })
const signedIn = () => {
  const tokens = { refresh_token: 'r1', id_token: idToken('a', ISSUER) }
  window.localStorage.setItem('oidc.tokens', JSON.stringify(tokens))
  window.localStorage.setItem('oidc.accounts', JSON.stringify({ a: tokens }))
}
/** Start a sign-in and land on its callback, as the browser would. */
const callback = async (code: string) => {
  await oidc.oidcStart()
  const flow = JSON.parse(window.sessionStorage.getItem('oidc.flow') || 'null')
  window.history.replaceState({}, '', `/?code=${code}&state=${flow.state}`)
  return flow as { state: string; nonce: string }
}

// Just enough IndexedDB for the DPoP key to be made and kept (jsdom has none); a new one per test.
const freshKeyStore = () => {
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
  vi.stubGlobal('indexedDB', { open: () => request(db) })
}

beforeEach(async () => {
  window.sessionStorage.clear()
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
  sent = []
  serverTimeCalls = 0
  answer = () => Promise.reject(new Error('offline'))
  freshKeyStore()
  vi.stubGlobal(
    'fetch',
    vi.fn((url: unknown, init?: RequestInit) => {
      const u = String(url)
      if (u.endsWith('/.well-known/openid-configuration'))
        return Promise.resolve(json({ authorization_endpoint: 'https://login.test/authorize', token_endpoint: TOKEN }))
      // Metadata the sign-in reads on the way (the MCP resource's PRM): not a request these tests count.
      if (u.includes('/.well-known/')) return Promise.reject(new Error('offline'))
      if (u.startsWith('/serverTime')) {
        serverTimeCalls++
        return Promise.resolve(json({ serverTime: SERVER }))
      }
      sent.push({ url: u, init })
      return answer(u, init, calls(u).length)
    })
  )
  vi.resetModules()
  oidc = await import('./oidc')
  // The mocked browser object outlives resetModules: a desktop test's hasBackend must not reach the next.
  browser = (await import('./browser')).default as { hasBackend?: boolean }
  delete browser.hasBackend
  const constants = await import('../constants')
  ISSUER = constants.OAUTH_ISSUER
  GRAPHQL = constants.OAUTH_GRAPHQL_RESOURCE
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DPoP server nonces', () => {
  it('sends no nonce to servers that never asked for one', async () => {
    signedIn()
    answer = url => Promise.resolve(url === TOKEN ? bound() : json({ ok: true }))

    expect(await oidc.oidcResourceRequest('https://quiet.test', '/accounts')).toEqual({
      status: 200,
      body: { ok: true },
    })
    expect(urls()).toEqual([TOKEN, 'https://quiet.test/accounts'])
    for (const s of sent) expect(proofOf(s).nonce).toBeUndefined()
  })

  it('retries a code exchange the AS answered with use_dpop_nonce once, on a fresh proof carrying the nonce', async () => {
    browser.hasBackend = true
    const flow = await callback('c1')
    answer = (_, __, n) =>
      Promise.resolve(
        n === 1
          ? wantsNonce('n-1')
          : json({ refresh_token: 'r1', access_token: 'at', id_token: idToken('a', ISSUER, flow.nonce) })
      )

    expect(await oidc.oidcCompleteFromUrl()).toMatchObject({ sub: 'a' })
    expect(urls()).toEqual([TOKEN, TOKEN])
    const [first, retry] = sent
    expect(proofOf(first).nonce).toBeUndefined()
    expect(proofOf(retry).nonce).toBe('n-1')
    expect(proofOf(retry).jti).not.toBe(proofOf(first).jti)
    // The same code both times: the refused request spent nothing, and no clock was measured.
    for (const s of sent) expect(String(s.init?.body)).toContain('code=c1')
    expect(serverTimeCalls).toBe(0)
  })

  it('retries a refresh the same way, and judges the token by the time it was minted at', async () => {
    // An hour fast: on this clock every token the AS mints has already expired.
    vi.spyOn(Date, 'now').mockReturnValue(SERVER + 60 * 60 * 1000)
    signedIn()
    const iat = SERVER / 1000
    answer = (url, __, n) =>
      Promise.resolve(url !== TOKEN ? json({ ok: true }) : n === 1 ? wantsNonce('n-2') : bound({ iat, exp: iat + 300 }))

    const token = await oidc.oidcAccessToken()
    expect(urls()).toEqual([TOKEN, TOKEN])
    expect(token).toBeTruthy()
    const [first, retry] = sent
    expect(proofOf(first).nonce).toBeUndefined()
    expect(proofOf(retry).nonce).toBe('n-2')
    for (const s of sent) expect(String(s.init?.body)).toContain('refresh_token=r1')
    expect(JSON.parse(window.localStorage.getItem('oidc.tokens') || '{}').refresh_token).toBe('r2')

    // Fresh by the server's clock, so the next call spends no refresh token…
    expect(await oidc.oidcAccessToken()).toBe(token)
    expect(urls()).toEqual([TOKEN, TOKEN])
    // …and the proofs signed from here on are dated on the server's clock, not this one.
    expect(proofOf(retry).iat).toBe(iat + 60 * 60)
    await oidc.oidcResourceRequest(GRAPHQL, '/graphql')
    expect(proofOf(calls(GRAPHQL)[0]).iat).toBe(iat)
  })

  it('retries a resource 401 asking for a nonce once, with a new proof over the same token', async () => {
    signedIn()
    const account = 'https://account.test'
    answer = (url, __, n) =>
      Promise.resolve(url === TOKEN ? bound() : n === 1 ? resourceWantsNonce('rn-1') : json({ ok: true }))

    expect(await oidc.oidcResourceRequest(account, '/accounts')).toEqual({ status: 200, body: { ok: true } })
    expect(urls()).toEqual([TOKEN, `${account}/accounts`, `${account}/accounts`])
    const [first, retry] = calls(account)
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

    await oidc.oidcResourceRequest(graph, '/one')
    await oidc.oidcResourceRequest(graph, '/two')
    expect(urls()).toEqual([TOKEN, `${graph}/one`, `${graph}/two`])
    expect(calls(graph).map(s => proofOf(s).nonce)).toEqual([undefined, 'sn-1'])
  })

  it('does not loop on a resource that asks for a nonce again', async () => {
    signedIn()
    const stubborn = 'https://stubborn.test'
    answer = (url, __, n) => Promise.resolve(url === TOKEN ? bound() : resourceWantsNonce(`again-${n}`))

    expect(await oidc.oidcResourceRequest(stubborn, '/accounts')).toMatchObject({ status: 401 })
    expect(urls()).toEqual([TOKEN, `${stubborn}/accounts`, `${stubborn}/accounts`])
  })

  it('does not loop on a token endpoint that asks for a nonce again, and names the clock', async () => {
    answer = (_, __, n) => Promise.resolve(wantsNonce(`again-${n}`))
    await callback('c2')

    await expect(oidc.oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock', oauthError: 'use_dpop_nonce' })
    expect(urls()).toEqual([TOKEN, TOKEN])
  })

  it('tries the server’s clock once after the nonce on the desktop, and stops there', async () => {
    browser.hasBackend = true
    vi.spyOn(Date, 'now').mockReturnValue(SERVER + 60 * 60 * 1000)
    answer = (_, __, n) => Promise.resolve(wantsNonce(`again-${n}`))
    await callback('c3')

    await expect(oidc.oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'clock', clockOffset: -3600 })
    expect(urls()).toEqual([TOKEN, TOKEN, TOKEN])
    expect(serverTimeCalls).toBe(1)
  })
})
