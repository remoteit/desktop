import { SIGN_IN_ISSUERS } from '@common/constants'

/** The clock of the sign-in server `url` is on, in epoch ms, read from the Date of its token endpoint;
 *  undefined for any other server, when it can't be reached, or when it sends none. */
export default async function serverTime(url: string, timeoutMs = 5000): Promise<number | undefined> {
  let origin: string
  try {
    origin = new URL(url).origin
  } catch {
    return undefined
  }
  const issuer = Object.values(SIGN_IN_ISSUERS).find(known => known === origin)
  if (!issuer) return undefined
  try {
    // A fixed path on a known server: the caller picks which issuer, never what is fetched, and no redirect is
    // followed. The token endpoint, because the issuer root once came back cached with a Date hours old.
    const response = await fetch(`${issuer}/token`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const date = Date.parse(response.headers.get('date') ?? '')
    return Number.isNaN(date) ? undefined : date
  } catch {
    return undefined
  }
}
