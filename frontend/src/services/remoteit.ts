import { oidcAccessToken } from './oidc'
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
