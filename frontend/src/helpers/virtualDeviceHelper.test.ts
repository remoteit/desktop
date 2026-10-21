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
    expect(jumpHost({ host: '192.168.1.20' } as IService)).toBe('192.168.1.20')
    expect(jumpHost({ host: '127.0.0.1' } as IService)).toBeUndefined()
    expect(jumpHost({ host: 'localhost' } as IService)).toBeUndefined()
    expect(jumpHost({} as IService)).toBeUndefined()
  })

  it('a gateway is a device with a daemon that the viewer manages', () => {
    expect(canHost({ virtual: false, permissions: ['MANAGE'] } as IDevice)).toBe(true)
    expect(canHost({ virtual: true, permissions: ['MANAGE'] } as IDevice)).toBe(false)
    expect(canHost({ permissions: ['VIEW', 'CONNECT'] } as unknown as IDevice)).toBe(false)
  })
})
