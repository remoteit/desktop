import { IP_PRIVATE } from '@common/constants'

/* Small rules a virtual device's forms share (graphql-api docs/VIRTUAL-DEVICES.md). */

// A gateway someone may put a virtual device on: a device with a daemon that they manage (graphql asks MANAGE on it).
export const canHost = (device?: IDevice) => !!device && !device.virtual && device.permissions.includes('MANAGE')

// An IP address alone: a DHCP change can move it, so the forms suggest a reservation (a .local name moves with it).
export const isAddressOnly = (host?: string) =>
  !!host && (/^\d{1,3}(\.\d{1,3}){3}$/.test(host.trim()) || (/^[0-9a-f:]+$/i.test(host.trim()) && host.includes(':')))

// A jump service: one whose host is another machine than its device (the JumpIndicator's rule).
export const jumpHost = (service?: IService): string | undefined => {
  const host = service?.host?.trim()
  if (!host || host === IP_PRIVATE || host.includes('localhost')) return
  return host
}
