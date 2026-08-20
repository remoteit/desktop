import browser from './browser'
import { OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_GRAPHQL_RESOURCE, PROTOCOL } from '../constants'

/**
 * The renderer-owned OIDC client (permitteer docs/remoteit-desktop-login.md, D8):
 * IDENTICAL on web and desktop — the backend is for machine-local concerns, never auth.
 *
 * Flow: authorize redirect with PKCE (verifier/state in sessionStorage) → the app
 * (re)boots with ?code&state in its URL → exchange completes here. The only per-shell
 * difference is how the code returns: the page's own /authCallback URL on web; the
 * remoteit://authCallback deep link reloading the window with the same query on packaged
 * desktop (ElectronApp's long-standing lane). On desktop the AS journey still runs in
 * the SYSTEM browser — the main process bounces issuer-origin navigations out.
 *
 * Tokens live renderer-side: access tokens in memory, the ROTATING single-use refresh
 * token in localStorage (family revocation on reuse is the mitigation). `resource` rides
 * every token/refresh request — the identity lane defaults `aud` to the issuer otherwise.
 */

export type OidcClaims = {
  sub?: string
  email?: string
  email_verified?: boolean
  amr?: string[]
  [claim: string]: any
}

const FLOW_KEY = 'oidc.flow'
const TOKENS_KEY = 'oidc.tokens'

type Flow = { verifier: string; state: string; nonce: string; redirectUri: string }
type Stored = { refresh_token: string; id_token?: string }

let access: { [resource: string]: { token: string; exp: number } } = {}
let refreshing: Promise<string> | undefined
let discovery: { authorization_endpoint: string; token_endpoint: string; end_session_endpoint?: string } | undefined

const b64u = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const randomB64u = (length: number) => b64u(crypto.getRandomValues(new Uint8Array(length)))
const decodeJwt = (jwt?: string): any => {
  try {
    return jwt ? JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : undefined
  } catch {
    return undefined
  }
}

const stored = (): Stored | undefined => {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export const oidcConfigured = () => !!OAUTH_ISSUER
export const oidcSignedIn = () => !!stored()?.refresh_token
export const oidcClaims = (): OidcClaims | undefined => decodeJwt(stored()?.id_token)

async function discover() {
  if (discovery) return discovery
  const response = await fetch(`${OAUTH_ISSUER}/.well-known/openid-configuration`)
  if (!response.ok) throw new Error(`discovery failed: ${response.status}`)
  discovery = await response.json()
  return discovery!
}

const redirectUri = () =>
  browser.isElectron ? PROTOCOL + 'authCallback' : window.location.origin + '/authCallback'

/** Leave for the AS. On web the page departs; on desktop the main process bounces the
 * issuer origin to the system browser and the window stays on the waiting panel. */
export async function oidcStart(): Promise<void> {
  const d = await discover()
  const verifier = randomB64u(48)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const flow: Flow = { verifier, state: randomB64u(16), nonce: randomB64u(16), redirectUri: redirectUri() }
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow))
  const url = new URL(d.authorization_endpoint)
  const params: { [key: string]: string } = {
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: flow.redirectUri,
    response_type: 'code',
    code_challenge: b64u(new Uint8Array(digest)),
    code_challenge_method: 'S256',
    scope: 'openid email full',
    state: flow.state,
    nonce: flow.nonce,
  }
  for (const key in params) url.searchParams.set(key, params[key])
  window.location.assign(url.toString())
}

/** Boot-time completion: when the URL carries ?code&state (web return or the desktop
 * deep-link reload), finish the exchange and clean the URL. Returns claims, or
 * undefined when this boot isn't a callback. Throws on a failed/denied flow. */
