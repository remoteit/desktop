import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { withoutDeviceSessions } from './graphQLDaemon'

/* What the device-session API says of each device, for the device list and a device's pages: its name in device
   subnets (Device.subnetName, <name>-<owner slug>.on.remote.it), who it acts for in user mode (Device.actsFor), and
   what its daemon last reported — the version it runs and where an upgrade stands (Device.agent).
   Not in the device list's own query: that query runs on every API, and only one that serves device sessions has these
   fields. So they are read on their own — batched, one query for every row that asks in the same moment, kept for the
   session — and an API without them is asked once. */

export type DeviceAgent = {
  running: string | null
  update: { version: string; state: string; detail?: string | null } | null
}

export type DeviceSessionInfo = {
  subnetName: string | null
  actsFor: string | null
  agent: DeviceAgent | null
  services?: ILookup<string | null> // each service's name: the device's, or its LAN host's (Service.subnetName)
}

type Listener = () => void

const NONE: DeviceSessionInfo = { subnetName: null, actsFor: null, agent: null }
const info = new Map<string, DeviceSessionInfo>()
const listeners = new Set<Listener>()
let wanted = new Set<string>()
let timer: ReturnType<typeof setTimeout> | undefined
let unsupported = false

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

async function flush() {
  const ids = [...wanted]
  wanted = new Set()
  timer = undefined
  if (!ids.length) return

  const query = `query DeviceSessionInfo { login { device(id: ${JSON.stringify(
    ids
  )}) { id subnetName actsFor { email } agent { running update { version state detail } } services { id subnetName } } } }`
  const response = await post({ query })
  if (response !== 'ERROR') {
    const errors = graphQLGetErrors(response, true, { query, variables: {} })
    if (withoutDeviceSessions(errors, 'subnetName')) unsupported = true
    else if (!errors)
      for (const device of response.data?.data?.login?.device || [])
        info.set(device.id, {
          subnetName: device.subnetName ?? null,
          actsFor: device.actsFor?.email ?? null,
          agent: device.agent ?? null,
          services: Object.fromEntries((device.services || []).map((s: any) => [s.id, s.subnetName ?? null])),
        })
  }
  // Asked and not answered (unsupported, an error, not visible): none, so the row stops asking.
  for (const id of ids) if (!info.has(id)) info.set(id, NONE)
  listeners.forEach(listener => listener())
}

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
  wanted = new Set()
  unsupported = false
  if (timer) clearTimeout(timer)
  timer = undefined
}
