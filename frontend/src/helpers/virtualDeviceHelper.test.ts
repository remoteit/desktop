import { describe, expect, it } from 'vitest'
import { canHost, isAddressOnly, jumpHost } from './virtualDeviceHelper'

describe('virtual device rules', () => {
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
