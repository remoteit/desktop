import browser from './browser'
import { graphQLBasicRequest } from './graphQL'
import { requestSignInNow } from '../selectors/signIns'
import { accountCache, followAccountsDropped } from './accountCaches'
import { within } from '../helpers/within'

/* Whether a name in device subnets works on this machine (presence-server docs/subnet-names-on-demand.md, "the
   portal"): Connect then hands out the name instead of starting a connection. Two questions, kept apart.

   (a) IS AN AGENT HERE. In a browser, the DNS beacon: a page cannot look a name up, nor reach a private address without
   a browser setting, but it can make its machine look a name up. graphql makes a one-time probe name; loading it sends
   the lookup to this machine's device daemon, which asks graphql over its own session — and graphql notes which device
   saw it. In the Desktop app, connectd's name API on the loopback address, which a window there may reach. It is the
   machine's answer, whoever the probe was made as, and one for every page: asked as the page loads (followLocalAgent),
   shown as it last was while it is asked again, and nobody waits on it but for the first. A request that failed is no
   answer: it is not known then, and may be asked again.

   (b) DOES IT REACH THIS SERVICE. Asked for each service: with the probe's token, which graphql answers for the device
   that saw it — or of the name API, which says itself. Only the person who made a probe can read it — so with several
   sign-ins in use there is a token for each that is asked about a service: made, and read, as the sign-in that serves
   the service. What names no service (the machine's device, signing in on it) is the page's own person's.

   No daemon here, or one that cannot say: null, and Connect goes through the proxy as it always has. */

const NAME_API = 'http://127.0.0.1:29180/v1/name'
const TIMEOUT_MS = 1500
// When a probe is asked after, from when it was sent: no more often than what it takes to be seen calls for. One asked
// again where no agent was is hurried for no one, and asked after less.
const POLLS_MS = [200, 600, 1500]
const QUIET_POLLS_MS = [600, 1500]
const KEPT_MS = 15_000
// A probe stays readable for two minutes (graphql subnet-probe.ts); it is used for one.
const PROBE_KEPT_MS = 60_000
// Asked again no more often, as each sign-in — and where no agent is found again and again, less and less.
const RECHECK_MS = 60_000
const QUIET_RECHECK_MS = [60_000, 120_000, 300_000]
// What is asked for outright — a sign-in on this machine, which is asked after every few seconds — no more often either.
const ASKED_MS = 10_000
// The first answer is waited on no longer; a probe not done by then is not waited on by the next.
const AGENT_WAIT_MS = 4_000

export type LocalSubnetName = { name: string; address?: string }

export const subnetWebURL = (name: string, port: number) =>
  port === 443 ? `https://${name}` : `https://${name}:${port}`

// The port a web service's name is opened at.
export const subnetWebPort = (port: number | undefined, defaultHttp?: boolean): number =>
  port === 80 && defaultHttp ? 443 : port || 443

// ---- (a) is an agent here ----

// The last answer, and when: undefined until there is one.
let agent: { here?: boolean; at: number; misses: number } = { at: 0, misses: 0 }
const tokens = new Map<string, { token: string; at: number }>()
const probing = new Map<string, { at: number; probe: Promise<boolean | undefined> }>()
const attempted = new Map<string, number>()
// Who is told when the answer changes.
const changes = new Set<() => void>()

/** Whether an agent is known to be here: none may be, or it is not known. */
export const localPresent = (): boolean => agent.here === true

function found(here: boolean) {
  const changed = agent.here !== here
  agent = { here, at: Date.now(), misses: here ? 0 : agent.misses + 1 }
  if (!here) {
    tokens.clear()
    kept.clear()
    last.clear()
    signInKept = undefined
    // Each sign-in's is made anew once one is here again.
    attempted.forEach((_at, sub) => sub !== whoSays() && attempted.delete(sub))
  }
  if (!changed) return
  changes.forEach(listener => listener())
  forgotten.forEach(listener => listener())
}

