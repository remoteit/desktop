import { describe, expect, it } from 'vitest'
import {
  canHost,
  isAddressOnly,
  jumpHost,
  portOf,
  servicesConfigurable,
  virtualServiceTypes,
} from './virtualDeviceHelper'

describe('virtual device rules', () => {
  it('a virtual device is offered generic TCP and UDP, which have no port of their own, and no daemon-only type', () => {
    const type = (id: number, name: string, port: number | null) =>
      ({ id, name, port, scheme: '', proxy: false, protocol: '', description: '' } as unknown as IApplicationType)
    const all = [
      type(28, 'SSH', 22),
      type(1, 'TCP', null),
      type(32769, 'UDP', null),
      type(32772, 'OpenVPN UDP', 1194),
      type(42, 'Admin Panel', 29999),
      type(48, 'ScreenView (beta)', 8959),
      type(49, 'SOCKS (beta)', 65535),
    ]
    expect(virtualServiceTypes(all).map(a => a.name)).toEqual(['SSH', 'TCP', 'UDP', 'OpenVPN UDP'])
  })

  it('a service port is one from 1 to 65535', () => {
    expect(portOf('19132')).toBe(19132)
    expect(portOf('65535')).toBe(65535)
    expect(portOf('')).toBeUndefined()
    expect(portOf('0')).toBeUndefined()
    expect(portOf('65536')).toBeUndefined()
  })

  it("graphql configures a virtual device's services, though it has no daemon to configure", () => {
    expect(servicesConfigurable({ configurable: false, virtual: true })).toBe(true)
    expect(servicesConfigurable({ configurable: true, virtual: false })).toBe(true)
    expect(servicesConfigurable({ configurable: false, virtual: false })).toBe(false)
    expect(servicesConfigurable(undefined)).toBe(false)
  })

  it('an IP address alone is one a DHCP change can move; a name is not', () => {
    expect(isAddressOnly('192.168.1.71')).toBe(true)
    expect(isAddressOnly('fe80::1')).toBe(true)
    expect(isAddressOnly('ds920.local')).toBe(false)
    expect(isAddressOnly('')).toBe(false)
  })

  it('a jump service is one whose host is another machine', () => {
    expect(jumpHost({ host: '192.168.1.20' })).toBe('192.168.1.20')
    expect(jumpHost({ host: 'router-localhost.lan' })).toBe('router-localhost.lan')
    expect(jumpHost({ host: '127.0.0.1' })).toBeUndefined()
    expect(jumpHost({ host: 'LOCALHOST' })).toBeUndefined()
    expect(jumpHost({ host: '::1' })).toBeUndefined()
    expect(jumpHost()).toBeUndefined()
  })

  it.each(['remoteit-app-remoteit-console', ' REMOTEIT-APP-REMOTEIT-FILES ', 'remoteit-console', 'remoteit-scripts'])(
    'a device serves its own app or system endpoint %s',
    host => expect(jumpHost({ host })).toBeUndefined()
  )

  it('a virtual device serves its own address', () => {
    const device = { virtual: true, host: 'Printer.local' }
    expect(jumpHost({ host: 'printer.local' }, device)).toBeUndefined()
    expect(jumpHost({ host: 'other.local' }, device)).toBe('other.local')
  })

  it('a gateway is a device with a daemon that the viewer manages', () => {
    expect(canHost({ virtual: false, permissions: ['MANAGE'] } as IDevice)).toBe(true)
    expect(canHost({ virtual: true, permissions: ['MANAGE'] } as IDevice)).toBe(false)
    expect(canHost({ permissions: ['VIEW', 'CONNECT'] } as unknown as IDevice)).toBe(false)
  })
})
