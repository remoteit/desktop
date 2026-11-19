/** A server's clock in epoch ms, read from its Date header; undefined when it can't be reached or sends none. */
export default async function serverTime(url: string, timeoutMs = 5000): Promise<number | undefined> {
  if (!/^https:\/\//i.test(url)) return undefined
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) })
    const date = Date.parse(response.headers.get('date') ?? '')
    return Number.isNaN(date) ? undefined : date
  } catch {
    return undefined
  }
}
