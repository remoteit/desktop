import { describe, it, expect, vi, beforeEach } from 'vitest'

const { graphQLBasicRequest } = vi.hoisted(() => ({ graphQLBasicRequest: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest }))

import * as products from './graphQLDeviceProducts'

beforeEach(() => graphQLBasicRequest.mockReset())

const query = () => graphQLBasicRequest.mock.calls[0][0] as string
const variables = () => graphQLBasicRequest.mock.calls[0][1]
const visu = { name: 'Visu', type: '8', host: '192.168.1.50', port: 8080, enabled: true }

describe('product service templates carry their host', () => {
  const requests: [string, () => Promise<unknown>][] = [
    ['deviceProducts', () => products.graphQLDeviceProducts()],
    ['deviceProduct', () => products.graphQLDeviceProduct('p1')],
    ['addDeviceProductService', () => products.graphQLAddDeviceProductService('p1', visu)],
  ]

  it.each(requests)('%s selects each service host', async (_name, request) => {
    await request()
    expect(query()).toMatch(/type \{ id name \} host port/)
  })

  it('addDeviceProductService sends the host', async () => {
    await products.graphQLAddDeviceProductService('p1', visu)
    expect(query()).toContain('host: $host')
    expect(variables()).toMatchObject({ productId: 'p1', host: '192.168.1.50' })
  })
})
