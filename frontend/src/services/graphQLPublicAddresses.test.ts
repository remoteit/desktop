import { describe, it, expect, vi } from 'vitest'

vi.mock('./post', () => ({ post: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLGetErrors: vi.fn() }))
vi.mock('./graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('../selectors/signIns', () => ({ noteAccountOf: vi.fn() }))
vi.mock('./graphQLProxy', () => ({ ENDPOINT_FIELDS: '' }))
import { publicAddressesOf } from './graphQLPublicAddresses'

const endpoint = (id: string, created: string) => ({
  id,
  serviceId: 'S',
  proxy: { id: 'P', name: 'remote.it pdx1a', host: 'pdx1a-r3.example', remoteit: true, local: false },
  kind: 'https' as const,
  lifetime: 'permanent' as const,
  access: 'signed-in' as const,
  lockedIp: null,
  allow: null,
  host: `${id}.example`,
  port: null,
  url: `https://${id}.example`,
  localAddresses: [],
  created,
  expires: null,
})

describe('publicAddressesOf', () => {
  it('lists every service’s addresses across devices, by device then service then age', () => {
    const read = publicAddressesOf({
      total: 3,
      items: [
        { id: 'D2', name: 'nas', services: [{ id: 'S2', name: 'Web', endpoints: [endpoint('b', '2026-11-02')] }] },
        {
          id: 'D1',
          name: 'gateway',
          services: [
            { id: 'S1', name: 'SSH', endpoints: [] },
            { id: 'S3', name: 'Admin', endpoints: [endpoint('c', '2026-11-03'), endpoint('a', '2026-11-01')] },
          ],
        },
        { id: 'D3', name: 'pi', services: null },
      ],
    })
    expect(read.addresses.map(address => [address.id, address.device.name, address.service.name])).toEqual([
      ['a', 'gateway', 'Admin'],
      ['c', 'gateway', 'Admin'],
      ['b', 'nas', 'Web'],
    ])
    expect(read.devices).toBe(3)
    expect(read.total).toBe(3)
  })

  it('is empty when nothing has an address, and says when the account has more devices than were read', () => {
    const read = publicAddressesOf({ total: 2500, items: [{ id: 'D', name: 'pi', services: [{ id: 'S', name: 'Web' }] }] })
    expect(read.addresses).toEqual([])
    expect(read.total).toBeGreaterThan(read.devices)
    expect(publicAddressesOf(null)).toEqual({ addresses: [], devices: 0, total: 0 })
  })
})