// What says whether an agent is here: in the Desktop app the name API, whose word it is; else the page's own person's
// probe, or any other's.
const LOOPBACK = 'loopback'
const whoSays = () => (browser.isElectron ? LOOPBACK : '')

// Asks now, one at a time for each — a sign-in's probe, or the name API: whether an agent here answered, undefined where
// that is not known.
function probe(sub: string): Promise<boolean | undefined> {
  const now = Date.now()
  const under = probing.get(sub)
  if (under && now - under.at < AGENT_WAIT_MS) return under.probe
  // A hidden page sends none, and that is no try of it: it is asked once the page is shown.
  if (document.hidden) return Promise.resolve(undefined)
  attempted.set(sub, now)
  const asked = {
    at: now,
    probe: (sub === LOOPBACK ? askName('') : sendProbe(sub))
      .catch(() => undefined)
      .then(answer => {
        const here = answer === undefined ? undefined : !!answer
        // One given up on — the person signed out, another made since — says nothing.
        if (probing.get(sub) !== asked) return undefined
        probing.delete(sub)
        // Given up as the page was hidden: no try of it either.
        if (here === undefined && document.hidden) attempted.delete(sub)
        if (typeof answer === 'object') tokens.set(sub, answer)
        if (here !== undefined && (sub === LOOPBACK || !browser.isElectron)) found(here)
        return here
      }),
  }
  probing.set(sub, asked)
  return asked.probe
}

const since = (sub: string) => Date.now() - (attempted.get(sub) ?? -Infinity)

/* Asks again behind what is shown. `why`: the page was looked at again, at the pace kept for it; a service was opened
   with an answer over a minute old; or it was asked for outright. */
function recheck(why: 'looked' | 'opened' | 'asked' | 'online') {
  const who = whoSays()
  if (why === 'online') attempted.delete(who)
  const pace =
    why === 'looked' && agent.here === false
      ? QUIET_RECHECK_MS[Math.min(agent.misses, QUIET_RECHECK_MS.length) - 1]
      : why === 'asked'
      ? ASKED_MS
      : RECHECK_MS
  if (since(who) >= pace) void probe(who)
}

/** Follows whether an agent is here while the portal is used: asked now, and again — behind what is shown — when the page
 *  is looked at again, the network comes back, or the sign-ins change. Called once signed in, where device sessions are
 *  on; what it gives ends it, and forgets. */
export function followLocalAgent(): () => void {
  const looked = () => {
    if (!document.hidden) recheck('looked')
  }
  const online = () => recheck('online')
  const changed = () => recheck('looked')
  window.addEventListener('focus', looked)
  document.addEventListener('visibilitychange', looked)
  window.addEventListener('online', online)
  const off = followAccountsDropped(changed)
  recheck('looked')
  return () => {
    window.removeEventListener('focus', looked)
    document.removeEventListener('visibilitychange', looked)
    window.removeEventListener('online', online)
    off()
    agent = { at: 0, misses: 0 }
    for (const map of [tokens, probing, attempted, kept, last]) map.clear()
    signInKept = undefined
  }
}

// A sign-in's token, to ask graphql what the device that saw its probe reaches: null where no agent is here, undefined
// where that is not known. Made anew once it has been used its minute — which is quick where an agent is here.
async function tokenOf(sub: string): Promise<string | null | undefined> {
  if (agent.here === false) {
    if (Date.now() - agent.at >= RECHECK_MS) recheck('opened')
    return null
  }
  const held = tokens.get(sub)
  if (held && Date.now() - held.at < PROBE_KEPT_MS) return held.token
  if (!probing.has(sub) && since(sub) < RECHECK_MS) return undefined
  const here = await within(probe(sub), AGENT_WAIT_MS)
  return here === undefined ? undefined : here ? tokens.get(sub)?.token : null
}

