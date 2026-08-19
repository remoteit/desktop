/**
 * In-app Hydra sign-in for the agent service — OAuth 2.1 authorization code +
 * PKCE, with self-service Dynamic Client Registration. Mirrors the MCP demo
 * SPA in the authentication repo (hydra-login-consent/scripts/demo-spa).
 *
 * Flow: ensure a DCR client for this origin → full-page redirect to the Hydra
 * login/consent pages → return to the app root with ?code → exchange for
 * tokens → store access token + refresh session (services/agent.ts) →
 * silently refresh before expiry.
 *
 * The register/token calls go through the dev vite proxy at /hydra
 * (same-origin, so no CORS); the login redirect itself is a top-level
 * navigation to the real issuer. Packaged builds need the app origin on the
 * OAuth front's CORS allow-list, or the exchange moved to the Electron main
 * process.
 */
import {
  getAgentSession,
  getAgentToken,
  setAgentSession,
  setAgentToken,
  takeAgentCredentials,
  decodeAgentSession,
  decodeAgentToken,
} from './agent'
import { encryptString, decryptString } from './secureStorage'
import { store } from '../store'

export const HYDRA_ISSUER = import.meta.env.VITE_HYDRA_ISSUER_URL || 'https://login.dev.remote.it'
export const MCP_AUDIENCE = import.meta.env.VITE_MCP_AUDIENCE || 'https://mcp.beta.remote.it/mcp'
const SCOPE = 'openid offline email device:read device:write device:connect device:execute'
const LIFESPAN = '30m' // access-token TTL override, verified accepted via DCR

// OAuth fetches (DCR register, token exchange, revoke) always use the
// same-origin /hydra path: the vite proxy serves it in dev, and the Amplify
// rewrite rule serves it on deployed previews (login.dev.remote.it does not
// answer CORS preflights, so direct browser calls are blocked). The login
// redirect is a top-level navigation to the issuer and needs neither.
const OAUTH_API = '/hydra'

const CLIENT_KEY = 'agentOauthClient'
const FLOW_KEY = 'agentOauthFlow'

// Captured synchronously at module-evaluation time: the app's Cognito side
// (Amplify, configured with an oauth block) installs a URL listener that
// consumes and strips ?code/state params for ITS authorization-code flow.
// Our Hydra callback uses the same param names on the same origin, so we must
// grab them before Amplify boots — and only claim them when this tab actually
// started an agent sign-in (flow state present), so a genuine Cognito
// callback is left untouched.
// The callback is claimed only when its `state` matches the flow this tab
// started — a Cognito callback (same origin, same param names) never matches,
// so even a stale flow key left by an abandoned agent sign-in can't hijack it.
const bootParams = new URLSearchParams(window.location.search)
// The flow record keeps `state` readable (it is public — it rides the URL)
// so this synchronous gate can run before Amplify boots; the verifier and
// client id live encrypted in `data` and are only decrypted in the handler.
type StoredFlow = { state?: string; data?: string }
let bootFlow: StoredFlow | null = null
try {
  bootFlow = JSON.parse(window.sessionStorage.getItem(FLOW_KEY) || 'null')
} catch {}
const isAgentCallback =
  !!bootFlow?.state && bootParams.get('state') === bootFlow.state && (bootParams.has('code') || bootParams.has('error'))
if (isAgentCallback) {
  // Strip immediately: hides the single-use code from Amplify's listener and
  // from any reload. The hash route is preserved.
  window.history.replaceState({}, '', window.location.pathname + window.location.hash)
}

const b64url = (bytes: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const randomString = (length: number): string => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return b64url(bytes)
}

const sha256 = async (value: string): Promise<string> =>
  b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))

// The redirect must land somewhere this SPA is served; the app uses hash
// routing, so the root URL with a ?code query never collides with a route.
const redirectUri = (): string => `${window.location.origin}/`

type StoredClient = { client_id: string; key: string }

// One public client per (issuer, origin, scope, audience) — the cache key
// busts when the requested grant changes, like the demo SPA.
/* Effective audience for agent tokens: the Test UI override wins (Test
   Settings → Override agent service) so tokens match the deployment the
   tester pointed the chat at; changing it busts the client cache below. */
const mcpAudience = (): string => {
  const { switchAgent, mcpAudience: override } = store.getState().ui.apis
  return (switchAgent && override?.trim()) || MCP_AUDIENCE
}

const clientCacheKey = (): string => `${HYDRA_ISSUER}|${window.location.origin}|${SCOPE}|${mcpAudience()}`

async function ensureClient(): Promise<string> {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CLIENT_KEY) || 'null') as StoredClient | null
    if (cached?.client_id && cached.key === clientCacheKey()) return cached.client_id
  } catch {}

  const response = await fetch(`${OAUTH_API}/oauth2/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'remote.it desktop agent chat',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      redirect_uris: [redirectUri()],
      scope: SCOPE,
      token_endpoint_auth_method: 'none',
      authorization_code_grant_access_token_lifespan: LIFESPAN,
      refresh_token_grant_access_token_lifespan: LIFESPAN,
    }),
  })
  if (!response.ok) throw new Error(`Agent sign-in registration failed (${response.status}): ${await response.text()}`)
  const { client_id } = (await response.json()) as { client_id: string }
  window.localStorage.setItem(CLIENT_KEY, JSON.stringify({ client_id, key: clientCacheKey() }))
  return client_id
}

/* Token-endpoint rejection with the HTTP status attached, so callers can
   distinguish a definitive denial from a transient failure structurally
   instead of parsing the message */
class TokenRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function tokenRequest(params: Record<string, string>): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
}> {
  const response = await fetch(`${OAUTH_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  const text = await response.text()
  if (!response.ok) throw new TokenRequestError(response.status, `Agent token exchange failed (${response.status}): ${text}`)
  return JSON.parse(text)
}

async function storeTokens(
  clientId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number }
) {
  await setAgentToken(tokens.access_token)
  await setAgentSession({
    refresh_token: tokens.refresh_token || (await getAgentSession())?.refresh_token || '',
    // Missing expires_in falls back to the requested LIFESPAN — an expires_at
    // of "now" would make every subsequent call fire a refresh grant
    expires_at: Date.now() + (tokens.expires_in ?? 1800) * 1000,
    client_id: clientId,
  })
}

