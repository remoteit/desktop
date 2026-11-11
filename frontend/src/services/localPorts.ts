import browser from './browser'
import { DeviceStatus, ListedPort, thisDevice } from './thisDevice'
import { beaconDevice } from './localSubnet'
import { graphQLBasicRequest, graphQLRequestWithReason } from './graphQL'

/* Connect on a local port (graphql-api docs/LOCAL-PORT.md): a service reached from this machine on 127.0.0.1:<port>,
   by an initiator on this machine's own device, and named <name>.at.remote.it. graphql keeps the port and the name, so
   both are the same every time it is opened — bookmarks and an app's saved settings keep working.

   The name is for the browser: cookies are kept per host, not per port, so web services on two ports of localhost
   share each other's logins, and two names do not. Every *.at.remote.it name resolves to 127.0.0.1 in public DNS, but a
   router or resolver that guards against DNS rebinding drops such an answer — there, localhost:<port> is used instead.
   Whether the name works is probed once and remembered; the person can switch either way.

   Whose a port is (graphql-api docs/PROXY-GROUPS.md §15, "Whose a local port is: where it was opened"): one the app
   opens on the machine it runs on, for the person signed in there, is their account's (scope ACCOUNT): it answers only
   their accounts on the machine. One opened from the portal elsewhere — or from a browser, which cannot tell which of the
   machine's accounts it runs in — is the whole machine's. Asked for only where the API takes it. */

export const LOCAL_PORT_DOMAIN = 'at.remote.it'

export type LocalPort = {
  deviceId: string
  serviceId: string
  name: string
  host: string // <name>.at.remote.it
  port: number
  open: boolean
  state: 'closed' | 'pending' | 'listening' | 'failed'
  detail: string | null
  initiatorId: string | null
  https: boolean // served over https (keyless, under *.at.remote.it); while closed, whether it was asked for
  httpsAvailable: boolean // this machine's daemon and the stage can serve it over https
  // While open, whose it is: the whole machine's, or the account of the person who opened it here. Absent from an API
  // without scope; null while closed.
  scope?: PortScope | null
}

export type PortScope = 'MACHINE' | 'ACCOUNT'

// This machine's device, and what is known of the shell it runs in. signedIn: the person signed in on the OS account the
// app runs in, as the shell says it — only an app's shell can say it.
export type Machine = { id: string; platform?: string; localPorts?: boolean; signedIn?: string }

const FIELDS = 'deviceId serviceId name host port open state detail initiatorId https httpsAvailable'

/* Whether the API knows whose a port is: openLocalPort takes `scope` and LocalPort has it. The portal is released apart
   from graphql, so it is read from the schema once; a failed read is read again next time. */
let scopeServed: Promise<boolean> | undefined

const SCOPE_PROBE = `query LocalPortScope {
  mutation: __type(name: "Mutation") { fields { name args { name } } }
  localPort: __type(name: "LocalPort") { fields { name } }
}`

export function parseScopeServed(data: any): boolean {
  const open = (data?.mutation?.fields || []).find((f: { name: string }) => f.name === 'openLocalPort')
  const takes = !!open?.args?.some((a: { name: string }) => a.name === 'scope')
  return takes && !!data?.localPort?.fields?.some((f: { name: string }) => f.name === 'scope')
}

export function localPortScopeServed(): Promise<boolean> {
  scopeServed ??= graphQLBasicRequest(SCOPE_PROBE, {}, true).then(response => {
    if (response === 'ERROR') {
      scopeServed = undefined
      return false
    }
    return parseScopeServed(response.data?.data)
  })
  return scopeServed
}

const fields = async () => (await localPortScopeServed()) ? `${FIELDS} scope` : FIELDS

// The scope to ask for: the person's own account where the app runs on this machine and they are the one signed in on
// its OS account; else none, the machine's.
export const scopeFor = (found: Machine | null | undefined, userId?: string): PortScope | undefined =>
  found?.signedIn && userId && found.signedIn.toUpperCase() === userId.toUpperCase() ? 'ACCOUNT' : undefined

// The machine this page runs on, when it runs our daemon: the shell's own device (thisDevice) in an app, else the device
// the DNS beacon was seen by — the same detection as "On this machine" (services/localSubnet). null: none here.
let machine: Promise<Machine | null> | undefined

export function thisMachine(): Promise<Machine | null> {
  machine ??= findMachine().then(found => {
    if (!found) machine = undefined // asked again later: the daemon may be started
    return found
  })
  return machine
}

