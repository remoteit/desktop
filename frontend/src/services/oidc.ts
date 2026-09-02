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
// The ACCOUNT REGISTRY (multi-account menu): one saved token set per subject this app has
// signed into, beside the single ACTIVE set in TOKENS_KEY. Google-style client-side
// multi-account — the AS's own session set is browser-cookie state this origin can never
// read (SameSite=Lax + no CORS on cookie lanes, by doctrine), so the menu lists the
// accounts THIS APP knows; the AS chooser on the add-account hop shows the rest. Every
// entry's refresh token is DPoP-bound to the ONE browser key (below), so the key rotates
// only when the LAST account leaves — rotating on every sign-out would silently kill the
// other accounts' saved sessions. A support session (id_token carries `act`) is NEVER
// saved: impersonation must not become a stored identity (support tabs keep an isolated
// per-tab store anyway).
const ACCOUNTS_KEY = 'oidc.accounts'

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
const SUPPORT_TICKET_KEY = 'oidc.support_ticket'
// Support-session LAUNCH (permitteer docs/desktop-support.md): the console lands this tab on
// the app with a one-time ?support_ticket. The ticket is stashed for the authorize auth.init
// starts (it rides that request as `support_ticket`; the AS binds the sign-in to the operator's
// support session, which also needs the browser's support cookie on the AS origin), the flag
// makes this tab's token store tab-scoped, and the URL is scrubbed so a reload never replays a
// spent ticket. Replaces the earlier `?support_session=1` contract, which the AS no longer sends.
{
  const launch = new URLSearchParams(window.location.search).get('support_ticket')
  if (launch) {
    try { sessionStorage.setItem(SUPPORT_FLAG, '1'); sessionStorage.setItem(SUPPORT_TICKET_KEY, launch) } catch { /* a blocked storage API must not kill the boot */ }
    const clean = new URL(window.location.href)
    clean.searchParams.delete('support_ticket')
    window.history.replaceState({}, '', clean.toString())
  }
}
/** The token store for THIS TAB: tab-scoped for a support session, shared otherwise. */
const tokenStore = (): Storage => {
  try { return sessionStorage.getItem(SUPPORT_FLAG) ? window.sessionStorage : window.localStorage } catch { return window.localStorage }
}

type Flow = { verifier: string; state: string; nonce: string; redirectUri: string }
/** A support session (`act` in the id_token) has NO refresh token — its one access token IS the
 *  session, stored so a reload of the support tab survives until it expires. */
type Stored = { refresh_token?: string; id_token?: string; support?: { access_token: string; exp: number; type?: string } }

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
    const raw = tokenStore().getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export const oidcConfigured = () => !!OAUTH_ISSUER
const supportLive = (s: Stored | undefined) => !!s?.support && s.support.exp - Math.floor(Date.now() / 1000) > 0
export const oidcSignedIn = () => { const s = stored(); return !!s?.refresh_token || supportLive(s) }
/** This tab was opened by a support launch (its token store is tab-scoped). */
export const oidcIsSupportTab = (): boolean => { try { return !!sessionStorage.getItem(SUPPORT_FLAG) } catch { return false } }
/** The launch ticket, ONCE — consumed by the authorize auth.init starts. */
export function oidcTakeSupportTicket(): string | undefined {
  try { const t = sessionStorage.getItem(SUPPORT_TICKET_KEY) ?? undefined; sessionStorage.removeItem(SUPPORT_TICKET_KEY); return t } catch { return undefined }
}
/** When the support session's token — and with it the session — ends (ms), for the banner. */
export const oidcSupportEndsAt = (): number | undefined => { const s = stored()?.support; return s ? s.exp * 1000 : undefined }
export const oidcClaims = (): OidcClaims | undefined => decodeJwt(stored()?.id_token)
/** The support-session marker: permitteer stamps `act` (the OPERATOR acting as this
 *  subject) into every token of an impersonated session, the id_token included — the
 *  app-readable artifact. Null on an ordinary session. */
export const oidcActor = (): { sub: string } | null => decodeJwt(stored()?.id_token)?.act ?? null

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
    return tokenStore().getItem(DECLARATION_KEY) !== declarationFingerprint()
  } catch {
    return false
  }
}

