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
// The MCP detail-type NAME is the resource's to declare, not this bundle's to pin: it is
// DISCOVERED from the MCP PRM (RFC 9728 — authorization_details_types_supported and the rich
// catalog), cached in the token store so sync callers read the last-known value, and refreshed
// before every authorize. A pinned copy is exactly what broke on 2026-08-31: the AS retired
// remoteit_mcp_dev for the stage-stable remoteit_mcp, the pinned request stopped resolving, and
// the agent lane died with "needs permissions" / reauth loops. The SHAPE stays local on
// purpose — the device-only action subset and the `actor` marker are this app's declaration
// (deliberately narrower than the advertisement); only the name rides discovery. A discovered
// RENAME flips declarationFingerprint(), so the existing stale-grant path heals it with one
// silent re-authorize instead of an error screen.
const MCP_TYPE_KEY = 'r3.oauth.mcpDetailType'
let mcpTypeMemo: string | undefined
function mcpDetailType(): string {
  if (mcpTypeMemo) return mcpTypeMemo
  try { const stored = tokenStore().getItem(MCP_TYPE_KEY); if (stored) return (mcpTypeMemo = stored) } catch { /* fall through */ }
  return OAUTH_MCP_DETAIL
}
async function refreshMcpDetailType(): Promise<string> {
  try {
    const r = new URL(OAUTH_MCP_RESOURCE)
    const prm = `${r.origin}/.well-known/oauth-protected-resource${r.pathname}`
    const doc = (await (await fetch(prm)).json()) as {
      authorization_details_types_supported?: string[]
      authorization_details_types?: Array<{ type?: string; risk_class?: string }>
    }
    const rich = doc.authorization_details_types ?? []
    const names = doc.authorization_details_types_supported ?? []
    // The standard (non-org) grant type: the rich catalog says so directly; a names-only
    // document falls back to the naming convention the registry has always used.
    const picked = rich.find(t => t.risk_class === 'standard' && typeof t.type === 'string')?.type
      ?? names.find(n => !n.endsWith('_org'))
    if (picked) {
      mcpTypeMemo = picked
      try { tokenStore().setItem(MCP_TYPE_KEY, picked) } catch { /* best effort */ }
    }
  } catch { /* offline or blocked — the last-known (or fallback) name stands */ }
  return mcpDetailType()
}
// Warm the cache off the boot path so oidcGrantStale() compares against fresh truth early.
void refreshMcpDetailType()

const declared = (): Array<{ resource: string; type: string; actions: string[]; actor?: string; locations?: string[] }> => [
  { resource: OAUTH_PASSPORT_RESOURCE, type: 'passport_account', actions: ['profile.read', 'credentials.write'] },
  // accounts.read: the OTHER accounts signed in on this browser, served by the account API from
  // this token's session — first-party apps only (permitteer docs/browser-accounts.md).
  { resource: `${OAUTH_ISSUER}/account/api`, type: 'permitteer_account', actions: ['apps.read', 'apps.write', 'accounts.read'] },
  // The AI agent's slice (remoteit-ai-agent.md D5): the stage's MCP detail, delegated
  // ONWARD to the agent service — `actor` is what stamps may_act into this session's
  // tokens, which is the exchange's precondition. The slice partitions from any plain
  // request of the same type, and the grant row it mints is the revocable object the
  // account console shows.
  // `locations` names WHICH resource's type this is (RFC 9396): the stage-stable name is
  // shared across every stage's MCP resource, and the actor's registered edge may cover more
  // than one (dev also acts toward evan) — the AS fails closed on that ambiguity by design.
  { resource: OAUTH_MCP_RESOURCE, type: mcpDetailType(), locations: [OAUTH_MCP_RESOURCE], actions: ['device:read', 'device:write', 'device:connect', 'device:execute'], actor: OAUTH_AGENT_ACTOR },
]

/** A stable fingerprint of what this build asks for. Order-insensitive, so reshuffling the
 *  list is not a change; adding, dropping or renaming an action is. */
const declarationFingerprint = () =>
  declared().map(d => `${d.resource}=${d.type}:${[...d.actions].sort().join(',')}${d.actor ? `@${d.actor}` : ''}`)
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
  // The authorize is the moment the name must be RIGHT (a stale one mints a grant the
  // exchange can't use) — resolve it fresh, falling back to last-known on failure.
  await refreshMcpDetailType()
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
    authorization_details: JSON.stringify(declared().map(d => ({ type: d.type, actions: d.actions, ...(d.locations ? { locations: d.locations } : {}), ...(d.actor ? { actor: d.actor } : {}) }))),
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

/** Current access token for `resource` ('' when signed out). Mints are SERIALIZED, not
 * shared: the rotating single-use refresh makes a concurrent second refresh a token
 * REUSE, which revokes the whole family — but a single shared promise handed a queued
 * caller whichever audience happened to be minting, so an agent-audience token would go
 * out to the account API and come back 401. Queue instead, and re-read the cache after
 * the wait so N callers for one audience still cost one refresh. */
