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

// A web service by its name: https on 443, which the device ends under the stage's certificate and forwards to the
// service on its own port (presence-server docs/subnet-https.md) — so never the service's port.
export const subnetWebURL = (name: string) => `https://${name}`

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

// The device a probe of this page's was seen by — this machine's — when the person manages it (graphql subnetProbe's
// deviceId): what a local port is opened on (services/localPorts). null: no daemon here, or an API without the field.
export async function beaconDevice(): Promise<string | null> {
  if (Date.now() < absentUntil) return null
  const token = await seenProbe()
  if (!token) return null
  const response = await graphQLBasicRequest(
    'query SubnetProbeDevice($token: String!) { subnetProbe(token: $token) { seen deviceId } }',
    { token }
  )
  const id = response !== 'ERROR' ? response.data?.data?.subnetProbe?.deviceId : undefined
  return typeof id === 'string' ? id : null
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

/* Signing in on this machine (graphql-api docs/PROXY-GROUPS.md §15, "The portal and an installed daemon"). A name is
   the machine's but a connection is the OS account's: graphql names a service only where the daemon here would serve
   this person, and otherwise says whether signing in on it would (signInNeeded) — then the page connects with its own
   client and offers the app's own sign-in: signInLink, remoteit-<stage>://sign-in, which opens the installed app's
   sign-in and carries nothing. Opened on the person's click alone; the app signs in with Permitteer itself. No link:
   an older package, whose menu is where to sign in. In the Desktop app none of this: the name API answers for the
   person signed in on the app's own account, and the app signs in itself. */
export type LocalSignIn = { link?: string }

let signInKept: { at: number; answer: Promise<LocalSignIn | null> } | undefined

export function localSignIn(): Promise<LocalSignIn | null> {
  if (browser.isElectron || Date.now() < absentUntil) return Promise.resolve(null)
  if (signInKept && Date.now() - signInKept.at < KEPT_MS) return signInKept.answer
  signInKept = { at: Date.now(), answer: askSignIn() }
  return signInKept.answer
}

async function askSignIn(): Promise<LocalSignIn | null> {
  if (!(await signInServed())) return null
  const token = await seenProbe()
  if (!token) return null
  const response = await graphQLBasicRequest(
    'query SubnetProbeSignIn($token: String!) { subnetProbe(token: $token) { seen signInNeeded signInLink } }',
    { token },
    true
  )
  const answer = response !== 'ERROR' ? response.data?.data?.subnetProbe : undefined
  if (!answer?.signInNeeded) return null
  const link = signInLinkOf(answer.signInLink)
  return link ? { link } : {}
}

// Only a link of the app's own shape is ever opened from an answer: remoteit-<stage>://sign-in, nothing in it.
export const signInLinkOf = (link: unknown): string | undefined =>
  typeof link === 'string' && /^remoteit-[a-z0-9][a-z0-9-]{0,30}:\/\/sign-in$/.test(link) ? link : undefined

// Opens the app's sign-in: the browser asks the person to open the app, which signs in itself.
export function openSignInLink(link: string) {
  window.location.href = link
}

/* Whether the API says signInNeeded: the portal is released apart from graphql, and a field it lacks would fail the
   whole query — so read from the schema once; a failed read is read again next time. */
let signInFields: Promise<boolean> | undefined

function signInServed(): Promise<boolean> {
  signInFields ??= graphQLBasicRequest(
    'query SubnetProbeFields { answer: __type(name: "SubnetProbeAnswer") { fields { name } } }',
    {},
    true
  ).then(response => {
    if (response === 'ERROR') {
      signInFields = undefined
      return false
    }
    const fields: { name: string }[] = response.data?.data?.answer?.fields || []
    return fields.some(f => f.name === 'signInNeeded') && fields.some(f => f.name === 'signInLink')
  })
  return signInFields
}

// Every answer of the daemon here forgotten and asked again — after a sign-in on this machine, whose next answer names
// the service and hands Connect off.
const forgotten = new Set<() => void>()

export function forgetLocal() {
  kept.clear()
  signInKept = undefined
  forgotten.forEach(listener => listener())
}

export function onLocalForgotten(listener: () => void): () => void {
  forgotten.add(listener)
  return () => {
    forgotten.delete(listener)
  }
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
