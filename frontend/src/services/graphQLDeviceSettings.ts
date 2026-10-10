import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* A device's settings (device-package docs/device-settings.md): each one value, set from either side — here, or on
   the machine, where it is recorded who set it — and the machine administrator's override of it (`control`), which no
   change here passes. graphql's Device.settings and setDeviceSetting. An API without them answers UNSUPPORTED, for
   the caller to keep its own controls. */

export type DeviceSettingName =
  | 'exit_node'
  | 'subnet'
  | 'console'
  | 'mcp_exec' // AI commands through MCP on the console
  | 'any_port'
  | 'proxy'
  | 'websocket' // the reflector: 'auto', 'on' or 'off'
  | 'services' // whether it serves its services (and its ports beyond them, and its console): on but on a phone
  | 'printers' // a Mac's or an iPhone's
  | 'updates' // policy only: no value, a control of on or off
  | 'user_mode'
  | 'initiators'

// cloud+local: either side sets it; local: the machine only; cloud: here only; off, on: fixed by the machine's
// administrator — and, for a setting whose value is a choice, any of its values (websocket's auto).
export type DeviceSettingControl = 'cloud+local' | 'local' | 'cloud' | 'off' | 'on' | 'auto'

export type DeviceSetting = {
  name: DeviceSettingName
  value: any // the setting's JSON: a boolean; exit_node {on, lan}; any_port {tcp, udp} or null; websocket a mode
  at: string | null
  by: string | null
  onDevice: boolean
  control: DeviceSettingControl
}

const FIELDS = 'name value at by onDevice control'

export async function graphQLDeviceSettings(deviceId: string): Promise<DeviceSetting[] | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query DeviceSettings($id: [String!]!) { login { device(id: $id) { id settings { ${FIELDS} } } } }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, 'settings')) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.login?.device?.[0]?.settings ?? []
}

export async function graphQLSetDeviceSetting(
  deviceId: string,
  name: DeviceSettingName,
  value: any
): Promise<DeviceSetting | 'ERROR'> {
  const response = await graphQLBasicRequest(
    ` mutation SetDeviceSetting($deviceId: String!, $name: String!, $value: Any) {
        setDeviceSetting(deviceId: $deviceId, name: $name, value: $value) { ${FIELDS} }
      }`,
    { deviceId, name, value }
  )
  return response === 'ERROR' ? 'ERROR' : response?.data?.data?.setDeviceSetting ?? 'ERROR'
}

// Fixed by the machine's administrator, or set only on the machine: not to be changed here.
export const settingLocked = (setting?: DeviceSetting) =>
  !!setting && ['local', 'off', 'on', 'auto'].includes(setting.control)

// Whether a device keeps services from being added: its services setting is there and off (graphql refuses addService
// then). An API without it is as before.
export const servicesClosed = (services?: DeviceSetting) => !!services && !settingOn(services)

// Whether a setting is on: what its control fixes, else its value (exit_node's `on`, any_port's lists).
export function settingOn(setting?: DeviceSetting): boolean {
  if (!setting) return false
  if (setting.control === 'off') return false
  if (setting.control === 'on') return true
  const value = setting.value
  if (value && typeof value === 'object') return 'on' in value ? !!value.on : true
  return !!value
}

/* The websocket setting (device-package docs/device-settings.md, "The websocket setting"): whether the device uses
   remote.it's reflector, which carries its traffic over a websocket when its UDP is blocked. auto (the default) only
   while its UDP to presence fails; on, all its traffic; off, never — and with its UDP blocked it stays offline.
   Device.about.websocket is the reflector's state as the device reports it: `using` while its own traffic goes through
   the reflector, when turning it off would strand it. */

export type WebsocketMode = 'auto' | 'on' | 'off'
export const WEBSOCKET_MODES: WebsocketMode[] = ['auto', 'on', 'off']

export type DeviceWebsocket = { mode: WebsocketMode | null; using: boolean | null; since: string | null }

// The mode standing: what the administrator's control fixes, else the value, else the default.
export function websocketMode(setting?: DeviceSetting): WebsocketMode {
  const fixed = setting?.control as WebsocketMode
  if (WEBSOCKET_MODES.includes(fixed)) return fixed
  return WEBSOCKET_MODES.includes(setting?.value) ? setting!.value : 'auto'
}

// Null where the device has not reported it; UNSUPPORTED from an API without it (no about, or no websocket in it).
export async function graphQLDeviceWebsocket(
  deviceId: string
): Promise<DeviceWebsocket | null | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query DeviceWebsocket($id: [String!]!) {
    login { device(id: $id) { id about { websocket { mode using since } } } }
  }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, 'about') || withoutDeviceSessions(errors, 'websocket')) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.login?.device?.[0]?.about?.websocket ?? null
}