// Makes a probe, has this machine look it up, and waits for a device here to have seen it: its token then.
async function sendProbe(sub: string): Promise<{ token: string; at: number } | false | undefined> {
  const polls = agent.here === false ? QUIET_POLLS_MS : POLLS_MS
  const made = await ask(sub, 'mutation CreateSubnetProbe { createSubnetProbe { token name } }')
  const { token, name } = made !== 'ERROR' ? made.data?.data?.createSubnetProbe || {} : {}
  if (!token || !name) return undefined
  const sent = Date.now()
  // The request fails — the name is no one's — and the lookup is what counts.
  new Image().src = `https://${name}/`
  let failed = false
  for (const at of polls) {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, sent + at - Date.now())))
    if (document.hidden) return undefined
    const answer = await ask(sub, 'query SubnetProbeSeen($token: String!) { subnetProbe(token: $token) { seen } }', {
      token,
    })
    failed = answer === 'ERROR'
    if (answer !== 'ERROR' && answer.data?.data?.subnetProbe?.seen) return { token, at: sent }
  }
  return failed ? undefined : false
}

// ---- (b) does it reach this service ----

type Answer = LocalSubnetName | null | undefined
const kept = new Map<string, { at: number; answer: Promise<Answer> }>()
// The last answer for each, shown while it is asked again.
const last = new Map<string, LocalSubnetName | null>()
const forgotten = new Set<() => void>()
// An answer is the sign-in's that served the service then: none is kept past a change of who serves an account, and
// whoever shows one (hooks/useLocalSubnetName) is told to ask again — the name asked about may be the very same.
accountCache(() => {
  kept.clear()
  last.clear()
  forgotten.forEach(listener => listener())
})

// The sign-in that serves a service or device ('' the page's own person): whose probe says whether it is reached.
const servedBy = (id: string) => requestSignInNow({ about: [id] }) || ''
// A request made as it — the page's own person's as they always were, with nothing said.
const ask = (sub: string, query: string, variables: ILookup<any> = {}) =>
  sub ? graphQLBasicRequest(query, variables, true, { sub }) : graphQLBasicRequest(query, variables, true)

// Kept by the name asked as well: a service's name changes (its own turned on or off, a rename) and the answer for the
// name it had is not the new one's.
const keyOf = (id: string, name: string) => `${id} ${name}`

/** What is known now, with nothing asked: whether an answer is — the last there was —, and which. */
export function localNow(id: string, name: string): { local?: LocalSubnetName; checked: boolean } {
  if (agent.here === false) return { checked: true }
  const answer = agent.here ? last.get(keyOf(id, name)) : undefined
  return answer === undefined ? { checked: false } : { ...(answer && { local: answer }), checked: true }
}

// `id` is the service's, or the device's for the device itself; `name` its name in device subnets. `again`: asked anew,
// not the answer kept — a "no" asked again (hooks/useLocalSubnetName useSubnetReach). No agent here answers no, at once.
// undefined: not known, whether an agent is here or whether it reaches this; it is not kept.
export function localSubnetName(
  id: string,
  name: string,
  again?: boolean
): Promise<LocalSubnetName | null | undefined> {
  const now = Date.now()
  const key = keyOf(id, name)
  const held = kept.get(key)
  if (held && now - held.at < KEPT_MS && !again && agent.here !== false) return held.answer
  const asked: { at: number; answer: Promise<Answer> } = {
    at: now,
    answer: (browser.isElectron ? askDaemon(name) : askBeacon(id, servedBy(id))).then(answer => {
      const current = kept.get(key) === asked
      if (!current) return answer
      if (answer === undefined || agent.here === false) kept.delete(key)
      else last.set(key, answer)
      return answer
    }),
  }
  kept.set(key, asked)
  return asked.answer
}