async function findMachine(): Promise<Machine | null> {
  const shell = await thisDevice()
  if (shell?.compatible) {
    const status = await shell.call('status', {}).catch(() => undefined)
    if (status?.device?.uid)
      return {
        id: status.device.uid,
        platform: shell.info.platform,
        localPorts: shell.has('localPorts'),
        ...(status.signedIn?.sub && { signedIn: status.signedIn.sub }),
      }
  }
  const id = await beaconDevice()
  return id ? { id, platform: isIOSBrowser() ? 'ios' : undefined } : null
}

const isIOSBrowser = () => browser.isIOS || /iPhone|iPad|iPod/.test(navigator.userAgent)

/* Where the option is offered: a machine with our daemon, never on an iPhone or iPad unless its shell says local ports
   work there (the 'localPorts' capability) or the Test UI switch is on — whether Safari and other apps reach a port the
   packet tunnel listens on is not known yet (docs/LOCAL-PORT.md, "iPhone"). */
export function offersLocalPorts(found: Machine | null | undefined, phoneOverride?: boolean): boolean {
  if (!found) return false
  if (found.platform !== 'ios') return true
  return !!found.localPorts || !!phoneOverride
}

export async function graphQLLocalPort(deviceId: string, serviceId: string): Promise<LocalPort | null> {
  const response = await graphQLBasicRequest(
    `query LocalPorts($deviceId: String!, $serviceId: String) { localPorts(deviceId: $deviceId, serviceId: $serviceId) { ${await fields()} } }`,
    { deviceId, serviceId }
  )
  return response !== 'ERROR' ? response.data?.data?.localPorts?.[0] ?? null : null
}

// Opens it — on the port it had, or `port` from now on; over https (true) or plain (false) from now on, or as it was.
// graphql serves it over https only where it can (httpsAvailable), plain otherwise. `scope` ACCOUNT, the person's own
// on this machine, asked only where the API takes it. A refusal comes back in graphql's words (the port is in use).
export async function openLocalPort(
  deviceId: string,
  serviceId: string,
  port?: number,
  https?: boolean,
  scope?: PortScope
): Promise<LocalPort | { reason: string }> {
  const served = await localPortScopeServed()
  const selection = served ? `${FIELDS} scope` : FIELDS
  const scoped = served && !!scope
  const response = await graphQLRequestWithReason(
    `mutation OpenLocalPort($deviceId: String!, $serviceId: String!, $port: Int, $https: Boolean${
      scoped ? ', $scope: PortScope' : ''
    }) { openLocalPort(deviceId: $deviceId, serviceId: $serviceId, port: $port, https: $https${
      scoped ? ', scope: $scope' : ''
    }) { ${selection} } }`,
    { deviceId, serviceId, port, https, ...(scoped && { scope }) }
  )
  if (response === 'ERROR') return { reason: '' }
  if ('reason' in response) return response
  return response.data?.data?.openLocalPort ?? { reason: '' }
}

export async function closeLocalPort(deviceId: string, serviceId: string): Promise<LocalPort | null> {
  const response = await graphQLBasicRequest(
    `mutation CloseLocalPort($deviceId: String!, $serviceId: String!) { closeLocalPort(deviceId: $deviceId, serviceId: $serviceId) { ${await fields()} } }`,
    { deviceId, serviceId }
  )
  return response !== 'ERROR' ? response.data?.data?.closeLocalPort ?? null : null
}

/* The machine's local ports as this OS account sees them (graphql-api docs/PROXY-GROUPS.md §15, "Local ports listed per
   account"): the daemon's status.ports, through the shell's status (thisDevice 1.10.0). A machine port answers every
   account here; an account port only the accounts its person is signed in on — so the service's port, opened for an
   account, may not answer the account the app runs in. Said in the words of connectd's menu (control/client
   status.go Port: Address, Reaches, Whose, Line). Absent from an older daemon or shell: undefined, and nothing is said. */
export const listedPorts = (status?: Partial<DeviceStatus> | null): ListedPort[] | undefined =>
  Array.isArray(status?.ports) ? status!.ports : undefined

// The listing of the service's port graphql keeps (LocalPort, one a service on a machine): its initiator here.
export const listedFor = (ports: ListedPort[], local?: Pick<LocalPort, 'initiatorId'> | null) =>
  local?.initiatorId ? ports.find(p => p.id === local.initiatorId) : undefined

// The service's other ports listed here, beside the one graphql keeps: the machine's, opened by someone else, and —
// listed where they answer this account — another person's.
export const listedOthers = (ports: ListedPort[], serviceId: string, local?: Pick<LocalPort, 'initiatorId'> | null) =>
  ports.filter(p => p.target.toUpperCase() === serviceId.toUpperCase() && p.id !== local?.initiatorId)

