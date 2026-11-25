import { getApplicationType, isWebType } from '@common/applications'
import browser, { openInSystem, windowOpen } from './browser'
import { EMBEDDED } from '../constants'
import { State, store } from '../store'
import { getApiURL } from '../helpers/apiHelper'
import { httpsOnly } from '../helpers/utilHelper'
import { selectDeviceSessions } from '../hooks/useDeviceSessions'
import { selectById } from '../selectors/devices'
import { requestSignIn } from '../selectors/signIns'
import { deviceSessionInfo, readDeviceSessionInfo } from './deviceSessionInfo'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { defaultHttpOnName } from './graphQLDetectedScheme'
import { accountCache } from './accountCaches'
import { localSubnetName, subnetWebPort, subnetWebURL } from './localSubnet'
import { post } from './post'

/* A web service's address on remote.it's proxies (graphql-api docs/WEB-ADDRESSES.md): one for each service, the same
   from one visit to the next, where each visitor signs in and goes through as themselves. Where the new proxies are
   enabled it is how the portal opens a web service no agent here reaches, wherever it is opened from, in place of a
   proxy connection: that one's address is anyone's who has it. TLS ends at the proxy, which is said on its panel. */

/* THE GATE. The API has openWebAddress, and connections go through the new proxies: by the Test setting where it is set
   — the one connect is asked with —, else by the stage's default (proxyFleet). The portal is released apart from graphql,
   and a field it lacks would fail the whole query: both are looked for in the schema first, and an API without them is
   left as it is. Each is read once for each API; a read that failed is not kept, and is made again by whoever asks
   next. */
type Schema = { openWebAddress: boolean; proxyFleet: boolean; webAddress: boolean }
const schemas = new Map<string, Schema>()
const fleets = new Map<string, string>()
const reads = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()

const keep = <T>(kept: Map<string, T>, api: string, value: T) => {
  kept.set(api, value)
  listeners.forEach(listener => listener())
}

const thisApi = () => getApiURL() || ''

export function subscribeWebAddresses(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Whether web services are opened at their web addresses, of what is known now: undefined until it is read. */
export function webAddressGate(): boolean | undefined {
  const setting = store.getState().ui.proxyFleet
  if (setting === 'LEGACY') return false
  const schema = schemas.get(thisApi())
  if (!schema) return undefined
  if (!schema.openWebAddress) return false
  if (setting) return setting === 'CONNECTD'
  if (!schema.proxyFleet) return false
  const fleet = fleets.get(thisApi())
  return fleet === undefined ? undefined : fleet === 'CONNECTD'
}

// Waited on no longer than this by anything a person has asked for: a check that does not answer leaves it as it was.
export const WEB_ADDRESS_WAIT_MS = 5_000

const within = <T>(asked: Promise<T>): Promise<T | undefined> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(undefined), WEB_ADDRESS_WAIT_MS)
    asked.then(resolve, () => resolve(undefined)).finally(() => clearTimeout(timer))
  })

// One read at a time of each kind, whoever asks.
function reading(key: string, read: () => Promise<void>): Promise<void> {
  const asked = reads.get(key) ?? read().finally(() => reads.delete(key))
  reads.set(key, asked)
  return asked
}

async function readSchema(api: string) {
  const response = await graphQLBasicRequest(
    `query WebAddressSchema {
      mutation: __type(name: "Mutation") { fields { name } }
      query: __type(name: "Query") { fields { name } }
      service: __type(name: "Service") { fields { name } }
    }`,
    {},
    true
  )
  const data = response === 'ERROR' ? undefined : response.data?.data
  if (!data?.mutation?.fields || !data.query?.fields) return
  const has = (fields: { name: string }[], name: string) => fields.some(field => field.name === name)
  keep(schemas, api, {
    openWebAddress: has(data.mutation.fields, 'openWebAddress'),
    proxyFleet: has(data.query.fields, 'proxyFleet'),
    webAddress: has(data.service?.fields ?? [], 'webAddress'),
  })
}

async function readFleet(api: string) {
  const response = await graphQLBasicRequest(`query ProxyFleetDefault { proxyFleet }`, {}, true)
  const fleet = response === 'ERROR' ? undefined : response.data?.data?.proxyFleet
  if (typeof fleet === 'string') keep(fleets, api, fleet)
}

// The gate, read as far as it has to be: undefined where it could not be.
async function readGate(): Promise<boolean | undefined> {
  const api = thisApi()
  if (webAddressGate() === undefined && !schemas.has(api)) await reading(`schema ${api}`, () => readSchema(api))
  if (webAddressGate() === undefined && schemas.has(api)) await reading(`fleet ${api}`, () => readFleet(api))
  return webAddressGate()
}