export async function oidcCompleteFromUrl(): Promise<OidcClaims | undefined> {
  const query = new URLSearchParams(window.location.search)
  const state = query.get('state')
  if (!state || !(query.get('code') || query.get('error'))) return undefined

  const raw = sessionStorage.getItem(FLOW_KEY)
  sessionStorage.removeItem(FLOW_KEY)
  cleanUrl()
  const flow: Flow | undefined = raw ? JSON.parse(raw) : undefined
  if (!flow || flow.state !== state) throw new Error('Sign-in state mismatch — try again.')
  const error = query.get('error')
  if (error) throw new Error(query.get('error_description') || error)

  const body = await tokenRequest({
    grant_type: 'authorization_code',
    code: query.get('code') || '',
    code_verifier: flow.verifier,
    redirect_uri: flow.redirectUri,
    resource: OAUTH_GRAPHQL_RESOURCE,
  })
  const claims = decodeJwt(body.id_token)
  if (claims?.nonce !== flow.nonce) throw new Error('Sign-in nonce mismatch — try again.')
  persist({ refresh_token: body.refresh_token, id_token: body.id_token })
  const at = decodeJwt(body.access_token)
  access[OAUTH_GRAPHQL_RESOURCE] = { token: body.access_token, exp: at?.exp ?? 0 }
  return claims
}

/** Current access token for the graphql audience ('' when signed out). Refreshes
 * single-flight — the rotating single-use refresh makes a concurrent second refresh
 * token REUSE, which revokes the whole family. */
export async function oidcAccessToken(resource: string = OAUTH_GRAPHQL_RESOURCE): Promise<string> {
  const cached = access[resource]
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.exp - now > 30) return cached.token
  if (!refreshing) refreshing = refresh(resource).finally(() => (refreshing = undefined))
  return refreshing
}

async function refresh(resource: string): Promise<string> {
  const current = stored()
  if (!current?.refresh_token) return ''
  try {
    const body = await tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: current.refresh_token,
      resource,
    })
    // Rotated — persist the successor FIRST, before anything can race another mint.
    persist({ refresh_token: body.refresh_token || current.refresh_token, id_token: body.id_token || current.id_token })
    const at = decodeJwt(body.access_token)
    access[resource] = { token: body.access_token, exp: at?.exp ?? 0 }
    return body.access_token
  } catch (error: any) {
    console.error('OIDC REFRESH FAILED', error?.message)
    // A dead grant (revoked / expired session / family revoked on reuse) ends the
    // session; transient network errors keep it and the next call retries.
    if (error?.oauthError === 'invalid_grant') clearLocal()
    return ''
  }
}

/** RP-initiated logout: clear locally FIRST, then send the browser to end the AS
 * session (web departs; desktop bounces to the system browser and the window stays). */
export async function oidcSignOut(): Promise<void> {
  const idToken = stored()?.id_token
  clearLocal()
  if (!idToken) return
  try {
    const d = await discover()
    if (!d.end_session_endpoint) return
    const url = new URL(d.end_session_endpoint)
    url.searchParams.set('id_token_hint', idToken)
    url.searchParams.set(
      'post_logout_redirect_uri',
      browser.isElectron ? PROTOCOL + 'signoutCallback' : window.location.origin + '/signoutCallback'
    )
    window.location.assign(url.toString())
  } catch (error) {
    console.warn('OIDC SIGN OUT (AS side) FAILED', error)
  }
}

export function invalidateOidcToken() {
  access = {}
}

/** Local-only teardown: clears this app's tokens and NOTHING else. App sign-out never
 * ends the AS session (user directive — the browser session at the AS belongs to the
 * user, not to this app's error handling). `oidcSignOut` (RP-initiated end_session)
 * remains for a future explicit "sign out everywhere" action only. */
export function oidcClearLocal() {
  clearLocal()
}

function clearLocal() {
  access = {}
  localStorage.removeItem(TOKENS_KEY)
}

function persist(tokens: Stored) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

function cleanUrl() {
  const url = new URL(window.location.href)
  url.search = ''
  if (url.pathname === '/authCallback' || url.pathname === '/signoutCallback') url.pathname = '/'
  window.history.replaceState({}, '', url.toString())
}

async function tokenRequest(params: { [key: string]: string }): Promise<any> {
  const d = await discover()
  const response = await fetch(d.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: OAUTH_CLIENT_ID, ...params }),
  })
  const body: any = await response.json().catch(() => ({}))
  if (!response.ok || !body.access_token) {
    const error: any = new Error(body.error_description || body.error || `token endpoint ${response.status}`)
    error.oauthError = body.error
    throw error
  }
  return body
}
