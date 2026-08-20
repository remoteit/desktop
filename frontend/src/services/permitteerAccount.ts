/* Direct-to-AS Connected Apps (desktop-login plan D6): the authorization server's own
 * account API is the source of truth for what this person has authorized — the grant is
 * the unit, and revoking it kills every refresh token minted from it. No graphql gateway:
 * the deleted Hydra façade is not coming back, and the AS view already carries names,
 * logos, per-action detail and honest revocation reach. */
import { oidcAccessToken } from './oidc'
import { OAUTH_ISSUER } from '../constants'

const RESOURCE = `${OAUTH_ISSUER}/account/api`

export type AccountApiResult<T = any> = { status: number; body?: T }

async function call<T = any>(path: string, init: RequestInit = {}): Promise<AccountApiResult<T>> {
  const token = await oidcAccessToken(RESOURCE)
  if (!token) return { status: 401 }
  const response = await fetch(`${RESOURCE}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) },
  })
  let body: T | undefined
  try {
    body = (await response.json()) as T
  } catch {
    body = undefined
  }
  return { status: response.status, body }
}

/** The person's connected apps — the AS account API's own view rows, unreshaped. */
export async function accountApps(): Promise<AccountApiResult<{ items: IAuthorizedAgent[] }>> {
  return await call('/apps')
}

/** Revoke one grant. Instant at the AS — the grant dies and every refresh token with it. */
export async function revokeAccountApp(grantId: string): Promise<AccountApiResult> {
  return await call(`/apps/${encodeURIComponent(grantId)}`, { method: 'DELETE' })
}
