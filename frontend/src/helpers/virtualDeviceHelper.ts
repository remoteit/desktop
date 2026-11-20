import { isAppService } from './appsHelper'

/* Small rules a virtual device's forms share (graphql-api docs/VIRTUAL-DEVICES.md). */

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
