import browser from './browser'
import { OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_GRAPHQL_RESOURCE, OAUTH_PASSPORT_RESOURCE, PROTOCOL } from '../constants'

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
// What the grant behind those tokens was last written from (see oidcGrantStale).
const DECLARATION_KEY = 'oidc.declaration'

// A boot on /signoutCallback is the RETURN from an explicit sign-out: the next authorize
// must show the LOGIN PAGE (prompt=login), never silently SSO into another account's
// live session in the multi-account cookie.
let promptLogin = false
/** The NEXT authorize must land on the login page (no silent SSO into another chip) —
 * set by the silent sign-out just before the app re-enters the sign-in flow. */
export function oidcRequireLoginPrompt() {
  promptLogin = true
}
if (window.location.pathname === '/signoutCallback') {
  promptLogin = true
  window.history.replaceState({}, '', window.location.origin + '/')
}

// A boot carrying ?support_session=1 is a SUPPORT-SESSION LAUNCH (permitteer's
// /impersonate/launch, docs/remoteit-desktop-login.md Phase 4d): an operator just became
// someone else in the AS's cookie, and THIS app's stored tokens still belong to the
// operator — shadow auth that would silently show the wrong account, which is exactly what
// the first live test did. Drop local state and let the ordinary signed-out boot run its
// authorize: the silent SSO lands on the ACTIVE session, which the launch just made the
// impersonated one. Deliberately NOT prompt=login — inheriting that session is the point.
if (new URLSearchParams(window.location.search).has('support_session')) {
  // Inline removals, NOT clearLocal(): this runs at module evaluation, and clearLocal
  // touches `let access` declared BELOW — a TDZ ReferenceError here killed the whole
  // bundle on dev (eternal splash, param never stripped). Only the hoisted consts above
  // are safe to reach from module scope. The DPoP key stays: it is the APP's key, and the
  // impersonated session's tokens bind to it exactly as any other boot's would.
  try {
    localStorage.removeItem(TOKENS_KEY)
    localStorage.removeItem(DECLARATION_KEY)
  } catch { /* a blocked storage API must not kill the boot */ }
  const clean = new URL(window.location.href)
  clean.searchParams.delete('support_session')
  window.history.replaceState({}, '', clean.toString())
}

type Flow = { verifier: string; state: string; nonce: string; redirectUri: string }
type Stored = { refresh_token: string; id_token?: string }

let access: { [resource: string]: { token: string; exp: number; type?: string } } = {}
let refreshing: Promise<string> | undefined
let discovery: { authorization_endpoint: string; token_endpoint: string; end_session_endpoint?: string; end_session_api_endpoint?: string } | undefined

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
/** What this build asks for, per audience. ONE source of truth: the authorize request is
 *  built from it AND the boot check measures tokens against it, so a slice added in a deploy
 *  cannot end up requested-but-never-checked (or checked-but-never-requested).
 *  `passport_account` gates the native security settings; `permitteer_account` is Connected
 *  Apps against the AS's own account API (plan D6) — list + revoke. The graphql audience
 *  stays pure scope-`full` and carries no details, so it is not listed here. */
const DECLARED: Array<{ resource: string; type: string; actions: string[] }> = [
  { resource: OAUTH_PASSPORT_RESOURCE, type: 'passport_account', actions: ['profile.read', 'credentials.write'] },
  { resource: `${OAUTH_ISSUER}/account/api`, type: 'permitteer_account', actions: ['apps.read', 'apps.write'] },
]

/** A stable fingerprint of what this build asks for. Order-insensitive, so reshuffling the
 *  list is not a change; adding, dropping or renaming an action is. */
const declarationFingerprint = () =>
  DECLARED.map(d => `${d.resource}=${d.type}:${[...d.actions].sort().join(',')}`)
    .sort()
    .join('|')

