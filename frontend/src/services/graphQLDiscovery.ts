import { REGEX_NAME_SAFE } from '@common/constants'
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
}

export type Discovery = {
  at: string | null
  offers: DiscoveryOffer[]
  withheld: string[] // the parts the device's local policy left out: network, local
}

// Why there is no answer: the device is offline (or has no session), or it did not answer in time.
export type DiscoveryError = { error: 'OFFLINE' | 'NO_ANSWER' | 'ERROR'; message?: string }

export async function graphQLDiscover(deviceId: string): Promise<Discovery | DiscoveryError | typeof UNSUPPORTED> {
  const query = `query Discover($deviceId: String!) {
    discover(deviceId: $deviceId) {
      at
      offers { kind type name host addresses port protocol application process tls txt }
      withheld
    }
  }`
  const variables = { deviceId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return { error: 'ERROR' }
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, 'discover')) return UNSUPPORTED
  if (errors?.length) return discoveryError(errors[0].message)
  return response.data?.data?.discover ?? { error: 'NO_ANSWER' }
}

export function discoveryError(message?: string): DiscoveryError {
  if (message && /offline/i.test(message)) return { error: 'OFFLINE', message }
  if (message && /did not answer/i.test(message)) return { error: 'NO_ANSWER', message }
  return { error: 'ERROR', message }
}

export type DiscoveryMachine = {
  key: string // its host: the .local name, else its first address
  name: string // its .local name without the domain, else its address
  addresses: string[]
  offers: DiscoveryOffer[]
}

// The answer as the page lists it: the network's instances by the machine that advertises them, and the device's own
// listeners on their own. Machines by name, each one's instances and the listeners by port.
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
      machine = { key, name: key.replace(/\.local\.?$/i, ''), addresses: [], offers: [] }
      machines.set(key, machine)
    }
    for (const address of offer.addresses) if (!machine.addresses.includes(address)) machine.addresses.push(address)
    machine.offers.push(offer)
  }

  const list = [...machines.values()].sort((a, b) => a.name.localeCompare(b.name))
  list.forEach(machine => machine.offers.sort(byPort))
  return { machines: list, local: local.sort(byPort) }
}

// The service an offer opens the add form with (ui.setupAdded, as the local scan does).
export function offerService(offer: DiscoveryOffer): Partial<IService> {
  const name = offer.name.replace(REGEX_NAME_SAFE, '').trim()
  return { typeID: offer.application, host: offer.host, port: offer.port, name }
}
