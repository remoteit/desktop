/* Whether a name in device subnets works on this machine (connectd's name API, presence-server
   docs/subnet-names-on-demand.md): a page cannot look a name up itself, so it asks the device daemon installed here,
   on the loopback address. Its answer is the subnet resolver's own — what ssh or a browser here would get — so a name
   is handed out only where it works. No daemon here, or one that cannot say: null, and Connect goes through the proxy
   as it always has. Answers are kept a few seconds; a daemon that is not there is not asked again for a while. */

const NAME_API = 'http://127.0.0.1:29180/v1/name'
const TIMEOUT_MS = 1500
const KEPT_MS = 15_000
const ABSENT_MS = 60_000

export type LocalSubnetName = { name: string; address: string }

const kept = new Map<string, { at: number; answer: Promise<LocalSubnetName | null> }>()
let absentUntil = 0

export function localSubnetName(name: string): Promise<LocalSubnetName | null> {
  const now = Date.now()
  if (now < absentUntil) return Promise.resolve(null)
  const held = kept.get(name)
  if (held && now - held.at < KEPT_MS) return held.answer
  const answer = ask(name)
  kept.set(name, { at: now, answer })
  return answer
}

async function ask(name: string): Promise<LocalSubnetName | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${NAME_API}?name=${encodeURIComponent(name)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) return null
    const body = await response.json()
    return typeof body?.address === 'string' ? { name: body.name || name, address: body.address } : null
  } catch {
    // Nothing listening, refused by the browser, or too slow: no daemon to ask for now.
    absentUntil = Date.now() + ABSENT_MS
    return null
  } finally {
    clearTimeout(timer)
  }
}