/** What is looked at of a service: `web`, whether it is a web service. */
export type WebTarget = { id: string; deviceID?: string; route?: IRouteType; web: boolean }

/** Whether a type of service is a web one. */
export const selectWebType = (state: State, typeID?: number): boolean =>
  typeID !== undefined &&
  isWebType(
    getApplicationType(typeID),
    state.applicationTypes.all.find(type => type.id === typeID)
  )

/** A service as it is looked at; by its connection alone where the service itself is in no stored list. */
export function webTarget(state: State, service?: IService, connection?: IConnection): WebTarget | undefined {
  const id = service?.id ?? connection?.id
  if (!id) return undefined
  return {
    id,
    deviceID: service?.deviceID ?? connection?.deviceID,
    route: service?.attributes.route,
    web: selectWebType(state, service?.typeID ?? connection?.typeID),
  }
}

/** Whether a service could be opened at its web address, the gate apart. Not one that is not web, nor one set to be
 *  reached peer to peer alone. Not where the app has a backend: its connections are its own machine's, peer to peer where
 *  they can be. */
export const webAddressAllowed = (target: WebTarget | undefined): boolean =>
  !!target?.web &&
  !!target.deviceID &&
  !browser.hasBackend &&
  target.route !== 'p2p' &&
  selectDeviceSessions(store.getState())

/** Whether a service is opened at its web address rather than by a connection, of what is known now: undefined until it
 *  is. One with a name in device subnets — a legacy device's has none, and its sessions are not these proxies' to open. */
export function opensAtWebAddress(target: WebTarget | undefined): boolean | undefined {
  if (!target?.deviceID || !webAddressAllowed(target)) return false
  const gate = webAddressGate()
  if (!gate) return gate
  const info = deviceSessionInfo(target.deviceID)
  // A service added since its device was read is not in what is known of it: read again by whoever waits.
  if (!info || (info.services && !(target.id in info.services))) return undefined
  return !!info.services?.[target.id]
}

/** The same, read where it is not known: undefined where it could not be, or not in time. */
export async function decideWebAddress(target: WebTarget | undefined): Promise<boolean | undefined> {
  if (!target?.deviceID || !webAddressAllowed(target)) return false
  const gate = await within(readGate())
  if (!gate) return gate
  const info = await within(readDeviceSessionInfo(target.deviceID, target.id))
  return info && !!info.services?.[target.id]
}

/** Its URL, made if it has none; a refusal in graphql's words ('' where none were said). */
async function graphQLOpenWebAddress(
  serviceId: string
): Promise<{ url: string } | { reason: string } | typeof UNSUPPORTED> {
  const query = `mutation OpenWebAddress($serviceId: String!) { openWebAddress(serviceId: $serviceId) }`
  const variables = { serviceId }
  // Made as the sign-in that serves the service.
  const response = await post({ query, variables }, '', false, false, { about: [serviceId] })
  if (response === 'ERROR') return { reason: '' }
  const errors = graphQLGetErrors(response, true, { query, variables }) as
    | undefined
    | (Error & { extensions?: { message?: string } })[]
  if (withoutDeviceSessions(errors, 'openWebAddress')) {
    // An API without it after all: noted, so nothing offers it any more.
    keep(schemas, thisApi(), { openWebAddress: false, proxyFleet: false, webAddress: false })
    return UNSUPPORTED
  }
  if (errors) {
    const reason = errors[0]?.extensions?.message || errors[0]?.message || ''
    return { reason: reason.charAt(0).toUpperCase() + reason.slice(1) }
  }
  const url = httpsOnly(response.data?.data?.openWebAddress)
  if (!url) return { reason: '' }
  keep(known, serviceId, url)
  return { url }
}

export type WebAddressOpened = true | { reason: string }

/* The addresses there are, for what shows one — its row, its panel — and lets it be copied: each opened here, and those
   made before, read where the API says them (Service.webAddress), one query for all that ask in the same moment. */
const known = new Map<string, string>()
const read = new Set<string>()
let wanted = new Map<string, string>()
accountCache(() => {
  known.clear()
  read.clear()
  listeners.forEach(listener => listener())
})

/** A service's web address, where there is one known. */
export const knownWebAddress = (serviceId?: string): string | undefined =>
  serviceId ? known.get(serviceId) : undefined

