import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { requestSubnetName, resetSubnetNames, subnetName, subscribeSubnetNames } from './subnetNames'

const settled = () =>
  new Promise<void>(resolve => {
    const stop = subscribeSubnetNames(() => {
      stop()
      resolve()
    })
  })

beforeEach(() => {
  resetSubnetNames()
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('subnet names', () => {
  it('reads every row that asks in the same moment in one query, and keeps them', async () => {
    request.mockResolvedValue({
      data: {
        data: {
          login: {
            device: [
              { id: 'A', subnetName: 'kitchen-pi.acme.on.remote.it' },
              { id: 'B', subnetName: 'laptop.acme.on.remote.it' },
            ],
          },
        },
      },
      headers: {},
    })
    const done = settled()
    requestSubnetName('A')
    requestSubnetName('B')
    requestSubnetName('C')
    await done
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0].data.query).toContain('["A","B","C"]')
    expect(subnetName('A')).toBe('kitchen-pi.acme.on.remote.it')
    expect(subnetName('C')).toBe(null) // asked, not answered: none, and not asked again
    requestSubnetName('A')
    requestSubnetName('C')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('an API without the field is asked once', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "subnetName" on type "Device".' }] },
      headers: {},
    })
    const done = settled()
    requestSubnetName('A')
    await done
    expect(subnetName('A')).toBe(null)
    requestSubnetName('B')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(request).toHaveBeenCalledTimes(1)
  })
})
