import browser from './browser'
import { OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_GRAPHQL_RESOURCE, OAUTH_PASSPORT_RESOURCE, OAUTH_MCP_RESOURCE, OAUTH_MCP_DETAIL, OAUTH_AGENT_ACTOR, PROTOCOL } from '../constants'

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

/* Authorizes this tab has started on its OWN — no click, nobody asked. This client is
   first-party skipConsent, so an automatic authorize shows the person NOTHING: a loop
   through it is invisible from the app and its only outward symptom is the AS
   rate-limiting the whole address, which then locks out everyone behind it. The state
   guards in the auth model are the real brakes; this is the backstop that holds when one
   of them is missed. Cleared the moment an exchange completes. */
const AUTO_START_KEY = 'oidc.autoStarts'
export const oidcAutoStartsSpent = (): number => {
  try {
    return Number(window.sessionStorage.getItem(AUTO_START_KEY)) || 0
  } catch {
    return 0
  }
}
export const oidcCountAutoStart = (): void => {
  try {
    window.sessionStorage.setItem(AUTO_START_KEY, String(oidcAutoStartsSpent() + 1))
  } catch {
    /* blocked storage must not stop someone signing in */
  }
}
export const oidcClearAutoStarts = (): void => {
  try {
    window.sessionStorage.removeItem(AUTO_START_KEY)
  } catch {
    /* non-fatal */
  }
}

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

// A support TAB keeps its tokens in sessionStorage — per-tab — never in the shared
// localStorage. The first cut CLEARED localStorage instead, and localStorage is
// origin-wide: the support tab's impersonated tokens replaced the operator's own, so
// refreshing their normally-signed-in tab silently became the support session. Isolation
// beats clearing on both counts: the operator's tabs keep their tokens untouched, and the
// support tab boots token-less into the silent authorize that inherits the impersonated
// session. The flag itself lives in sessionStorage, so it dies with the tab.
// (Module-scope discipline: touch only hoisted consts and the storage APIs here — the
// first cut's clearLocal() call hit a temporal dead zone and killed the whole bundle.)
const SUPPORT_FLAG = 'oidc.support'
if (new URLSearchParams(window.location.search).has('support_session')) {
  try { sessionStorage.setItem(SUPPORT_FLAG, '1') } catch { /* a blocked storage API must not kill the boot */ }
  const clean = new URL(window.location.href)
  clean.searchParams.delete('support_session')
  window.history.replaceState({}, '', clean.toString())
}
/** The token store for THIS TAB: tab-scoped for a support session, shared otherwise. */
const tokenStore = (): Storage => {
  try { return sessionStorage.getItem(SUPPORT_FLAG) ? window.sessionStorage : window.localStorage } catch { return window.localStorage }
}

type Flow = { verifier: string; state: string; nonce: string; redirectUri: string }
type Stored = { refresh_token: string; id_token?: string }

let access: { [resource: string]: { token: string; exp: number; type?: string } } = {}
let minting: Promise<unknown> = Promise.resolve()
/* Why the last mint for an audience failed. refresh() reports a refusal by returning
   '' so callers can degrade quietly, which loses the AS's reason — keep it here so a
   settings screen can say "not covered by this grant" instead of just "refused". */
let mintErrors: { [resource: string]: string } = {}
let discovery: { authorization_endpoint: string; token_endpoint: string; end_session_endpoint?: string; end_session_api_endpoint?: string } | undefined

/* Sign-in failures the person reading them can DO something different about. The message
   stays the technical detail — console, support, bug reports — while `code` is what picks
   the sentence they read, so the AS rewording an error_description can never silently
   change our copy, and an untranslated server string can never reach the screen. */
export type OidcErrorCode = 'rateLimited' | 'unreachable' | 'unavailable' | 'refused' | 'expired'

export class OidcError extends Error {
  code: OidcErrorCode
  /** Seconds to wait, when the server told us (429). */
  retryAfter?: number
  constructor(code: OidcErrorCode, message: string, retryAfter?: number) {
    super(message)
    this.name = 'OidcError'
    this.code = code
    this.retryAfter = retryAfter
  }
}

/* A day. Nothing that gates a sign-in retry waits longer, so a "wait" bigger than this
   is not a countdown at all — it is an epoch timestamp, which some rate limiters send in
   ratelimit-reset despite the draft specifying delta-seconds. Taken literally that
   renders as "try again in about 29566667 minutes", so treat it as the unusable number
   it is and let the caller fall back to wording with no figure in it. */
const MAX_RETRY_AFTER = 24 * 60 * 60

/* Retry-After is allowed to be either delta-seconds or an HTTP date; permitteer's rate
   limiter also sends ratelimit-reset. Take whichever is present so "try again in N
   minutes" is the server's number rather than a guess — but only when the number is
   one a person could actually act on. */
const retryAfterSeconds = (response: Response): number | undefined => {
  const header = response.headers.get('retry-after') || response.headers.get('ratelimit-reset')
  if (!header) return undefined
  const plausible = (seconds: number) => (seconds >= 0 && seconds <= MAX_RETRY_AFTER ? Math.round(seconds) : undefined)
  const seconds = Number(header)
  if (!Number.isNaN(seconds)) return plausible(seconds)
  const date = Date.parse(header)
  return Number.isNaN(date) ? undefined : plausible((date - Date.now()) / 1000)
}

/* One place that decides what a non-OK response from the AS MEANS, so the token endpoint
   and discovery cannot drift into telling the user different stories about a 429. */
