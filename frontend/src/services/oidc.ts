import { IP_PRIVATE } from '@common/constants'
import { PORT } from '../constants'

/**
 * The renderer's half of the OIDC lane (permitteer docs/remoteit-desktop-login.md).
 *
 * The BACKEND process owns the flow — browser launch, code capture, PKCE, rotating
 * refresh, keychain storage. This module only talks to its local HTTP control lane and
 * caches the short-lived access token in memory. It rides HTTP (not the socket) because
 * the socket exists only AFTER sign-in: its handshake needs the authhash that signing
 * in produces.
 */

export type OidcClaims = {
  sub?: string
  email?: string
  email_verified?: boolean
  amr?: string[]
  [claim: string]: any
}

export type OidcState = { configured: boolean; signedIn: boolean; claims: OidcClaims | null }

let cached: { token: string; exp: number } | undefined

// Same dev/packaged split Controller.init uses: the dev server runs on :3003 (vite
// answers on localhost AND 127.0.0.1 — match both), the packaged renderer is served BY
// the backend so relative URLs land home.
const base = () => {
  const { host } = window.location
  return /^(localhost|127\.0\.0\.1):3003$/.test(host) ? `http://${IP_PRIVATE}:${PORT}` : ''
}

const json = async (path: string, init?: RequestInit) => {
  const response = await fetch(base() + path, init)
  if (!response.ok) throw Object.assign(new Error(`oidc lane ${response.status}`), { status: response.status })
  return response.json()
}

export const oidcState = (): Promise<OidcState> => json('/oidc/state')

export const oidcStart = (): Promise<void> => json('/oidc/start', { method: 'POST' })

export const oidcSignOut = (): Promise<void> => json('/oidc/sign-out', { method: 'POST' })

/** Current access token for the graphql audience, cached to just short of its expiry. */
export async function oidcAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.exp - now > 30) return cached.token
  try {
    cached = await json('/oidc/token', { method: 'POST' })
    return cached?.token ?? ''
  } catch (error: any) {
    if (error?.status !== 401) console.error('OIDC TOKEN FETCH FAILED', error)
    cached = undefined
    return ''
  }
}

/** Drop the renderer cache (a 401 from the API means this token is no longer good). */
export function invalidateOidcToken() {
  cached = undefined
}

/** Poll for sign-in completion after a flow starts (the browser round-trip is out of band). */
export async function waitForSignIn(timeoutMs = 5 * 60 * 1000): Promise<OidcState> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const state = await oidcState().catch((): OidcState => ({ configured: true, signedIn: false, claims: null }))
    if (state.signedIn) return state
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  throw new Error('Timed out waiting for the browser sign-in.')
}