// Where it listens: "127.0.0.1:33000", "[::1]:33000", with "/udp" for a UDP one.
export const listedAddress = (p: Pick<ListedPort, 'bind' | 'port' | 'proto'>) => {
  const bind = p.bind || '127.0.0.1'
  return `${bind.includes(':') ? `[${bind}]` : bind}:${p.port}${p.proto === 'udp' ? '/udp' : ''}`
}

// What is copied: its address without the protocol.
export const listedHostPort = (p: Pick<ListedPort, 'bind' | 'port'>) => listedAddress({ ...p, proto: 'tcp' })

// What it reaches: its TLS name, else its target's id.
export const listedReaches = (p: Pick<ListedPort, 'tls' | 'target'>) => p.tls || p.target

// Whether it is served: armed, or carrying a session. A refused one, or one that could not bind, is not.
export const listedServing = (p: Pick<ListedPort, 'state'>) => p.state === 'armed' || p.state === 'active'

type Say = (key: string, text: string, values?: Record<string, unknown>) => string

// Whom it answers: "every account", "yours", or — to the administrator — whose it is, and that it answers no one where
// it does. Its state is said where it is not served.
export function listedWhose(p: ListedPort, t: Say): string {
  const who = p.email || p.person || ''
  const whose =
    p.noOne && p.scope !== 'account'
      ? t('localPortListing.notServed', 'answers no one: scope {{scope}} is not served here', { scope: p.scope })
      : p.noOne
      ? t('localPortListing.untilSignIn', "{{who}}'s: answers no one until they sign in", { who })
      : p.scope === 'account' && p.yours
      ? t('localPortListing.yours', 'yours')
      : p.scope === 'account' && p.person
      ? t('localPortListing.persons', "{{who}}'s", { who })
      : t('localPortListing.everyAccount', 'every account')
  return !listedServing(p) && p.state ? `${whose}; ${p.state}` : whose
}

// The port as one line says it: "127.0.0.1:33000 → web.at.remote.it (yours)".
export const listedLine = (p: ListedPort, t: Say) => `${listedAddress(p)} → ${listedReaches(p)} (${listedWhose(p, t)})`

// The host to hand out: the name where it works here, else localhost.
export const localPortHost = (local: Pick<LocalPort, 'host'>, names: boolean) => (names ? local.host : 'localhost')

// What a web service is opened at: https://<name>:<port> where the port is served over https (graphql-api
// docs/LOCAL-PORT.md, "TLS") — its certificate names <name> alone, so never localhost — else http, the name or localhost.
export const localPortWebURL = (local: Pick<LocalPort, 'host' | 'port'> & Partial<Pick<LocalPort, 'https'>>, names: boolean) =>
  local.https ? `https://${local.host}:${local.port}` : `http://${localPortHost(local, names)}:${local.port}`

// Whether to ask for https when a service is first opened on a local port: a web service, never opened before.
export const wantsHttps = (web: boolean, local?: Pick<LocalPort, 'initiatorId'> | null) => web && !local?.initiatorId

/* Whether *.at.remote.it resolves here: the person's choice, else the probe's remembered answer, else probed — where
   a page can probe. A page served over http from this machine (the Desktop app's window, the menu's) asks its own
   server under a name: any answer means the name reached 127.0.0.1, a failure that it did not. An https page cannot
   load an http URL, so elsewhere it is unknown, and the name is used until the person says otherwise. */
const NAMES_KEY = 'localPort:names'
let probed: Promise<boolean | undefined> | undefined

export function namesResolve(): Promise<boolean | undefined> {
  const kept = readNames()
  if (kept !== undefined) return Promise.resolve(kept)
  probed ??= probeNames().then(answer => {
    if (answer !== undefined) writeNames(answer, 'probe')
    return answer
  })
  return probed
}

// The person's own choice: kept over any probe.
export function setNamesResolve(on: boolean) {
  writeNames(on, 'person')
  probed = undefined
}

export async function probeNames(
  where: Pick<Location, 'protocol' | 'hostname' | 'port'> = window.location
): Promise<boolean | undefined> {
  const { protocol, hostname, port } = where
  if (protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(hostname)) return undefined
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2000)
  try {
    await fetch(`http://probe.${LOCAL_PORT_DOMAIN}:${port || 80}/`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

function readNames(): boolean | undefined {
  try {
    const value = JSON.parse(window.localStorage.getItem(NAMES_KEY) || 'null')
    return typeof value?.on === 'boolean' ? value.on : undefined
  } catch {
    return undefined
  }
}

function writeNames(on: boolean, by: 'probe' | 'person') {
  try {
    window.localStorage.setItem(NAMES_KEY, JSON.stringify({ on, by }))
  } catch {
    // Not kept: probed again next time.
  }
}

// For tests.
export function resetLocalPorts() {
  machine = undefined
  probed = undefined
  scopeServed = undefined
}