export async function oidcAccessToken(resource: string = OAUTH_GRAPHQL_RESOURCE): Promise<string> {
  // A support session's token IS the session: served until it expires (a reload restores it from
  // the tab store), never refreshed, and '' — the end — once it is gone. Other audiences have
  // nothing to mint from; their features fail closed, as writes do under `act`.
  const support = stored()?.support
  if (support) return resource === OAUTH_GRAPHQL_RESOURCE && support.exp - Math.floor(Date.now() / 1000) > 0 ? support.access_token : ''
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

/** `known`: signed in on this BROWSER (the AS's session set) but not in this app yet — no tokens
 *  here; picking it runs a silent selection instead of a storage swap. */
export type OidcAccount = { sub: string; email?: string; name?: string; picture?: string; active: boolean; known: boolean }

/** The accounts this app has signed into, for the avatar menu. Active first. */
export function oidcAccounts(): OidcAccount[] {
  const activeSub = oidcClaims()?.sub
  const reg = readRegistry()
  return Object.entries(reg)
    .map(([sub, e]) => ({ sub, email: e.email, name: e.name, picture: e.picture, active: sub === activeSub, known: !e.refresh_token && !e.support }))
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
    // A bound token with no proof to present. Falling through to Bearer is deliberate — the AS
    // decides, and it will refuse (RFC 9449) — but that refusal arrives as a bare 401 with no
    // hint that the cause was a missing key rather than a dead session. Name it here, because
    // this is the only place that knows. Reached when WebCrypto/IndexedDB are unavailable,
    // which on a phone usually means private browsing.
    console.warn(`AUTH: no DPoP proof available for ${resource} — presenting a sender-constrained token as Bearer, which the AS will refuse`)
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

// --- the browser's accounts (permitteer docs/browser-accounts.md) --------------------------
// The AS keeps a per-browser session SET, but its cookie never reaches this origin, so the
// account API serves the set from this token's own session. Members this app holds no tokens
// for are filed as KNOWN — identity only — and the menu offers them; picking one is a silent
// selection (prompt=none + login_hint), which the AS answers for any live set member.
const ACCOUNT_RESOURCE = `${OAUTH_ISSUER}/account/api`

/** Why a refresh did not happen. `refused` is the one that used to be invisible: the menu
 *  kept rendering its cache while the AS was turning the call away, so a stale list and a
 *  broken one looked identical — on screen and in the console. */
export type BrowserAccountsRefresh =
  | { ok: true; multi: boolean }
  | { ok: false; reason: 'support-session' | 'no-token' | 'refused'; status?: number }

export async function oidcRefreshBrowserAccounts(): Promise<BrowserAccountsRefresh> {
  if (oidcActor()) return { ok: false, reason: 'support-session' } // no set member, nothing to switch to
  const url = `${ACCOUNT_RESOURCE}/accounts`
  const headers = await oidcAuthHeaders('GET', url, ACCOUNT_RESOURCE)
  if (!headers.authorization) return { ok: false, reason: 'no-token' }
  const r = await fetch(url, { headers })
  if (!r.ok) {
    // Never silently: an unreconciled menu is showing accounts that may not exist and hiding
    // ones that do, and the person has no way to tell. Say so where a bug report can find it.
    console.warn(`AUTH: the browser's accounts could not be refreshed (${r.status}) — the menu is showing its last known list`)
    return { ok: false, reason: 'refused', status: r.status }
  }
  const body = (await r.json()) as { multi?: boolean; accounts?: { sub: string; email?: string | null; name?: string | null; picture?: string | null; current?: boolean }[] }
  const listed = new Set<string>()
  const reg = readRegistry()
  for (const a of body.accounts ?? []) {
    if (!a.sub || a.current) continue
    listed.add(a.sub)
    const prev = reg[a.sub]
    reg[a.sub] = {
      ...(prev ?? {}),
      email: a.email ?? prev?.email,
      name: a.name ?? prev?.name,
      picture: typeof a.picture === 'string' && /^https:\/\//i.test(a.picture) ? a.picture : prev?.picture,
    }
  }
  // The AS has just told us who is signed in on this browser, so that answer WINS: a member it
  // no longer lists was signed out elsewhere or has expired, and an entry we keep is one the
  // menu offers. Keeping a saved-but-unlisted account is what put a dead row on the menu —
  // activating it cannot work (its session, and with it its refresh family, is gone), so the
  // click swaps in tokens that fail and drops the person on the sign-in screen.
  //
  // The `multi` guard is the one thing that must not be reconciled away: with multi-account
  // switched off the AS answers "just you" by design, not "everyone else is gone", and pruning
  // on that would sign out every account this app has saved. Identity-only entries carry no
  // such risk — they exist only because some earlier answer named them.
  //
  // The active account is never in `listed` (it arrives as `current` and is skipped above), so
  // it is held out explicitly. Support entries live in a tab-scoped store and are not members.
  //
  // One case this deliberately treats as "gone": a session the AS's write cap evicted from the
  // set (SESSION_SET_CAP = 10) stays LIVE but stops being part of this browser, and nothing in
  // the answer distinguishes it from a sign-out. Dropping it costs one "Switch account" to get
  // back, needs an eleventh account on one browser to happen at all, and the alternative is the
  // dead row this whole change exists to remove.
  const reportsSet = body.multi === true
  const activeSub = oidcClaims()?.sub
  for (const [sub, e] of Object.entries(reg)) {
    if (e.support || listed.has(sub) || sub === activeSub) continue
    if (e.refresh_token && !reportsSet) continue
    delete reg[sub]
  }
  writeRegistry(reg)
  return { ok: true, multi: reportsSet }
}
/** Pick a KNOWN account: silent selection through the AS. False when the sub is not a known entry. */
export async function oidcSelectKnownAccount(sub: string): Promise<boolean> {
  const e = readRegistry()[sub]
  if (!e || e.refresh_token || !e.email) return false
  await oidcStart({ prompt: 'none', loginHint: e.email })
  return true
}