/** Does the standing grant predate what this build asks for? A deploy that adds a slice
 *  leaves already-signed-in installs short: their grant was written from the OLD request, and
 *  no refresh can widen it — refresh re-reads the grant, it never adds to it. Only a fresh
 *  authorize merges the new slice in, silently for a skipConsent first-party client.
 *
 *  Answered from a fingerprint stamped at the last completed authorize — the one moment we
 *  know the grant was written from a particular declaration — so the check costs nothing and
 *  cannot mistake a network problem for a missing permission. It is a CLAIM rather than
 *  proof, which is acceptable only because being wrong costs one silent re-authorize: an
 *  install with no stamp (cleared storage, or signed in before this existed) heals once and
 *  then matches. What it deliberately cannot see is a grant narrowed on the server. */
export function oidcGrantStale(): boolean {
  try {
    return localStorage.getItem(DECLARATION_KEY) !== declarationFingerprint()
  } catch {
    return false
  }
}

export async function oidcStart(opts: { prompt?: 'login' | 'select_account'; loginHint?: string } = {}): Promise<void> {
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
    // First-party clients declare their own details (no consent screen — skipConsent):
    // the passport-audience token minted later via refresh carries this slice, gating the
    // native security settings (credentials.write); the graphql audience stays pure
    // scope-`full` (an uncovered resource yields audience-only tokens).
    authorization_details: JSON.stringify(DECLARED.map(d => ({ type: d.type, actions: d.actions }))),
    state: flow.state,
    nonce: flow.nonce,
  }
  // Naming WHO is signing in turns a step-up into "confirm it's you" rather than an account
  // chooser — without it, prompt=login lands on the picker and choosing your own account
  // simply returns you to the same page, which reads as a loop.
  if (opts.loginHint) params.login_hint = opts.loginHint
  if (opts.prompt) {
    params.prompt = opts.prompt
  } else if (promptLogin) {
    params.prompt = 'login'
    promptLogin = false
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
  const previous = stored()?.refresh_token
  if (previous && previous !== body.refresh_token) {
    fetch(`${OAUTH_ISSUER}/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: previous, token_type_hint: 'refresh_token', client_id: OAUTH_CLIENT_ID }),
    }).catch(() => {})
  }
  persist({ refresh_token: body.refresh_token, id_token: body.id_token })
  // The authorize that just completed asked for DECLARED, and a skipConsent first-party grant
  // is merged from exactly that — so the grant now covers this build. Stamp it.
  try { localStorage.setItem(DECLARATION_KEY, declarationFingerprint()) } catch { /* non-fatal */ }
  const at = decodeJwt(body.access_token)
  access[OAUTH_GRAPHQL_RESOURCE] = { token: body.access_token, exp: at?.exp ?? 0, type: body.token_type }
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
    access[resource] = { token: body.access_token, exp: at?.exp ?? 0, type: body.token_type }
    return body.access_token
  } catch (error: any) {
    console.error('OIDC REFRESH FAILED', error?.message)
    // A dead grant (revoked / expired session / family revoked on reuse) ends the
    // session; transient network errors keep it and the next call retries.
    if (error?.oauthError === 'invalid_grant') clearLocal()
    return ''
  }
}

/** SILENT AS logout (EXPLICIT sign-out only — failure paths never end the AS session):
 * the same RP-initiated logout, over fetch. Same trust (the id_token hint), no
 * navigation — the parade of redirect hops was the only thing the front-channel bought
 * us. Best-effort: an unreachable AS must not block local teardown; the session gate
 * kills the tokens lazily anyway. */
export async function oidcEndSessionSilently(): Promise<void> {
  const idToken = stored()?.id_token
  if (!idToken) return
  try {
    const d = await discover()
    if (!d.end_session_api_endpoint) return
    const response = await fetch(d.end_session_api_endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id_token_hint: idToken }),
    })
    if (!response.ok && response.status !== 204) console.warn('OIDC SILENT LOGOUT', response.status)
  } catch (error) {
    console.warn('OIDC SILENT LOGOUT FAILED', error)
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
  void clearDpopKey()
  access = {}
  localStorage.removeItem(TOKENS_KEY)
  localStorage.removeItem(DECLARATION_KEY)
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

// --- DPoP (plan D9): sender-constrained tokens --------------------------------------
// The key is generated NON-EXTRACTABLE and lives as a CryptoKey in IndexedDB: an XSS can
// use it while running in-page, but can never exfiltrate it — which is the entire browser
// story. Every /token call carries a proof once a key exists (per-mint opt-in binding for
// the desktop client; the portal client REQUIRES it), and bound audiences present with
// the DPoP scheme + an ath proof. No WebCrypto/IndexedDB → no proof → the AS decides
// (desktop falls back to bearer; the portal client refuses, loudly).
const DPOP_DB = 'remoteit-oidc'
const DPOP_STORE = 'keys'
let dpopPair: Promise<CryptoKeyPair | null> | undefined

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DPOP_DB, 1)
    open.onupgradeneeded = () => open.result.createObjectStore(DPOP_STORE)
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => reject(open.error)
  })
}
async function idbReq<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(DPOP_STORE, mode).objectStore(DPOP_STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

async function dpopKey(): Promise<CryptoKeyPair | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle || typeof indexedDB === 'undefined') return null
  if (!dpopPair)
    dpopPair = (async () => {
      try {
        const existing = await idbReq<CryptoKeyPair | undefined>('readonly', s => s.get('dpop'))
        if (existing?.privateKey) return existing
        const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
        await idbReq('readwrite', s => s.put(pair, 'dpop'))
        return pair
      } catch {
        return null
      }
    })()
  return dpopPair
}

/** Explicit sign-out rotates the key with the tokens (key loss ≡ session loss anyway). */
async function clearDpopKey(): Promise<void> {
  dpopPair = undefined
  try {
    await idbReq('readwrite', s => s.delete('dpop'))
  } catch {
    /* no store, nothing to clear */
  }
}

const dpopB64u = (bytes: ArrayBuffer | Uint8Array) => {
  const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let out = ''
  for (let i = 0; i < a.length; i++) out += String.fromCharCode(a[i])
  return btoa(out).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const utf8 = (s: string) => new TextEncoder().encode(s)

async function dpopProof(htm: string, htu: string, accessToken?: string): Promise<string | null> {
  const pair = await dpopKey()
  if (!pair) return null
  const jwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as { kty: string; crv?: string; x?: string; y?: string }
  const u = new URL(htu)
  const header = dpopB64u(utf8(JSON.stringify({ alg: 'ES256', typ: 'dpop+jwt', jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } })))
  const payload = dpopB64u(
    utf8(
      JSON.stringify({
        htm,
        htu: u.origin + u.pathname,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(),
        ...(accessToken ? { ath: dpopB64u(await crypto.subtle.digest('SHA-256', utf8(accessToken))) } : {}),
      })
    )
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, utf8(`${header}.${payload}`))
  return `${header}.${payload}.${dpopB64u(sig)}`
}

/** Auth headers for an API call: the DPoP scheme + an ath proof when this audience's
 * token came back bound, plain Bearer otherwise. {} when signed out. */
export async function oidcAuthHeaders(method: string, url: string, resource: string = OAUTH_GRAPHQL_RESOURCE): Promise<Record<string, string>> {
  const token = await oidcAccessToken(resource)
  if (!token) return {}
  if (access[resource]?.type === 'DPoP') {
    const proof = await dpopProof(method, url, token)
    if (proof) return { authorization: `DPoP ${token}`, DPoP: proof }
  }
  return { authorization: `Bearer ${token}` }
}

async function tokenRequest(params: { [key: string]: string }): Promise<any> {
  const d = await discover()
  const proof = await dpopProof('POST', d.token_endpoint)
  const response = await fetch(d.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...(proof ? { DPoP: proof } : {}) },
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
