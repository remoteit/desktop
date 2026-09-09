import { oidcAccessToken, oidcAuthHeaders } from './oidc'
import { getApiResource } from '../helpers/apiHelper'

/**
 * The single token choke point every authenticated graphql call flows through. The token's
 * audience FOLLOWS the switcher (D10, permitteer docs/remoteit-desktop-login.md Phase 4c):
 * pointing the app at another stage mints for that stage instead of replaying a
 * wrong-audience token into ambient 403s. Resolves to 'Bearer …' or '' (callers no-op on
 * empty).
 */
export async function getToken(): Promise<string> {
  const token = await oidcAccessToken(getApiResource())
  return token ? 'Bearer ' + token : ''
}

export async function hasCredentials() {
  return !!(await oidcAccessToken())
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
