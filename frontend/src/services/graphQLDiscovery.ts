import { REGEX_NAME_SAFE } from '@common/constants'
import i18n from '../i18n'
import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* What a device sees (graphql-api docs/ON-DEMAND-SERVICES.md, "Discovery"): graphql's discover(deviceId) asks the device,
   through presence, for the instances its LAN advertises over mDNS and the sockets listening on it, and answers each as
   a service the device could add. Nothing of it is kept: every read asks the device anew, and waits for its answer (a
   few seconds). MANAGE on the device; device-session devices only. Silent: the page says what went wrong, not the
   app's error banner. */

// The service type graphql suggests for an IPP printer (r3_ApplicationTypes 50).
export const PRINTER_TYPE = 50

export type DiscoveryOffer = {
  kind: 'network' | 'local' // advertised on its LAN, or listening on the device
  type: string // the DNS-SD type (_ipp._tcp), or a listener's protocol (tcp, udp)
  name: string // the instance's name, or the listening process's
  host: string // where to add it: its .local name, else its first address
  addresses: string[]
  port: number
  protocol: string
  application: number // the service type it suggests
  process: string | null
  tls: boolean | null // a printer's alone: found as IPPS
  txt: string[] | null // a printer's alone: its announcement's TXT, key=value
  // graphql's reading of it, absent from an API before them (offerRank ranks by type; the list shows its name):
  label?: string // a friendly name: "SSH", "Web admin", "LPD printing"
  rank?: DiscoveryRank
  note?: string | null // a caveat: "Works only on its own network"
  model?: string | null // the product its TXT names: "Brother MFC-L2740DW series"
}

// How likely it is wanted: likely (shown), other (behind "more"), hidden (not reachable remotely).
export type DiscoveryRank = 'likely' | 'other' | 'hidden'

export type Discovery = {
  at: string | null
  offers: DiscoveryOffer[]
  withheld: string[] // the parts the device's local policy left out: network, local
}

// Why there is no answer (graphql's reason, in the error's extensions): the device is offline (or has no session), or it did not answer in time.
export type DiscoveryError = { error: 'OFFLINE' | 'NO_ANSWER' | 'ERROR'; message?: string }

const RANKED = ['label', 'rank', 'note', 'model']

