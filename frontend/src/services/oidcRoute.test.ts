import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The route a sign-in leaves from (services/oidc, Flow.route): the AS returns to /authCallback with no fragment, so the
// route rides the flow and the callback puts it back. A signed-out visit to the proxy's
// #/endpoint-sign-in?endpoint=…&return=… then carries on to the endpoint, as it does for someone already signed in.

const { leaveTo, graphQLBasicRequest } = vi.hoisted(() => ({ leaveTo: vi.fn(), graphQLBasicRequest: vi.fn() }))
vi.mock('./browser', () => ({ default: { isNative: false, isElectron: false }, leaveTo }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest }))
vi.mock('../i18n', () => ({ default: { language: 'en', resolvedLanguage: 'en' } }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
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
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const ISSUER = 'https://login.solo.remote.it'
const RETURN = 'https://app1-acme.solo.r3proxy.com/dash?tab=2'
const ENDPOINT_ROUTE = `/endpoint-sign-in?endpoint=EP-1&return=${encodeURIComponent(RETURN)}`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const b64u = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jwt = (claims: object) => `${b64u('{"alg":"none"}')}.${b64u(JSON.stringify(claims))}.sig`
const issued = (claims: object) => () =>
  json({ access_token: 'at', refresh_token: `rt-${Math.random()}`, id_token: jwt(claims), expires_in: 300 })

let tokenReply: () => Response
const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input)
  if (url === `${ISSUER}/.well-known/openid-configuration`)
    return json({ authorization_endpoint: `${ISSUER}/authorize`, token_endpoint: `${ISSUER}/token` })
  if (url === `${ISSUER}/token`) return tokenReply()
  if (url === `${ISSUER}/revoke`) return new Response(null, { status: 200 })
  throw new Error(`no network in this test: ${url}`) // the MCP metadata lookup falls back on its own
})

/** The app on `hash`, leaving for the AS: what the authorize carried. */
async function startFrom(hash: string) {
  history.replaceState({}, '', `/${hash}`)
  vi.resetModules()
  const oidc = await import('./oidc')
  expect(await oidc.oidcStart({ prompt: 'select_account', auto: 'boot' })).toBe(true)
  const authorize = new URL(leaveTo.mock.calls.at(-1)![0])
  return { oidc, state: authorize.searchParams.get('state')!, nonce: authorize.searchParams.get('nonce')! }
}

/** The AS's redirect back — /authCallback, no fragment — loading the app again, in this tab or a new one. */
async function callback(query: string, opts: { newTab?: boolean } = {}) {
  if (opts.newTab) sessionStorage.clear()
  history.replaceState({}, '', `/authCallback?${query}`)
  vi.resetModules()
  return import('./oidc')
}

const signedInAs = (sub: string) =>
  localStorage.setItem('oidc.tokens', JSON.stringify({ refresh_token: `rt-${sub}`, id_token: jwt({ sub }) }))
const recorded = () => JSON.parse(sessionStorage.getItem('oidc.flow')!).route
const shared = () =>
  Object.keys(localStorage)
    .filter(k => k.startsWith('oidc.flow:'))
    .map(k => JSON.parse(localStorage.getItem(k)!).route)

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  history.replaceState({}, '', '/')
  leaveTo.mockReset()
  graphQLBasicRequest.mockReset()
  fetchSpy.mockClear()
  vi.stubGlobal('fetch', fetchSpy)
  // PKCE needs WebCrypto's digest, which jsdom's crypto lacks.
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', (await import('node:crypto')).webcrypto)
})
afterEach(() => vi.unstubAllGlobals())