const responseError = (response: Response, detail: string): OidcError => {
  if (response.status === 429) return new OidcError('rateLimited', detail, retryAfterSeconds(response))
  if (response.status >= 500) return new OidcError('unavailable', detail)
  return new OidcError('refused', detail)
}

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
    const raw = tokenStore().getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export const oidcConfigured = () => !!OAUTH_ISSUER
export const oidcSignedIn = () => !!stored()?.refresh_token
export const oidcClaims = (): OidcClaims | undefined => decodeJwt(stored()?.id_token)
/** The support-session marker: permitteer stamps `act` (the OPERATOR acting as this
 *  subject) into every token of an impersonated session, the id_token included — the
 *  app-readable artifact. Null on an ordinary session. */
export const oidcActor = (): { sub: string } | null => decodeJwt(stored()?.id_token)?.act ?? null

async function discover() {
  if (discovery) return discovery
  let response: Response
  try {
    response = await fetch(`${OAUTH_ISSUER}/.well-known/openid-configuration`)
  } catch (error: any) {
    // fetch only rejects when the request never got an answer: offline, DNS, TLS, CORS.
    throw new OidcError('unreachable', `discovery unreachable: ${error?.message || 'network error'}`)
  }
  if (!response.ok) throw responseError(response, `discovery failed: ${response.status}`)
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
const DECLARED: Array<{ resource: string; type: string; actions: string[]; actor?: string }> = [
  { resource: OAUTH_PASSPORT_RESOURCE, type: 'passport_account', actions: ['profile.read', 'credentials.write'] },
  { resource: `${OAUTH_ISSUER}/account/api`, type: 'permitteer_account', actions: ['apps.read', 'apps.write'] },
  // The AI agent's slice (remoteit-ai-agent.md D5): the stage's MCP detail, delegated
  // ONWARD to the agent service — `actor` is what stamps may_act into this session's
  // tokens, which is the exchange's precondition. The slice partitions from any plain
  // request of the same type, and the grant row it mints is the revocable object the
  // account console shows.
  { resource: OAUTH_MCP_RESOURCE, type: OAUTH_MCP_DETAIL, actions: ['device:read', 'device:write', 'device:connect', 'device:execute'], actor: OAUTH_AGENT_ACTOR },
]

/** A stable fingerprint of what this build asks for. Order-insensitive, so reshuffling the
 *  list is not a change; adding, dropping or renaming an action is. */
const declarationFingerprint = () =>
  DECLARED.map(d => `${d.resource}=${d.type}:${[...d.actions].sort().join(',')}${d.actor ? `@${d.actor}` : ''}`)
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
    return tokenStore().getItem(DECLARATION_KEY) !== declarationFingerprint()
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
    authorization_details: JSON.stringify(DECLARED.map(d => ({ type: d.type, actions: d.actions, ...(d.actor ? { actor: d.actor } : {}) }))),
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
  if (!flow || flow.state !== state) throw new OidcError('expired', 'Sign-in state mismatch')
  const error = query.get('error')
  if (error) throw new OidcError('refused', query.get('error_description') || error)

  const body = await tokenRequest({
    grant_type: 'authorization_code',
    code: query.get('code') || '',
    code_verifier: flow.verifier,
    redirect_uri: flow.redirectUri,
    resource: OAUTH_GRAPHQL_RESOURCE,
  })
  const claims = decodeJwt(body.id_token)
  if (claims?.nonce !== flow.nonce) throw new OidcError('expired', 'Sign-in nonce mismatch')
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
  try { tokenStore().setItem(DECLARATION_KEY, declarationFingerprint()) } catch { /* non-fatal */ }
  const at = decodeJwt(body.access_token)
  access[OAUTH_GRAPHQL_RESOURCE] = { token: body.access_token, exp: at?.exp ?? 0, type: body.token_type }
  return claims
}

/** Current access token for `resource` ('' when signed out). Mints are SERIALIZED, not
 * shared: the rotating single-use refresh makes a concurrent second refresh a token
 * REUSE, which revokes the whole family — but a single shared promise handed a queued
 * caller whichever audience happened to be minting, so an agent-audience token would go
 * out to the account API and come back 401. Queue instead, and re-read the cache after
 * the wait so N callers for one audience still cost one refresh. */
export async function oidcAccessToken(resource: string = OAUTH_GRAPHQL_RESOURCE): Promise<string> {
  const fresh = () => {
    const cached = access[resource]
    return cached && cached.exp - Math.floor(Date.now() / 1000) > 30 ? cached.token : undefined
  }
  const hit = fresh()
  if (hit) return hit
  const next = minting.then(() => fresh() ?? refresh(resource))
  minting = next.catch(() => {})
  return next
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
    delete mintErrors[resource]
    return body.access_token
  } catch (error: any) {
    console.error('OIDC REFRESH FAILED', error?.message)
    mintErrors[resource] = error?.message || 'token request failed'
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

/** Why the last mint for this audience was refused, if it was. */
export const oidcMintError = (resource: string): string | undefined => mintErrors[resource]

export function invalidateOidcToken() {
  access = {}
  mintErrors = {}
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
  tokenStore().removeItem(TOKENS_KEY)
  tokenStore().removeItem(DECLARATION_KEY)
}

function persist(tokens: Stored) {
  tokenStore().setItem(TOKENS_KEY, JSON.stringify(tokens))
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
    const detail = body.error_description || body.error || `token endpoint ${response.status}`
    const error: any = responseError(response, detail)
    error.oauthError = body.error
    throw error
  }
  return body
}
