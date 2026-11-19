import { SIGN_IN_ISSUERS } from '@common/constants'

const ASKABLE = new Set<string>(Object.values(SIGN_IN_ISSUERS))

/** A sign-in server's clock in epoch ms, read from its Date header; undefined for any other origin,
 *  when it can't be reached, or when it sends none. */
export default async function serverTime(url: string, timeoutMs = 5000): Promise<number | undefined> {
  let origin: string
  try {
    origin = new URL(url).origin
  } catch {
    return undefined
  }
  if (!ASKABLE.has(origin)) return undefined
  try {
    // Not followed: a redirect is an answer with a Date of its own, and following it could send this request anywhere.
    const response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) })
    const date = Date.parse(response.headers.get('date') ?? '')
    return Number.isNaN(date) ? undefined : date
  } catch {
    return undefined
  }
}
