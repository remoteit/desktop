import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import {
  deviceSessionInfo,
  requestDeviceSessionInfo,
  resetDeviceSessionInfo,
  subscribeDeviceSessionInfo,
} from './deviceSessionInfo'

const settled = () =>
  new Promise<void>(resolve => {
    const stop = subscribeDeviceSessionInfo(() => {
      stop()
      resolve()
    })
  })

beforeEach(() => {
  resetDeviceSessionInfo()
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('device session info', () => {
  it('reads every row that asks in the same moment in one query, and keeps them', async () => {
    request.mockResolvedValue({
      data: {
        data: {
          login: {
            device: [
              {
                id: 'A',
                subnetName: 'kitchen-pi.acme.on.remote.it',
                actsFor: null,
                agent: { running: 'connectd-go 5.6.1.1', update: null },
              },
              { id: 'B', subnetName: 'laptop.acme.on.remote.it', actsFor: { email: 'ada@acme.test' }, agent: null },
            ],
          },
        },
      },
      headers: {},
    })
    const done = settled()
    requestDeviceSessionInfo('A')
    requestDeviceSessionInfo('B')
    requestDeviceSessionInfo('C')
    await done
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0].data.query).toContain('["A","B","C"]')
    expect(deviceSessionInfo('A')).toEqual({
      subnetName: 'kitchen-pi.acme.on.remote.it',
      actsFor: null,
      agent: { running: 'connectd-go 5.6.1.1', update: null },
    })
    expect(deviceSessionInfo('B')).toEqual({
      subnetName: 'laptop.acme.on.remote.it',
      actsFor: 'ada@acme.test',
      agent: null,
    })
    expect(deviceSessionInfo('C')).toEqual({ subnetName: null, actsFor: null, agent: null }) // asked, not answered: none, and not asked again
    requestDeviceSessionInfo('A')
    requestDeviceSessionInfo('C')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('an API without the field is asked once', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "actsFor" on type "Device".' }] },
      headers: {},
    })
    const done = settled()
    requestDeviceSessionInfo('A')
    await done
    expect(deviceSessionInfo('A')).toEqual({ subnetName: null, actsFor: null, agent: null })
    requestDeviceSessionInfo('B')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(request).toHaveBeenCalledTimes(1)
  })
})
