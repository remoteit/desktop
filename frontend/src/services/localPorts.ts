import browser from './browser'
import { thisDevice } from './thisDevice'
import { beaconDevice } from './localSubnet'
import { graphQLBasicRequest, graphQLRequestWithReason } from './graphQL'

/* Connect on a local port (graphql-api docs/LOCAL-PORT.md): a service reached from this machine on 127.0.0.1:<port>,
   by an initiator on this machine's own device, and named <name>.at.remote.it. graphql keeps the port and the name, so
   both are the same every time it is opened — bookmarks and an app's saved settings keep working.

   The name is for the browser: cookies are kept per host, not per port, so web services on two ports of localhost
   share each other's logins, and two names do not. Every *.at.remote.it name resolves to 127.0.0.1 in public DNS, but a
   router or resolver that guards against DNS rebinding drops such an answer — there, localhost:<port> is used instead.
   Whether the name works is probed once and remembered; the person can switch either way. */

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
}

// This machine's device, and what is known of the shell it runs in.
export type Machine = { id: string; platform?: string; localPorts?: boolean }

const FIELDS = 'deviceId serviceId name host port open state detail initiatorId https httpsAvailable'

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
      return { id: status.device.uid, platform: shell.info.platform, localPorts: shell.has('localPorts') }
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
    `query LocalPorts($deviceId: String!, $serviceId: String) { localPorts(deviceId: $deviceId, serviceId: $serviceId) { ${FIELDS} } }`,
    { deviceId, serviceId }
  )
  return response !== 'ERROR' ? response.data?.data?.localPorts?.[0] ?? null : null
}

// Opens it — on the port it had, or `port` from now on; over https (true) or plain (false) from now on, or as it was.
// graphql serves it over https only where it can (httpsAvailable), plain otherwise. A refusal comes back in graphql's
// words (the port is in use).
export async function openLocalPort(
  deviceId: string,
  serviceId: string,
  port?: number,
  https?: boolean
): Promise<LocalPort | { reason: string }> {
  const response = await graphQLRequestWithReason(
    `mutation OpenLocalPort($deviceId: String!, $serviceId: String!, $port: Int, $https: Boolean) { openLocalPort(deviceId: $deviceId, serviceId: $serviceId, port: $port, https: $https) { ${FIELDS} } }`,
    { deviceId, serviceId, port, https }
  )
  if (response === 'ERROR') return { reason: '' }
  if ('reason' in response) return response
  return response.data?.data?.openLocalPort ?? { reason: '' }
}

export async function closeLocalPort(deviceId: string, serviceId: string): Promise<LocalPort | null> {
  const response = await graphQLBasicRequest(
    `mutation CloseLocalPort($deviceId: String!, $serviceId: String!) { closeLocalPort(deviceId: $deviceId, serviceId: $serviceId) { ${FIELDS} } }`,
    { deviceId, serviceId }
  )
  return response !== 'ERROR' ? response.data?.data?.closeLocalPort ?? null : null
}

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
}
