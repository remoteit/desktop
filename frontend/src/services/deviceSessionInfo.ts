import { post } from './post'
import { store } from '../store'
import { requestSignIn } from '../selectors/signIns'
import { accountCache } from './accountCaches'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { Upkeep, withoutDeviceSessions } from './graphQLDaemon'

/* What the device-session API says of each device, for the device list and a device's pages: its name in device
   subnets (Device.subnetName, <name>-<owner slug>.on.remote.it), who it acts for in user mode (Device.actsFor), and
   what its daemon last reported — the version it runs, where an upgrade stands, and what upgrades it (Device.agent).
   Not in the device list's own query: that query runs on every API, and only one that serves device sessions has these
   fields. So they are read on their own — batched, one query for every row that asks in the same moment, kept for the
   session — and an API without them is asked once. */

export type DeviceAgent = Upkeep & {
  running: string | null
  package?: { version: string; format?: string | null } | null
  update: { version: string; state: string; detail?: string | null } | null
}

export type DeviceSessionInfo = {
  subnetName: string | null
  actsFor: string | null
  agent: DeviceAgent | null
  services?: ILookup<string | null> // each service's name: its own, the device's, or its LAN host's (Service.subnetName)
  // Each service's own name, where the API has them (presence-server docs/subnet-service-names.md): whether it has one
  // (Service.subnetOwnName), and the port to use with its name (Service.subnetPort: its usual one with its own name).
  serviceNames?: ILookup<ServiceNameInfo>
}

// `ports`: the ports its own name answers on, as a person reads them (Service.subnetPorts: `22 → 2222`, `5901-5910`),
// and `defaultLabel` its default name part (Service.subnetDefaultLabel, <device><service>), where the API has them.
export type ServiceNameInfo = {
  own: boolean
  port: number | null
  ports?: string[] | null
  defaultLabel?: string | null
}

type Listener = () => void

const NONE: DeviceSessionInfo = { subnetName: null, actsFor: null, agent: null }
const info = new Map<string, DeviceSessionInfo>()
const listeners = new Set<Listener>()
let wanted = new Set<string>()
let timer: ReturnType<typeof setTimeout> | undefined
let unsupported = false
// Who upgrades it (updatedBy, howToUpdate, available) only where the API has them: one without is asked again without.
let withUpkeep = true
// Whether it is at or above its kind's minimum build (supported) only where the API has it, the same way.
let withSupport = true
// A service's own name and its port only where the API has them, the same way; and its name's ports.
let withServiceNames = true
let withNamePorts = true

export const deviceSessionInfo = (deviceId: string): DeviceSessionInfo | undefined => info.get(deviceId)