export async function oidcStart(opts: { prompt?: 'login' | 'select_account' | 'none'; loginHint?: string; supportTicket?: string } = {}): Promise<void> {
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
    // `profile` rides for the account menus: name + the IdP avatar (the AS stamps the
    // session's picture into the id_token under profile — https-only, its one guard).
    scope: 'openid email profile full',
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
  // A support launch: the one-time ticket binds THIS authorize to the operator's support session.
  if (opts.supportTicket) params.support_ticket = opts.supportTicket
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
  // Sub-aware handover: the SAME account signing in again replaces its family (revoke the
  // old refresh token — it is dead weight); a DIFFERENT account arriving is the
  // add-account path, and the previous account's set is a LIVING saved session — persist()
  // already filed it in the registry, so it must absolutely not be revoked here.
  const previousSet = stored()
  const previousSub = decodeJwt(previousSet?.id_token)?.sub
  const previous = previousSet?.refresh_token
  if (previous && previous !== body.refresh_token && (!claims?.sub || previousSub === claims.sub)) {
    fetch(`${OAUTH_ISSUER}/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: previous, token_type_hint: 'refresh_token', client_id: OAUTH_CLIENT_ID }),
    }).catch(() => {})
  }
  const at = decodeJwt(body.access_token)
  if (claims?.act) {
    // A SUPPORT session (docs/desktop-support.md): the AS mints no refresh token, and the access
    // token lives exactly as long as the session — so it is stored (tab-scoped) and used until
    // it expires; that expiry IS the end of the support session. Never filed as an account.
    persist({ id_token: body.id_token, support: { access_token: body.access_token, exp: at?.exp ?? 0, type: body.token_type } })
  } else {
    persist({ refresh_token: body.refresh_token, id_token: body.id_token })
  }
  // The authorize that just completed asked for DECLARED, and a skipConsent first-party grant
  // is merged from exactly that — so the grant now covers this build. Stamp it — active AND
  // this account's registry entry, so a later activation restores the right measurement.
  try {
    tokenStore().setItem(DECLARATION_KEY, declarationFingerprint())
    if (claims?.sub && !claims?.act) {
      const reg = readRegistry()
      if (reg[claims.sub]) { reg[claims.sub].declaration = declarationFingerprint(); writeRegistry(reg) }
    }
  } catch { /* non-fatal */ }
  access[OAUTH_GRAPHQL_RESOURCE] = { token: body.access_token, exp: at?.exp ?? 0, type: body.token_type }
  return claims
}

/** Current access token for the graphql audience ('' when signed out). Refreshes
 * single-flight — the rotating single-use refresh makes a concurrent second refresh
 * token REUSE, which revokes the whole family. */
export async function oidcAccessToken(resource: string = OAUTH_GRAPHQL_RESOURCE): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  // A support session's token IS the session: served until it expires (a reload restores it from
  // the tab store), never refreshed, and '' — the end — once it is gone. Other audiences have
  // nothing to mint from; their features fail closed, as writes do under `act`.
  const support = stored()?.support
  if (support) return resource === OAUTH_GRAPHQL_RESOURCE && support.exp - now > 0 ? support.access_token : ''
  const cached = access[resource]
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
    // Rotated — persist the successor FIRST, before anything can race another mint. But
    // ONLY onto the same token set we rotated from: a sign-out or an account activation
    // that landed mid-flight has already moved the store, and writing the rotation would
    // resurrect the signed-out account (persist() re-files it in the registry — caught by
    // the multi-account e2e, ~50% of runs) or clobber the activated one. The dropped
    // successor costs nothing: sign-out already ended the AS session (revoking its refresh
    // family), and activation replaced the family in use.
    if (stored()?.refresh_token !== current.refresh_token) return ''
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

/** Local-only teardown: clears the ACTIVE account's tokens (and its registry entry) and
 * NOTHING else. App sign-out never ends the AS session (user directive — the browser
 * session at the AS belongs to the user, not to this app's error handling), and it never
 * touches the OTHER saved accounts — signing out one identity is not signing out of the
 * app's memory of the rest. `oidcSignOut` (RP-initiated end_session) remains for a future
 * explicit "sign out everywhere" action only. */
export function oidcClearLocal() {
  clearLocal()
}

function clearLocal() {
  const activeSub = oidcClaims()?.sub
  const reg = readRegistry()
  if (activeSub && reg[activeSub]) {
    delete reg[activeSub]
    writeRegistry(reg)
  }
  // The one DPoP key binds EVERY saved account's refresh token, so it rotates only when
  // the last account leaves — "key loss ≡ session loss" now means ALL sessions.
  if (Object.keys(reg).length === 0) void clearDpopKey()
  access = {}
  tokenStore().removeItem(TOKENS_KEY)
  tokenStore().removeItem(DECLARATION_KEY)
}

function persist(tokens: Stored) {
  tokenStore().setItem(TOKENS_KEY, JSON.stringify(tokens))
  // Keep the registry entry in step with the ACTIVE set. This runs on every refresh too,
  // which is load-bearing: refresh tokens rotate single-use, so a registry copy left
  // behind would be a REPLAY when later activated — revoking the whole family.
  fileAccount(tokens)
}

// --- the account registry (multi-account menu) ---------------------------------------

type RegistryEntry = Stored & { email?: string; name?: string; picture?: string; declaration?: string }

const readRegistry = (): { [sub: string]: RegistryEntry } => {
  try {
    const raw = tokenStore().getItem(ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const writeRegistry = (reg: { [sub: string]: RegistryEntry }) => {
  try { tokenStore().setItem(ACCOUNTS_KEY, JSON.stringify(reg)) } catch { /* storage blocked — menu degrades to active-only */ }
}

/** File a token set under its subject — silently NOT for support sessions (`act`). */
function fileAccount(tokens: Stored) {
  const claims = decodeJwt(tokens.id_token)
  const sub = claims?.sub
  if (!sub || claims?.act) return
  const reg = readRegistry()
  reg[sub] = {
    ...tokens,
    email: claims?.email,
    name: claims?.name,
    // Belt on the AS's own https-only guard — this string lands in an <img src>.
    picture: typeof claims?.picture === 'string' && /^https:\/\//i.test(claims.picture) ? claims.picture : undefined,
    declaration: reg[sub]?.declaration,
  }
  writeRegistry(reg)
}

export type OidcAccount = { sub: string; email?: string; name?: string; picture?: string; active: boolean }

/** The accounts this app has signed into, for the avatar menu. Active first. */
export function oidcAccounts(): OidcAccount[] {
  const activeSub = oidcClaims()?.sub
  const reg = readRegistry()
  return Object.entries(reg)
    .map(([sub, e]) => ({ sub, email: e.email, name: e.name, picture: e.picture, active: sub === activeSub }))
    .sort((a, b) => Number(b.active) - Number(a.active) || (a.email ?? a.sub).localeCompare(b.email ?? b.sub))
}

/** Make a saved account the ACTIVE one. Storage-only — the caller reloads the app so
 *  every model boots as the new identity (a soft swap would bleed one account's data
 *  into the other's view). Returns false when the account is unknown. */
/** One-shot marker: WHO was just activated, so a boot that finds the saved tokens dead can
 *  try ONE silent recovery (prompt=none + login_hint — the AS serves any live set member
 *  the hint names) before falling to the sign-in screen. sessionStorage: dies with the tab,
 *  and it is cleared before the attempt so a failed round can never loop. */
const ACTIVATING_KEY = 'oidc.activating'
export function oidcTakeActivationHint(): string | undefined {
  try {
    const email = sessionStorage.getItem(ACTIVATING_KEY) ?? undefined
    sessionStorage.removeItem(ACTIVATING_KEY)
    return email || undefined
  } catch {
    return undefined
  }
}

export function oidcActivateAccount(sub: string): boolean {
  const entry = readRegistry()[sub]
  if (!entry?.refresh_token) return false
  try { if (entry.email) sessionStorage.setItem(ACTIVATING_KEY, entry.email) } catch { /* recovery hint only */ }
  access = {}
  tokenStore().setItem(TOKENS_KEY, JSON.stringify({ refresh_token: entry.refresh_token, id_token: entry.id_token }))
  // The declaration stamp is per-GRANT, and the grant is per-account: swap it with the
  // tokens or the boot check would measure account B against account A's grant.
  try {
    if (entry.declaration) tokenStore().setItem(DECLARATION_KEY, entry.declaration)
    else tokenStore().removeItem(DECLARATION_KEY)
  } catch { /* non-fatal — worst case is one redundant re-authorize */ }
  return true
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
