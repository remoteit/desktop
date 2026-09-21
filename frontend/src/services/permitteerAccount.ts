/* Direct-to-AS Connected Apps (desktop-login plan D6): the authorization server's own
 * account API is the source of truth for what this person has authorized — the grant is
 * the unit, and revoking it kills every refresh token minted from it. No graphql gateway:
 * the deleted Hydra façade is not coming back, and the AS view already carries names,
 * logos, per-action detail and honest revocation reach. */
import { oidcResourceRequest, OidcResourceResult } from './oidc'
import { OAUTH_ACCOUNT_RESOURCE } from '../constants'

export type AccountApiResult<T = any> = OidcResourceResult<T>

/** The legal token targets for THIS client — the AS's allowlist joined to registry names
 *  (D10). The stage picker and the mint-time guardrail read the SAME source, so they can
 *  never disagree; adding a stage to the tf allowlist puts it here on the next fetch. */
export async function bindableResources(): Promise<Array<{ identifier: string; name: string }>> {
  const r = await call<Array<{ identifier: string; name: string }>>('/bindable-resources')
  return r.status === 200 && Array.isArray(r.body) ? r.body : []
}

const call = <T = any>(path: string, init: RequestInit = {}) =>
  oidcResourceRequest<T>(OAUTH_ACCOUNT_RESOURCE, path, init)

/** "Sign out everywhere" (permitteer docs/remoteit-desktop-login.md Phase 4e): every session
 *  of the account at the AS — THIS one included — ended in one stroke, each with its refresh
 *  family swept and the resource servers told, and, on a Cognito-bridged stage, the pool's
 *  tokens for the person revoked as well (the legacy apps' sessions). `pool` reports that half:
 *  skipped (no pool on this stage), none, revoked, or failed. The token that makes this call is
 *  dead by the time the answer is read; the caller tears the app down right after. */
export async function signOutEverywhere(): Promise<AccountApiResult<{ ended: number; pool: string }>> {
  return await call('/devices/sign-out-all', { method: 'POST' })
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