/** Asks for a service's, where it is opened at one. */
export function requestWebAddress({ id, deviceID }: WebTarget) {
  if (!deviceID || read.has(id) || known.has(id) || !schemas.get(thisApi())?.webAddress) return
  read.add(id)
  if (!wanted.size) setTimeout(readWanted)
  wanted.set(id, deviceID)
}

async function readWanted() {
  const asked = wanted
  wanted = new Map()
  const bySignIn: ILookup<string[]> = {}
  new Set(asked.values()).forEach(id =>
    (bySignIn[requestSignIn(store.getState(), { about: [id] }) || ''] ??= []).push(id)
  )
  await Promise.all(
    Object.entries(bySignIn).map(async ([sub, ids]) => {
      const response = await graphQLBasicRequest(
        `query WebAddresses($ids: [String!]!) { login { device(id: $ids) { id services { id webAddress } } } }`,
        { ids },
        true,
        { sub, about: ids }
      )
      if (response === 'ERROR') return asked.forEach((deviceID, id) => ids.includes(deviceID) && read.delete(id))
      for (const device of response.data?.data?.login?.device ?? [])
        for (const service of device.services ?? []) {
          const url = httpsOnly(service.webAddress)
          if (url && asked.has(service.id)) known.set(service.id, url)
        }
    })
  )
  listeners.forEach(listener => listener())
}

/* A web service made ready, with nothing opened: its web address made if it has none, so it is there to open and to copy.
   Several are asked for at once — a network's started together — and so many are made at a time. */
const AT_ONCE = 4
let making = 0
const waiting: (() => void)[] = []

export async function readyWebAddress(serviceId: string): Promise<WebAddressOpened | typeof UNSUPPORTED> {
  if (making >= AT_ONCE) await new Promise<void>(resolve => waiting.push(resolve))
  else making++
  try {
    const made = await graphQLOpenWebAddress(serviceId)
    return made === UNSUPPORTED || 'reason' in made ? made : true
  } catch {
    return { reason: '' }
  } finally {
    const next = waiting.shift()
    if (next) next()
    else making--
  }
}

/** Opens a service at its web address, on a click. */
export const openWebAddress = (serviceId: string): Promise<WebAddressOpened> =>
  openOnClick(() => graphQLOpenWebAddress(serviceId))

/** Opens a web service, on a click where nothing has asked yet whether an agent here reaches it: its name where one does,
 *  else its web address. */
export const openWebService = (target: WebTarget): Promise<WebAddressOpened> =>
  openOnClick(async () => {
    const local = await within(localWebURL(target))
    return local ? { url: local } : graphQLOpenWebAddress(target.id)
  })

async function localWebURL({ id, deviceID }: WebTarget): Promise<string | undefined> {
  const info = deviceID ? deviceSessionInfo(deviceID) : undefined
  const name = info?.services?.[id]
  const local = name ? await localSubnetName(id, name) : null
  if (!local) return undefined
  const [service, device] = selectById(store.getState(), undefined, id)
  // A name of the service's own has its port; the one this machine answered may be its device's, at the service's own.
  const named = info?.serviceNames?.[id]
  const port = (local.name === name && named?.own && named.port) || service?.port
  return subnetWebURL(local.name, subnetWebPort(port, defaultHttpOnName(service, device)))
}

/* Opens what a click asks for, once it is known where that is. A tab is reserved on the click, to pass the popup
   blocker, and sent there then; it is closed when there is nowhere to go. An app's own window has no tabs to reserve:
   there the system browser is given the address. */
async function openOnClick(find: () => ReturnType<typeof graphQLOpenWebAddress>): Promise<WebAddressOpened> {
  const shell = browser.isNative || EMBEDDED
  const tab = shell ? null : window.open('', '_blank')
  let opened: Awaited<ReturnType<typeof graphQLOpenWebAddress>>
  try {
    opened = await find()
  } catch (error) {
    tab?.close()
    throw error
  }
  if (opened === UNSUPPORTED || 'reason' in opened) {
    tab?.close()
    return opened === UNSUPPORTED ? { reason: '' } : opened
  }
  const { url } = opened
  if (browser.isMobile) return (await openInSystem(url)) || { reason: '' }
  if (shell) await windowOpen(url, '_blank', true)
  else if (tab) {
    tab.opener = null
    tab.location.href = url
  } else window.location.assign(url)
  return true
}

// For tests.
export function resetWebAddresses() {
  schemas.clear()
  fleets.clear()
  reads.clear()
  known.clear()
  read.clear()
}
