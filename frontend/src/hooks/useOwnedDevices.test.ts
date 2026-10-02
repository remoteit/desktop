import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/graphQLDevice', () => ({ graphQLFetchOwnedDevices: vi.fn() }))
vi.mock('../store', () => ({}))

import { parseOwnedDevices, OWNED_DEVICES_SHOWN } from './useOwnedDevices'

const device = (id: string, state = 'active') => ({ id, name: id, state, platform: 0 })

describe('parseOwnedDevices', () => {
  it('takes this device out of the list and the count when the person owns it', () => {
    const login = {
      account: { devices: { total: 3, items: [device('A'), device('THIS'), device('B', 'inactive')] } },
      device: [{ id: 'THIS', owner: { id: 'ME' } }],
    }
    expect(parseOwnedDevices(login, 'ME', 'THIS')).toEqual({
      devices: [device('A'), device('B', 'inactive')],
      total: 2,
      thisDeviceOwned: true,
    })
  })

  it('leaves the count alone when this device belongs to someone else', () => {
    const login = {
      account: { devices: { total: 2, items: [device('A'), device('B')] } },
      device: [{ id: 'THIS', owner: { id: 'SOMEONE' } }],
    }
    expect(parseOwnedDevices(login, 'ME', 'THIS')).toMatchObject({ total: 2, thisDeviceOwned: false })
  })

  it('shows at most the first page whether or not this device was in it', () => {
    const items = Array.from({ length: OWNED_DEVICES_SHOWN + 1 }, (_, i) => device(`D${i}`))
    const parsed = parseOwnedDevices({ account: { devices: { total: 40, items } } }, 'ME')
    expect(parsed.devices).toHaveLength(OWNED_DEVICES_SHOWN)
    expect(parsed).toMatchObject({ total: 40, thisDeviceOwned: false })
  })

  it('treats a missing response as no devices', () => {
    expect(parseOwnedDevices(undefined, 'ME', 'THIS')).toEqual({ devices: [], total: 0, thisDeviceOwned: false })
  })
})
