import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { graphQLFetchOwnedDevices, state } = vi.hoisted(() => ({
  graphQLFetchOwnedDevices: vi.fn(),
  state: { auth: { user: { id: 'ME' } }, backend: { thisId: '' } },
}))
vi.mock('../services/graphQLDevice', () => ({ graphQLFetchOwnedDevices }))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({ useSelector: (select: (s: any) => any) => select(state) }))

import { parseOwnedDevices, useOwnedDevices, OWNED_DEVICES_SHOWN, OwnedDevices } from './useOwnedDevices'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

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

describe('useOwnedDevices', () => {
  it('refetches when this device turns up or changes, but not when it is unregistered', async () => {
    const response = (thisId: string) => ({
      data: {
        data: {
          login: { account: { devices: { total: 1, items: [] } }, device: [{ id: thisId, owner: { id: 'ME' } }] },
        },
      },
    })
    graphQLFetchOwnedDevices.mockImplementation(async (_: string, __: number, thisId: string) => response(thisId))
    let latest: OwnedDevices | undefined
    const Probe = () => {
      latest = useOwnedDevices(true).owned
      return null
    }
    const root = createRoot(document.createElement('div'))
    const render = () => act(async () => root.render(<Probe />))

    await render()
    expect(graphQLFetchOwnedDevices).toHaveBeenLastCalledWith('ME', OWNED_DEVICES_SHOWN + 1, '')

    state.backend.thisId = 'THIS'
    await render()
    expect(graphQLFetchOwnedDevices).toHaveBeenLastCalledWith('ME', OWNED_DEVICES_SHOWN + 1, 'THIS')
    expect(latest?.thisDeviceOwned).toBe(true)

    state.backend.thisId = ''
    await render()
    expect(graphQLFetchOwnedDevices).toHaveBeenCalledTimes(2)
    expect(latest?.thisDeviceOwned).toBe(true)
    act(() => root.unmount())
  })
})
