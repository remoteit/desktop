/* Direct-to-AS Connected Apps (desktop-login plan D6): the authorization server's own
 * account API is the source of truth for what this person has authorized — the grant is
 * the unit, and revoking it kills every refresh token minted from it. No graphql gateway:
 * the deleted Hydra façade is not coming back, and the AS view already carries names,
 * logos, per-action detail and honest revocation reach. */
import { oidcAuthHeaders } from './oidc'
import { OAUTH_ISSUER } from '../constants'

const RESOURCE = `${OAUTH_ISSUER}/account/api`

export type AccountApiResult<T = any> = { status: number; body?: T }

/** The legal token targets for THIS client — the AS's allowlist joined to registry names
 *  (D10). The stage picker and the mint-time guardrail read the SAME source, so they can
 *  never disagree; adding a stage to the tf allowlist puts it here on the next fetch.
 *
 *  Returns the status alongside the list: collapsing every failure into `[]` made a
 *  refused token and a genuinely empty allowlist render identically (an empty picker,
 *  no error), which is exactly how this went unnoticed. */
export async function bindableResources(): Promise<{ status: number; resources: Array<{ identifier: string; name: string }> }> {
  const r = await call<Array<{ identifier: string; name: string }>>('/bindable-resources')
  return { status: r.status, resources: r.status === 200 && Array.isArray(r.body) ? r.body : [] }
}

async function call<T = any>(path: string, init: RequestInit = {}): Promise<AccountApiResult<T>> {
  const url = `${RESOURCE}${path}`
  // Scheme-aware (plan D9): a DPoP-bound token presents as `DPoP` + an ath proof; an
  // unbound one stays Bearer. The AS decides which we hold.
  const auth = await oidcAuthHeaders(init.method ?? 'GET', url, RESOURCE)
  if (!auth.authorization) return { status: 401 }
  const response = await fetch(url, {
    ...init,
    headers: { ...auth, ...(init.headers || {}) },
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

/** Trim or re-enable a grant's permissions — the console editor's own PATCH: `keep` names
 * the action keys that stay enabled (unlisted ceiling actions disable, stay listed, and
 * can be re-enabled later), `keepScope` the sign-in scopes that survive. */
export async function updateAccountApp(
  grantId: string,
  keep: string[],
  keepScope: string[],
  reach?: { all?: boolean; accounts?: string[] }
): Promise<AccountApiResult> {
  return await call(`/apps/${encodeURIComponent(grantId)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ keep, keepScope, ...(reach ? { reach } : {}) }),
  })
}
