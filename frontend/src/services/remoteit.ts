import axios, { AxiosResponse } from 'axios'
import { oidcAccessToken, oidcAuthorized, DpopAnswer } from './oidc'
import { getApiResource, getTestHeader } from '../helpers/apiHelper'

/**
 * The in-band bearer for liveness probes and the events subscribe envelope (apiRequest is
 * what a graphql/REST call goes through). The token's audience FOLLOWS the switcher (D10, permitteer docs/remoteit-desktop-login.md Phase 4c):
 * pointing the app at another stage mints for that stage instead of replaying a
 * wrong-audience token into ambient 403s. Resolves to 'Bearer …' or '' (callers no-op on
 * empty). `sub`: the sign-in to mint for; absent, the page's own person.
 */
export async function getToken(sub?: string): Promise<string> {
  const token = await oidcAccessToken(getApiResource(), sub)
  return token ? 'Bearer ' + token : ''
}

/** The status and headers of an axios outcome: a response, or the response a rejection carries. */
const axiosAnswer = (outcome: unknown): DpopAnswer | undefined => {
  const response = axios.isAxiosError(outcome) ? outcome.response : (outcome as AxiosResponse | undefined)
  if (!response?.status) return undefined
  return {
    status: response.status,
    header: name => {
      const value = response.headers?.[name]
      return typeof value === 'string' ? value : undefined
    },
  }
}

/** A graphql/REST call made by `send`, which gets the scheme-aware auth headers ({} when signed
 * out). The container ENFORCES the DPoP binding (permitteer docs): a bound token must arrive as
 * `DPoP <token>` with a proof over this exact method+URL, and presenting it as Bearer is refused.
 * Because the proof is per request, a server asking for a DPoP nonce gets the call again from
 * `send`, with a new proof. getToken() stays for liveness probes and the events subscribe envelope
 * (in-band bearer, exempt by the frozen wire contract).
 * `sub` names the sign-in whose token the call carries — the one that serves the account it asks about
 * (selectors/signIns requestSignIn); absent, the page's own person.
 */
export function apiAuthorized<T>(
  method: string,
  url: string,
  send: (auth: Record<string, string>) => Promise<T>,
  sub?: string
): Promise<T> {
  return oidcAuthorized(method, url, getApiResource(), send, axiosAnswer, sub)
}

/** apiAuthorized for a call that carries the Test Settings header too: `send` gets the headers, or
 *  undefined when there is no token to carry, so it can skip the call. */
export function apiRequest<T>(
  method: string,
  url: string,
  send: (headers: Record<string, string> | undefined) => Promise<T>,
  sub?: string
): Promise<T> {
  return apiAuthorized(method, url, auth => send(auth.authorization ? { ...auth, ...getTestHeader() } : undefined), sub)
}