describe('the route a sign-in leaves from', () => {
  it('rides the flow, query and all, in this tab’s record and the shared one', async () => {
    await startFrom(`#${ENDPOINT_ROUTE}`)
    expect(recorded()).toBe(ENDPOINT_ROUTE)
    expect(shared()).toEqual([ENDPOINT_ROUTE])
  })

  it('is where a signed-out visit to the endpoint sign-in lands once signed in', async () => {
    const { state, nonce } = await startFrom(`#${ENDPOINT_ROUTE}`)
    tokenReply = issued({ sub: 'sub-a', nonce })
    const oidc = await callback(`code=the-code&state=${state}`)
    const entries = history.length
    expect(await oidc.oidcCompleteFromUrl()).toMatchObject({ sub: 'sub-a' })
    expect(location.pathname).toBe('/')
    expect(location.search).toBe('')
    expect(location.hash).toBe(`#${ENDPOINT_ROUTE}`)
    expect(history.length).toBe(entries) // the callback's entry is replaced, not followed by another
    const params = new URLSearchParams(location.hash.split('?')[1])
    expect(params.get('endpoint')).toBe('EP-1')
    expect(params.get('return')).toBe(RETURN)
  })

  it('carries on in the tab that finishes the sign-in — the set-password link opens a new one', async () => {
    const { state, nonce } = await startFrom(`#${ENDPOINT_ROUTE}`)
    tokenReply = issued({ sub: 'sub-a', nonce })
    const oidc = await callback(`code=the-code&state=${state}`, { newTab: true })
    expect(await oidc.oidcCompleteFromUrl()).toMatchObject({ sub: 'sub-a' })
    expect(location.hash).toBe(`#${ENDPOINT_ROUTE}`)
  })

  it('is put back when the sign-in is refused, so Try again carries it into the next flow', async () => {
    const first = await startFrom(`#${ENDPOINT_ROUTE}`)
    const oidc = await callback(`error=access_denied&error_description=no&state=${first.state}`)
    await expect(oidc.oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'refused' })
    expect(location.hash).toBe(`#${ENDPOINT_ROUTE}`)
    expect(await oidc.oidcStart({ prompt: 'select_account' })).toBe(true)
    expect(recorded()).toBe(ENDPOINT_ROUTE)
  })

  it('is put back when the exchange fails, too', async () => {
    const { state } = await startFrom(`#${ENDPOINT_ROUTE}`)
    tokenReply = () => json({ error: 'invalid_grant', error_description: 'code expired' }, 400)
    const oidc = await callback(`code=the-code&state=${state}`)
    await expect(oidc.oidcCompleteFromUrl()).rejects.toThrow('code expired')
    expect(location.hash).toBe(`#${ENDPOINT_ROUTE}`)
  })

  it('is where the same account lands after signing in again (a grant heal, a step-up)', async () => {
    signedInAs('sub-a')
    const { state, nonce } = await startFrom('#/account/connected/some-app')
    tokenReply = issued({ sub: 'sub-a', nonce })
    const oidc = await callback(`code=the-code&state=${state}`)
    expect(await oidc.oidcCompleteFromUrl()).toMatchObject({ sub: 'sub-a' })
    expect(location.hash).toBe('#/account/connected/some-app')
  })

  it('is not where another account arriving lands: that starts at the app’s start, as activating one does', async () => {
    signedInAs('sub-a')
    const { state, nonce } = await startFrom('#/devices/DEVICE-OF-A')
    tokenReply = issued({ sub: 'sub-b', nonce })
    const oidc = await callback(`code=the-code&state=${state}`)
    expect(await oidc.oidcCompleteFromUrl()).toMatchObject({ sub: 'sub-b' })
    expect(location.hash).toBe('')
  })

  it.each([
    ['the app’s start', '#/'],
    ['no route at all', ''],
    ['a protocol-relative host', '#//evil.example/x'],
    ['a backslash', '#/\\evil.example'],
    ['an absolute URL', '#https://evil.example/'],
    ['a script URL', '#javascript:alert(1)'],
    ['an outsized fragment', `#/devices/${'x'.repeat(9000)}`],
  ])('is not recorded for %s', async (_, hash) => {
    await startFrom(hash)
    expect(recorded()).toBeUndefined()
    expect(shared()).toEqual([undefined])
  })

  it('is never applied when the record names something other than the app’s own route', async () => {
    const { state, nonce } = await startFrom('#/devices')
    const key = `oidc.flow:${state}`
    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)!), route: '//evil.example/x' }))
    tokenReply = issued({ sub: 'sub-a', nonce })
    const oidc = await callback(`code=the-code&state=${state}`, { newTab: true })
    expect(await oidc.oidcCompleteFromUrl()).toMatchObject({ sub: 'sub-a' })
    expect(location.href).toBe(`${location.origin}/`)
  })
})

describe('after the sign-in', () => {
  it('the hash router follows the route back, and the endpoint sign-in asks for its ticket as for anyone signed in', async () => {
    const { state, nonce } = await startFrom(`#${ENDPOINT_ROUTE}`)
    tokenReply = issued({ sub: 'sub-a', nonce })
    const oidc = await callback(`code=the-code&state=${state}`)
    graphQLBasicRequest.mockResolvedValue('ERROR')
    // One module graph for the router and the page (imported after the reset above).
    const [React, { createRoot }, { HashRouter, Switch, Route }, { EndpointSignInPage }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('react-router-dom'),
      import('../pages/EndpointSignInPage'),
    ])
    const h = React.createElement
    const container = document.createElement('div')
    // The router is made before the sign-in completes, as on a boot, and starts at the app's start.
    await React.act(async () =>
      createRoot(container).render(
        h(
          HashRouter,
          null,
          h(
            Switch,
            null,
            h(Route, { path: '/endpoint-sign-in' }, h(EndpointSignInPage)),
            h(Route, { path: '/' }, 'start')
          )
        )
      )
    )
    expect(container.textContent).toBe('start')
    await React.act(async () => {
      await oidc.oidcCompleteFromUrl()
      await new Promise(resolve => setTimeout(resolve, 0)) // the hashchange the router listens for
    })
    expect(graphQLBasicRequest).toHaveBeenCalledTimes(1)
    expect(graphQLBasicRequest.mock.calls[0][0]).toContain('endpointTicket')
    expect(graphQLBasicRequest.mock.calls[0][1]).toEqual({ endpointId: 'EP-1', returnUrl: RETURN })
    expect(container.textContent).toBe('You do not have access to this endpoint.')
  })
})