export function subscribeDeviceSessionInfo(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Ask for a device's: read with every other device asked for before the next tick. `again` reads it anew.
export function requestDeviceSessionInfo(deviceId: string, again?: boolean) {
  if (again) info.delete(deviceId)
  if (unsupported || info.has(deviceId) || wanted.has(deviceId)) return
  wanted.add(deviceId)
  timer ??= setTimeout(flush)
}

/* A service's name, for what must not take a name that could not be read for one it does not have: null where it has none
   — and from an API without them —, undefined where that is not known: not read yet, or the read failed. */
export function deviceSessionName(deviceId: string, serviceId: string): string | null | undefined {
  if (unsupported) return null
  const known = info.get(deviceId)
  if (known?.services && serviceId in known.services) return known.services[serviceId]
  if (!known || failed.has(deviceId)) return undefined
  // One the device's answer does not list is asked about again, and has none where it is not listed still.
  const asked = missingAsked.has(`${deviceId}/${serviceId}`) && !reading(deviceId)
  return known.services && !asked ? undefined : null
}

/** The same, read where it is not known, and read again where that failed: once, for each that asks. */
export async function readDeviceSessionName(deviceId: string, serviceId: string): Promise<string | null | undefined> {
  const name = deviceSessionName(deviceId, serviceId)
  if (name !== undefined) return name
  if (!info.has(deviceId) || failed.has(deviceId)) await answer(deviceId)
  requestServiceSessionInfo(deviceId, serviceId)
  if (reading(deviceId)) await answer(deviceId)
  return deviceSessionName(deviceId, serviceId)
}

// The devices whose last read failed: none is shown of one never read, which is not that it has no names.
const failed = new Set<string>()
// Those being read, since when: one not answered this long is read anew by whoever asks next.
const asking = new Map<string, number>()
const ANSWER_MS = 4_000
const waiting = new Map<string, (() => void)[]>()
const reading = (deviceId: string) =>
  wanted.has(deviceId) || Date.now() - (asking.get(deviceId) ?? -Infinity) < ANSWER_MS

// A device's next answer: the one being read, or one asked for now.
const answer = (deviceId: string) =>
  new Promise<void>(resolve => {
    waiting.set(deviceId, [...(waiting.get(deviceId) ?? []), resolve])
    if (reading(deviceId)) return
    wanted.add(deviceId)
    timer ??= setTimeout(flush)
  })

/* A service the device's answer does not list — added since it was read (here or anywhere else) — has its name only
   in a new answer: the device is read again, once for each such service, keeping what it has meanwhile so the names
   of its other services stay shown. A service still missing from the new answer is not asked about again. */
const missingAsked = new Set<string>()

export function requestServiceSessionInfo(deviceId: string, serviceId: string) {
  const known = info.get(deviceId)
  if (unsupported || !known?.services || serviceId in known.services) return
  const key = `${deviceId}/${serviceId}`
  if (missingAsked.has(key)) return
  missingAsked.add(key)
  if (wanted.has(deviceId)) return
  wanted.add(deviceId)
  timer ??= setTimeout(flush)
}

// One query per sign-in, each about the devices it serves: the ids are in the query's own text, not its variables, so
// whose request it is is said apart.
async function flush() {
  const ids = [...wanted]
  wanted = new Set()
  timer = undefined
  if (!ids.length) return
  const state = store.getState()
  const bySignIn: ILookup<string[]> = {}
  ids.forEach(id => (bySignIn[requestSignIn(state, { about: [id] }) || ''] ??= []).push(id))
  await Promise.all(Object.entries(bySignIn).map(([sub, own]) => read(own, sub)))
}

async function read(ids: string[], sub: string) {
  const upkeep = `${withUpkeep ? ' updatedBy howToUpdate available' : ''}${
    withSupport ? ' supported { supported minimum kind message }' : ''
  }`
  const query = `query DeviceSessionInfo { login { device(id: ${JSON.stringify(
    ids
  )}) { id subnetName actsFor { email } agent { running package { version format } update { version state detail }${upkeep} } services { id subnetName${
    withServiceNames ? ` subnetOwnName subnetPort${withNamePorts ? ' subnetPorts subnetDefaultLabel' : ''}` : ''
  } } } } }`
  ids.forEach(id => asking.set(id, Date.now()))
  const response = await post({ query }, '', false, false, { sub, about: ids }).catch(() => 'ERROR' as const)
  let answered = false
  if (response !== 'ERROR') {
    if (withUpkeep && withoutDeviceSessions(response.data?.errors, 'howToUpdate')) {
      withUpkeep = false
      ids.forEach(id => wanted.add(id))
      return flush()
    }
    if (withSupport && withoutDeviceSessions(response.data?.errors, 'supported')) {
      withSupport = false
      ids.forEach(id => wanted.add(id))
      return flush()
    }
    if (
      withServiceNames &&
      withNamePorts &&
      (withoutDeviceSessions(response.data?.errors, 'subnetPorts') ||
        withoutDeviceSessions(response.data?.errors, 'subnetDefaultLabel'))
    ) {
      withNamePorts = false
      ids.forEach(id => wanted.add(id))
      return flush()
    }
    if (withServiceNames && withoutDeviceSessions(response.data?.errors, 'subnetOwnName')) {
      withServiceNames = false
      ids.forEach(id => wanted.add(id))
      return flush()
    }
    const errors = graphQLGetErrors(response, true, { query, variables: {} })
    if (withoutDeviceSessions(errors, 'subnetName')) unsupported = true
    answered = unsupported || !errors
    if (!errors)
      for (const device of response.data?.data?.login?.device || [])
        info.set(device.id, {
          subnetName: device.subnetName ?? null,
          actsFor: device.actsFor?.email ?? null,
          agent: device.agent ?? null,
          services: Object.fromEntries((device.services || []).map((s: any) => [s.id, s.subnetName ?? null])),
          ...(withServiceNames && {
            serviceNames: Object.fromEntries(
              (device.services || []).map((s: any) => [
                s.id,
                {
                  own: !!s.subnetOwnName,
                  port: s.subnetPort ?? null,
                  ...(withNamePorts && { ports: s.subnetPorts ?? null, defaultLabel: s.subnetDefaultLabel ?? null }),
                },
              ])
            ),
          }),
        })
  }
  // Asked and not answered (unsupported, an error, not visible): none, so the row stops asking.
  for (const id of ids) {
    if (!info.has(id)) info.set(id, NONE)
    asking.delete(id)
    if (answered) failed.delete(id)
    else {
      failed.add(id)
      // Its services asked about for want of a name are asked about again.
      missingAsked.forEach(key => key.startsWith(`${id}/`) && missingAsked.delete(key))
    }
  }
  listeners.forEach(listener => listener())
  ids.forEach(id => {
    const waited = waiting.get(id) ?? []
    waiting.delete(id)
    waited.forEach(resolve => resolve())
  })
}

// Every device read so far, read anew: an account's slug changed, and with it each of its devices' names.
export function refreshDeviceSessionInfo() {
  for (const id of [...info.keys()]) requestDeviceSessionInfo(id, true)
}

// Kept by device, read as the sign-in that served its account then: when accounts' stored data is dropped, another
// may serve it, and says what it may see of it (the agent, who it acts for).
accountCache(refreshDeviceSessionInfo)

// User mode (graphql setDeviceUserMode): a device the caller manages acting for them — or no longer — then read anew.
export async function setDeviceUserMode(deviceId: string, on: boolean) {
  const result = await graphQLBasicRequest(
    `mutation SetDeviceUserMode($deviceId: String!, $on: Boolean!) { setDeviceUserMode(deviceId: $deviceId, on: $on) }`,
    { deviceId, on }
  )
  requestDeviceSessionInfo(deviceId, true)
  return result !== 'ERROR'
}

// For tests.
export function resetDeviceSessionInfo() {
  info.clear()
  missingAsked.clear()
  failed.clear()
  asking.clear()
  waiting.clear()
  wanted = new Set()
  unsupported = false
  withUpkeep = true
  withSupport = true
  withServiceNames = true
  withNamePorts = true
  if (timer) clearTimeout(timer)
  timer = undefined
}
