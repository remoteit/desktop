import { oidcAccessToken } from './oidc'

/**
 * The single token choke point every authenticated call flows through. The token is a
 * Permitteer access token minted by the BACKEND process (which owns refresh + storage);
 * this keeps the old contract — resolves to 'Bearer …' or '' (callers no-op on empty).
 */
export async function getToken(): Promise<string> {
  const token = await oidcAccessToken()
  return token ? 'Bearer ' + token : ''
}

export async function hasCredentials() {
  return !!(await oidcAccessToken())
}
