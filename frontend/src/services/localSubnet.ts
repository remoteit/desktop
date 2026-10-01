import browser from './browser'
import { graphQLBasicRequest } from './graphQL'

/* Whether a name in device subnets works on this machine (presence-server docs/subnet-names-on-demand.md, "the
   portal"): Connect then hands out the name instead of starting a connection.

   In a browser, the DNS beacon: a page cannot look a name up, nor reach a private address without a browser setting,
   but it can make its machine look a name up. graphql makes a one-time probe name; loading it sends the lookup to this
   machine's device daemon, which asks graphql over its own session — and graphql notes which device saw it. Then
   graphql says, for each service, whether that device reaches it. Only the person who made the probe can read it.

   In the Desktop app, connectd's name API on the loopback address, which a window there may reach: the subnet
   resolver's own answer, with the address.

   No daemon here, or one that cannot say: null, and Connect goes through the proxy as it always has. */

const NAME_API = 'http://127.0.0.1:29180/v1/name'
const TIMEOUT_MS = 1500
const POLL_MS = 200
const KEPT_MS = 15_000
const ABSENT_MS = 60_000
// A probe stays readable for two minutes (graphql subnet-probe.ts); it is used for one.
const PROBE_KEPT_MS = 60_000

export type LocalSubnetName = { name: string; address?: string }

const kept = new Map<string, { at: number; answer: Promise<LocalSubnetName | null> }>()
let absentUntil = 0

// `id` is the service's, or the device's for the device itself; `name` its name in device subnets.
export function localSubnetName(id: string, name: string): Promise<LocalSubnetName | null> {
  const now = Date.now()
  if (now < absentUntil) return Promise.resolve(null)
  const held = kept.get(id)
  if (held && now - held.at < KEPT_MS) return held.answer
  const answer = browser.isElectron ? askDaemon(name) : askBeacon(id)
  kept.set(id, { at: now, answer })
  return answer
}

// The beacon: this page's probe (one for every service asked about), then the name, when the device that saw it
// reaches the service.
async function askBeacon(id: string): Promise<LocalSubnetName | null> {
  const token = await seenProbe()
  if (!token) return null
  const response = await graphQLBasicRequest(
    'query SubnetProbe($token: String!, $id: String) { subnetProbe(token: $token, serviceId: $id) { seen name } }',
    { token, id }
  )
  const name = response !== 'ERROR' ? response.data?.data?.subnetProbe?.name : undefined
  return typeof name === 'string' ? { name } : null
}

let probe: { at: number; token: Promise<string | null> } | undefined

function seenProbe(): Promise<string | null> {
  if (!probe || Date.now() - probe.at > PROBE_KEPT_MS) probe = { at: Date.now(), token: sendProbe() }
  return probe.token
}

// Makes a probe, has this machine look it up, and waits for a device here to have seen it: its token, or null when
// none has in time — no daemon here.
async function sendProbe(): Promise<string | null> {
  const made = await graphQLBasicRequest('mutation CreateSubnetProbe { createSubnetProbe { token name } }')
  const { token, name } = made !== 'ERROR' ? made.data?.data?.createSubnetProbe || {} : {}
  if (!token || !name) return null
  // The request fails — the name is no one's — and the lookup is what counts.
  new Image().src = `https://${name}/`
  for (const until = Date.now() + TIMEOUT_MS; Date.now() < until; ) {
    await new Promise(resolve => setTimeout(resolve, POLL_MS))
    const answer = await graphQLBasicRequest(
      'query SubnetProbeSeen($token: String!) { subnetProbe(token: $token) { seen } }',
      { token }
    )
    if (answer !== 'ERROR' && answer.data?.data?.subnetProbe?.seen) return token
  }
  absentUntil = Date.now() + ABSENT_MS
  return null
}

async function askDaemon(name: string): Promise<LocalSubnetName | null> {
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
    // Nothing listening, or too slow: no daemon to ask for now.
    absentUntil = Date.now() + ABSENT_MS
    return null
  } finally {
    clearTimeout(timer)
  }
}
