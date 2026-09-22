import { oidcAccessToken, oidcAuthHeaders } from './oidc'
import { getApiResource, getTestHeader } from '../helpers/apiHelper'

/**
 * The in-band bearer for liveness probes and the events subscribe envelope (apiAuthHeaders is
 * what a graphql/REST call carries). The token's audience FOLLOWS the switcher (D10, permitteer docs/remoteit-desktop-login.md Phase 4c):
 * pointing the app at another stage mints for that stage instead of replaying a
 * wrong-audience token into ambient 403s. Resolves to 'Bearer …' or '' (callers no-op on
 * empty).
 */
export async function getToken(): Promise<string> {
  const token = await oidcAccessToken(getApiResource())
  return token ? 'Bearer ' + token : ''
}

/** Scheme-aware auth headers for a graphql/REST call (permitteer docs — the container now
 * ENFORCES the DPoP binding: a bound token must arrive as `DPoP <token>` with a proof over
 * this exact method+URL, and presenting it as Bearer is refused). Same machinery the account
 * API calls already use (oidcAuthHeaders); resolves to {} when signed out — callers no-op on
 * a missing authorization, exactly as they did on an empty getToken(). getToken() itself
 * stays for liveness probes and the events subscribe envelope (in-band bearer, exempt by the
 * frozen wire contract).
 */
export async function apiAuthHeaders(method: string, url: string): Promise<Record<string, string>> {
  return await oidcAuthHeaders(method, url, getApiResource())
}

/** The headers a REST call carries — the scheme-aware auth plus the Test Settings header — or
 *  undefined when there is no token to carry, so the caller can no-op. */
export async function apiHeaders(method: string, url: string): Promise<Record<string, string> | undefined> {
  const auth = await apiAuthHeaders(method, url)
  if (!auth.authorization) return undefined
  return { ...auth, ...getTestHeader() }
}