/* Kick off the sign-in: registers the client if needed, then navigates the
   whole window to the Hydra login page. The app reloads on return. */
export async function startAgentSignIn(): Promise<void> {
  const clientId = await ensureClient()
  const verifier = randomString(32)
  const state = randomString(16)
  // The PKCE verifier (and client id) are encrypted at rest; only `state`
  // stays plaintext for the synchronous boot-time callback gate
  const data = await encryptString(JSON.stringify({ verifier, clientId }))
  window.sessionStorage.setItem(FLOW_KEY, JSON.stringify({ state, data }))

  const auth = new URL(`${HYDRA_ISSUER}/oauth2/auth`)
  auth.searchParams.set('response_type', 'code')
  auth.searchParams.set('client_id', clientId)
  auth.searchParams.set('redirect_uri', redirectUri())
  auth.searchParams.set('scope', SCOPE)
  auth.searchParams.set('state', state)
  auth.searchParams.set('code_challenge', await sha256(verifier))
  auth.searchParams.set('code_challenge_method', 'S256')
  // RFC 8707: binds the access token's audience to the MCP resource
  auth.searchParams.set('resource', mcpAudience())
  window.location.assign(auth.toString())
}

let callbackConsumed = false

/* Complete the flow after the redirect back. Call once on app boot; returns
   null when this page load carries no agent sign-in response. Reads the
   module-scope capture, not the live URL (already stripped above). */
export async function handleAgentSignInCallback(): Promise<{ ok: boolean; error?: string } | null> {
  if (!isAgentCallback || callbackConsumed) return null
  callbackConsumed = true
  const code = bootParams.get('code')
  const error = bootParams.get('error')

  // Consume the flow before any branch can return — a leftover key would stay
  // armed and claim a later, unrelated OAuth callback on this origin. The
  // state match is already guaranteed by the isAgentCallback gate above.
  const stored = bootFlow
  window.sessionStorage.removeItem(FLOW_KEY)

  if (error) {
    // A client cached from before a scope/resource change can be rejected at
    // authorize (e.g. invalid_target); drop it so the next attempt re-registers.
    window.localStorage.removeItem(CLIENT_KEY)
    return { ok: false, error: `${error}: ${bootParams.get('error_description') || ''}` }
  }

  let flow: { verifier: string; clientId: string } | null = null
  try {
    const json = stored?.data ? await decryptString(stored.data) : null
    flow = json ? JSON.parse(json) : null
  } catch {}
  if (!flow) return { ok: false, error: 'Sign-in expired — try again.' }

  try {
    const tokens = await tokenRequest({
      grant_type: 'authorization_code',
      code: code!,
      redirect_uri: redirectUri(),
      client_id: flow.clientId,
      code_verifier: flow.verifier,
    })
    await storeTokens(flow.clientId, tokens)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

/* Sign the agent out alongside the app: drop the local credentials, then
   best-effort revoke the refresh token so Hydra's otherwise never-expiring
   refresh chain dies server-side too. The DCR client registration is kept —
   it belongs to the app origin, not the user. */
export async function agentSignOut(): Promise<void> {
  // Clear synchronously first — a signOut-triggered reload must never find
  // credentials still stored; the raw values are decoded after for revoke
  const raw = takeAgentCredentials()
  const session = await decodeAgentSession(raw.session)
  const token = await decodeAgentToken(raw.token)
  const revoke = (value: string, clientId: string) =>
    fetch(`${OAUTH_API}/oauth2/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: value, client_id: clientId }),
    })
  try {
    if (session?.refresh_token) await revoke(session.refresh_token, session.client_id)
    else if (token && session?.client_id) await revoke(token, session.client_id)
  } catch {
    // Offline or proxy unavailable — locals are already cleared; the access
    // token dies at its 30m TTL.
  }
}

let refreshPromise: Promise<void> | null = null

/* Refresh the access token when it is missing or close to expiry. Silent
   no-op when there is nothing to refresh (e.g. a hand-pasted token).
   Single-flight: concurrent callers (panel-open health check racing a send)
   share one request — presenting a rotating refresh token twice trips
   Hydra's reuse detection and revokes the whole chain. */
export async function ensureFreshAgentToken(): Promise<void> {
  if (refreshPromise) return refreshPromise
  const session = await getAgentSession()
  if (!session?.refresh_token) return
  const fresh = (await getAgentToken()) && Date.now() < session.expires_at - 60_000
  if (fresh) return
  // Re-check after the async reads above: another caller may have started a
  // refresh while we were reading — join it instead of racing a second grant
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const tokens = await tokenRequest({
        grant_type: 'refresh_token',
        refresh_token: session.refresh_token,
        client_id: session.client_id,
      })
      storeTokens(session.client_id, tokens)
    } catch (error) {
      // Only a definitive rejection means the chain is dead (revoked or
      // reuse-detection) — then clear so the UI falls back to the sign-in
      // prompt. A transient network/proxy failure keeps the session so a
      // later call can retry instead of forcing a full re-sign-in.
      if (error instanceof TokenRequestError && [400, 401, 403].includes(error.status)) setAgentSession(null)
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}