// An API from before an offer's label, rank, note and model is asked again without them: the page ranks by type.
export async function graphQLDiscover(
  deviceId: string,
  ranked = true
): Promise<Discovery | DiscoveryError | typeof UNSUPPORTED> {
  const query = `query Discover($deviceId: String!) {
    discover(deviceId: $deviceId) {
      at
      offers { kind type name host addresses port protocol application process tls txt${
        ranked ? ' ' + RANKED.join(' ') : ''
      } }
      withheld
    }
  }`
  const variables = { deviceId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return { error: 'ERROR' }
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (ranked && RANKED.some(field => withoutDeviceSessions(errors, field))) return graphQLDiscover(deviceId, false)
  if (withoutDeviceSessions(errors, 'discover')) return UNSUPPORTED
  if (errors?.length) {
    const error = errors[0] as Error & { extensions?: { reason?: string } }
    return discoveryError(error.extensions?.reason || error.message)
  }
  return response.data?.data?.discover ?? { error: 'NO_ANSWER' }
}

export function discoveryError(message?: string): DiscoveryError {
  if (message && /offline/i.test(message)) return { error: 'OFFLINE', message }
  if (message && /did not answer/i.test(message)) return { error: 'NO_ANSWER', message }
  return { error: 'ERROR', message }
}

export type DiscoveryMachine = {
  key: string // its host: the .local name, else its first address
  name: string // what it calls itself (machineName)
  addresses: string[]
  offers: DiscoveryOffer[] // by port
}

// The generic types: an offer of one is a socket, not yet anything in particular.
const GENERIC_TYPES = [1, 32769] // TCP, UDP

// graphql's rank, else (an API before it) likely for a type it knows, other for a bare socket.
export function offerRank(offer: DiscoveryOffer): DiscoveryRank {
  if (offer.rank === 'likely' || offer.rank === 'other' || offer.rank === 'hidden') return offer.rank
  return GENERIC_TYPES.includes(offer.application) ? 'other' : 'likely'
}

export function byRank(offers: DiscoveryOffer[]) {
  const ranked: Record<DiscoveryRank, DiscoveryOffer[]> = { likely: [], other: [], hidden: [] }
  for (const offer of offers) ranked[offerRank(offer)].push(offer)
  return ranked
}

/* A name a person gave it, or a product's, rather than one a machine made: not a hex string of 8 or more, a UUID, a
   run of 10 or more digits, or a long alphanumeric blob (a MAC inside it, or no vowels at all: brwa8a795a76b38). */
export function looksGenerated(name: string): boolean {
  const value = name.trim()
  if (!value) return true
  if (/^[0-9a-f]{8,}$/i.test(value)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return true
  if (/\d{10,}/.test(value)) return true
  if (/^[a-z0-9]{10,}$/i.test(value)) {
    if (/[0-9a-f]{8,}/i.test(value) && /\d/.test(value)) return true
    if (!/[aeiou]/i.test(value) && (value.match(/\d/g) || []).length >= 6) return true
  }
  return false
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/
const LOCAL = /\.local\.?$/i

/* What a machine calls itself, the first that looks human of: the name its instances share (the most common among
   them), the product its offers name, its .local host name; else "Device at" its first IPv4 address (or any). */
export function machineName(key: string, addresses: string[], offers: DiscoveryOffer[]): string {
  const human = (name?: string | null): name is string => !!name && !looksGenerated(name)
  const counts = new Map<string, number>()
  for (const offer of offers) if (human(offer.name)) counts.set(offer.name, (counts.get(offer.name) || 0) + 1)
  let shared: string | undefined
  for (const [name, count] of counts) if (!shared || count > counts.get(shared)!) shared = name
  if (shared) return shared
  const model = offers.map(offer => offer.model).find(human)
  if (model) return model
  const host = LOCAL.test(key) ? key.replace(LOCAL, '') : undefined
  if (human(host)) return host
  const address = addresses.find(a => IPV4.test(a)) || addresses[0] || key
  return i18n.t('discovery.deviceAt', 'Device at {{address}}', { address })
}

// Whether it offers anything likely wanted: listed among the machines, else among the network's other devices.
export const machineLikely = (machine: DiscoveryMachine) => machine.offers.some(offer => offerRank(offer) === 'likely')

// The answer as the page lists it: the network's instances by the machine that advertises them, and the device's own
// listeners on their own. Machines with a likely offer first, each part by name; each one's instances and the
// listeners by port.
export function groupDiscovery(offers: DiscoveryOffer[]): { machines: DiscoveryMachine[]; local: DiscoveryOffer[] } {
  const machines = new Map<string, DiscoveryMachine>()
  const local: DiscoveryOffer[] = []
  const byPort = (a: DiscoveryOffer, b: DiscoveryOffer) => a.port - b.port || a.name.localeCompare(b.name)

  for (const offer of offers) {
    if (offer.kind === 'local') {
      local.push(offer)
      continue
    }
    const key = offer.host || offer.addresses[0] || offer.name
    let machine = machines.get(key)
    if (!machine) {
      machine = { key, name: key, addresses: [], offers: [] }
      machines.set(key, machine)
    }
    for (const address of offer.addresses) if (!machine.addresses.includes(address)) machine.addresses.push(address)
    machine.offers.push(offer)
  }

  const list = [...machines.values()]
  for (const machine of list) {
    machine.offers.sort(byPort)
    machine.name = machineName(machine.key, machine.addresses, machine.offers)
  }
  list.sort((a, b) => Number(machineLikely(b)) - Number(machineLikely(a)) || a.name.localeCompare(b.name))
  return { machines: list, local: local.sort(byPort) }
}

// The service an offer opens the add form with (ui.setupAdded, as the local scan does).
/* What a service made from an offer is called. Its instance's own name where that says something the machine's name
   and the label do not ("DSM" on a NAS); otherwise its label ("Printer", "Web admin") — on a virtual device made for
   the machine, the label alone; on the device that sees it, after the machine's name ("Brother MFC-L2740DW series
   Printer"), as a gateway's services are many machines'. A listener is its label ("SSH"), not its process ("sshd"). */
export function offerServiceName(
  offer: Pick<DiscoveryOffer, 'name' | 'label' | 'kind' | 'port'> & { protocol?: string },
  machineName?: string,
  { onVirtualDevice = false }: { onVirtualDevice?: boolean } = {}
): string {
  const clean = (name?: string | null) => (name || '').replace(REGEX_NAME_SAFE, '').trim()
  const instance = clean(offer.name)
  const label = clean(offer.label)
  if (offer.kind === 'local') return label || instance || `${(offer.protocol || 'tcp').toUpperCase()} ${offer.port}`
  const specific = !!instance && !looksGenerated(instance) && instance !== clean(machineName) && instance !== label
  if (specific || !label) return instance || `${(offer.protocol || 'tcp').toUpperCase()} ${offer.port}`
  return onVirtualDevice || !machineName ? label : clean(`${machineName} ${label}`)
}

export function offerService(offer: DiscoveryOffer, machineName?: string): Partial<IService> {
  return { typeID: offer.application, host: offer.host, port: offer.port, name: offerServiceName(offer, machineName) }
}