// The beacon's: the name, when the device that saw the probe reaches the service.
async function askBeacon(id: string, sub: string): Promise<Answer> {
  for (let tries = 0; tries < 2; tries++) {
    const token = await tokenOf(sub)
    if (!token) return token === null ? null : undefined
    const response = await ask(
      sub,
      'query SubnetProbe($token: String!, $id: String) { subnetProbe(token: $token, serviceId: $id) { seen name } }',
      { token, id }
    )
    const answer = response !== 'ERROR' ? response.data?.data?.subnetProbe : undefined
    if (!answer) return undefined
    if (answer.seen) return typeof answer.name === 'string' ? { name: answer.name } : null
    // graphql does not know the token any more: another is made, at the pace kept for it.
    if (tokens.get(sub)?.token === token) tokens.delete(sub)
  }
  return undefined
}

// The device a probe of this page's was seen by — this machine's — when the person manages it (graphql subnetProbe's
// deviceId): what a local port is opened on (services/localPorts). null: no daemon here, or an API without the field.
export async function beaconDevice(): Promise<string | null> {
  const token = await tokenOf('')
  if (!token) return null
  const response = await ask(
    '',
    'query SubnetProbeDevice($token: String!) { subnetProbe(token: $token) { seen deviceId } }',
    {
      token,
    }
  )
  const id = response !== 'ERROR' ? response.data?.data?.subnetProbe?.deviceId : undefined
  return typeof id === 'string' ? id : null
}

/* Signing in on this machine (graphql-api docs/PROXY-GROUPS.md §15, "The portal and an installed daemon"). A name is
   the machine's but a connection is the OS account's: graphql names a service only where the daemon here would serve
   this person, and otherwise says whether signing in on it would (signInNeeded) — then the page connects with its own
   client and offers the app's own sign-in: signInLink, remoteit-<stage>://sign-in, which opens the installed app's
   sign-in and carries nothing. Opened on the person's click alone; the app signs in with Permitteer itself. No link:
   no app of the stage here to take it (prod's shared menu), whose menu is where to sign in. In the Desktop app none of this: the name API answers for the
   person signed in on the app's own account, and the app signs in itself. */
export type LocalSignIn = { link?: string }

let signInKept: { at: number; answer: Promise<LocalSignIn | null | undefined> } | undefined

export function localSignIn(): Promise<LocalSignIn | null> {
  if (browser.isElectron || agent.here === false) return Promise.resolve(null)
  if (signInKept && Date.now() - signInKept.at < KEPT_MS) return signInKept.answer.then(answer => answer ?? null)
  const asked = { at: Date.now(), answer: askSignIn() }
  signInKept = asked
  return asked.answer.then(answer => {
    // Not known whether an agent is here: no answer to keep.
    if (answer === undefined && signInKept === asked) signInKept = undefined
    return answer ?? null
  })
}

async function askSignIn(): Promise<LocalSignIn | null | undefined> {
  const token = await tokenOf('')
  if (!token) return token === null ? null : undefined
  if (!(await signInServed())) return null
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
// the service and hands Connect off. The daemon that answers is the one that did: whether it is here is asked again only
// where it was not known to be.
export function forgetLocal() {
  kept.clear()
  signInKept = undefined
  if (!localPresent()) recheck('asked')
  forgotten.forEach(listener => listener())
}

/** Told when an agent comes to be here, or is here no more. */
export function onLocalAgent(listener: () => void): () => void {
  changes.add(listener)
  return () => {
    changes.delete(listener)
  }
}

export function onLocalForgotten(listener: () => void): () => void {
  forgotten.add(listener)
  return () => {
    forgotten.delete(listener)
  }
}

// The Desktop app's: the name API's answer, where it is here to give one.
async function askDaemon(name: string): Promise<Answer> {
  if (agent.here === false) {
    if (Date.now() - agent.at >= RECHECK_MS) recheck('opened')
    return null
  }
  const answer = await askLoopback(name)
  // Nothing listening, or too slow: no daemon to ask for now.
  found(answer !== 'NONE')
  return answer === 'NONE' ? null : answer
}

const askName = async (name: string): Promise<boolean> => (await askLoopback(name)) !== 'NONE'

async function askLoopback(name: string): Promise<Answer | 'NONE'> {
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
    return 'NONE'
  } finally {
    clearTimeout(timer)
  }
}
