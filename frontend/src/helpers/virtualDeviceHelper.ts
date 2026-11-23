import { getApplicationType } from '@common/applications'
import { isAppService } from './appsHelper'

/* Small rules a virtual device's forms share (graphql-api docs/VIRTUAL-DEVICES.md). */

// Whether graphql adds and edits this device's services: a daemon that takes remote configuration, or a virtual device,
// whose services are graphql's alone (it has no daemon, so it is never `configurable`).
export const servicesConfigurable = (device?: Pick<IDevice, 'configurable' | 'virtual'>) =>
  !!device && (!!device.configurable || !!device.virtual)

// The types a service on a virtual device can be: every one the service form offers a device with no daemon, generic TCP
// and UDP among them. Those have no port of their own, so the person gives one; graphql takes the protocol from the type
// (an id with 0x8000 set is UDP).
export const virtualServiceTypes = (all: IApplicationType[]) => all.filter(a => getApplicationType(a.id).visibility())

// A port as typed, or undefined unless it is one from 1 to 65535.
export const portOf = (text: string) => {
  const port = Number(text)
  return text.trim() && Number.isInteger(port) && port >= 1 && port <= 65535 ? port : undefined
}

// A gateway someone may put a virtual device on: a device with a daemon that they manage (graphql asks MANAGE on it).
export const canHost = (device?: IDevice) => !!device && !device.virtual && device.permissions.includes('MANAGE')

// An IP address alone: a DHCP change can move it, so the forms suggest a reservation (a .local name moves with it).
export const isAddressOnly = (host?: string) =>
  !!host && (/^\d{1,3}(\.\d{1,3}){3}$/.test(host.trim()) || (/^[0-9a-f:]+$/i.test(host.trim()) && host.includes(':')))

// Match GraphQL's service-host rules for addresses the device serves itself.
export const jumpHost = (
  service?: Pick<IService, 'host'>,
  device?: Pick<IDevice, 'virtual' | 'host'>
): string | undefined => {
  const host = service?.host?.trim()
  if (!host) return
  const address = host.toLowerCase()
  if (['localhost', '::1', '0.0.0.0', '::', 'remoteit-console', 'remoteit-scripts'].includes(address)) return
  if (address.startsWith('127.') || isAppService(service)) return
  if (device?.virtual && address === device.host?.trim().toLowerCase()) return
  return host
}
