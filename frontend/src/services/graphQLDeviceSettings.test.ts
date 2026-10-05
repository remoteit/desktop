import { describe, it, expect, vi, beforeEach } from 'vitest'

const { uiSet, request } = vi.hoisted(() => ({ uiSet: vi.fn(), request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED } from './graphQLDaemon'
import { graphQLDeviceSettings, graphQLSetDeviceSetting, settingLocked, settingOn } from './graphQLDeviceSettings'

const subnet = {
  name: 'subnet',
  value: true,
  at: '2026-10-05T17:04:05.123Z',
  by: 'bob',
  onDevice: true,
  control: 'cloud+local',
}

beforeEach(() => {
  request.mockReset()
  uiSet.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('a device’s settings', () => {
  it('reads them from Device.settings', async () => {
    request.mockResolvedValue({ data: { data: { login: { device: [{ id: 'D', settings: [subnet] }] } } }, headers: {} })
    expect(await graphQLDeviceSettings('D')).toEqual([subnet])
  })

  it('an API without Device.settings: UNSUPPORTED, and no error banner', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "settings" on type "Device".' }] },
      headers: {},
    })
    expect(await graphQLDeviceSettings('D')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('another error: ERROR, not UNSUPPORTED', async () => {
    request.mockResolvedValue({ data: { errors: [{ message: 'Device not found' }] }, headers: {} })
    expect(await graphQLDeviceSettings('D')).toBe('ERROR')
  })

  it('sets one, and answers the row', async () => {
    request.mockResolvedValue({ data: { data: { setDeviceSetting: { ...subnet, onDevice: false } } }, headers: {} })
    expect(await graphQLSetDeviceSetting('D', 'subnet', true)).toEqual({ ...subnet, onDevice: false })
    expect(request.mock.calls[0][0].data.variables).toEqual({ deviceId: 'D', name: 'subnet', value: true })
  })

  it('a refused change: ERROR', async () => {
    request.mockResolvedValue({ data: { errors: [{ message: 'Set only on the device' }] }, headers: {} })
    expect(await graphQLSetDeviceSetting('D', 'subnet', false)).toBe('ERROR')
  })

  it('on: the control first, then the value — a boolean, exit_node’s on, any_port’s lists', () => {
    const as = (control: string, value: any) => ({ ...subnet, control, value } as any)
    expect(settingOn(as('off', true))).toBe(false)
    expect(settingOn(as('on', false))).toBe(true)
    expect(settingOn(as('cloud+local', { on: true, lan: false }))).toBe(true)
    expect(settingOn(as('cloud+local', { on: false, lan: true }))).toBe(false)
    expect(settingOn(as('cloud', { tcp: '*', udp: '' }))).toBe(true)
    expect(settingOn(as('cloud', null))).toBe(false)
    expect(settingOn(undefined)).toBe(false)
    expect(['cloud+local', 'cloud', 'local', 'off', 'on'].map(c => settingLocked(as(c, true)))).toEqual([
      false,
      false,
      true,
      true,
      true,
    ])
  })
})
