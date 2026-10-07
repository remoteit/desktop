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
import {
  graphQLDeviceSettings,
  graphQLDeviceWebsocket,
  graphQLSetDeviceSetting,
  settingLocked,
  settingOn,
  websocketMode,
} from './graphQLDeviceSettings'

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

  it('declares its variables in graphql’s own types: the value is Any', async () => {
    request.mockResolvedValue({ data: { data: { setDeviceSetting: subnet } }, headers: {} })
    await graphQLSetDeviceSetting('D', 'exit_node', { on: true, lan: false })
    const { query } = request.mock.calls[0][0].data
    expect(query).toMatch(/mutation SetDeviceSetting\(\$deviceId: String!, \$name: String!, \$value: Any\)/)
    expect(query).toMatch(/setDeviceSetting\(deviceId: \$deviceId, name: \$name, value: \$value\)/)
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
    expect(['cloud+local', 'cloud', 'local', 'off', 'on', 'auto'].map(c => settingLocked(as(c, true)))).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
    ])
  })
})

describe('the websocket setting', () => {
  const websocket = (control: string, value: any) => ({ ...subnet, name: 'websocket', control, value } as any)

  it('its mode: what the control fixes, else the value, else auto', () => {
    expect(websocketMode(websocket('cloud+local', 'on'))).toBe('on')
    expect(websocketMode(websocket('local', 'off'))).toBe('off')
    expect(websocketMode(websocket('off', 'on'))).toBe('off')
    expect(websocketMode(websocket('on', 'off'))).toBe('on')
    expect(websocketMode(websocket('auto', 'on'))).toBe('auto')
    expect(websocketMode(websocket('cloud', null))).toBe('auto')
    expect(websocketMode(websocket('cloud', 'sideways'))).toBe('auto')
    expect(websocketMode(undefined)).toBe('auto')
  })

  it('reads the reflector’s state from Device.about.websocket', async () => {
    const state = { mode: 'auto', using: true, since: '2026-10-06T17:04:05.123Z' }
    request.mockResolvedValue({
      data: { data: { login: { device: [{ id: 'D', about: { websocket: state } }] } } },
      headers: {},
    })
    expect(await graphQLDeviceWebsocket('D')).toEqual(state)
    expect(request.mock.calls[0][0].data.query).toMatch(/about \{ websocket \{ mode using since \} \}/)
  })

  it('not reported: null', async () => {
    for (const device of [
      { id: 'D', about: null },
      { id: 'D', about: { websocket: null } },
    ]) {
      request.mockResolvedValue({ data: { data: { login: { device: [device] } } }, headers: {} })
      expect(await graphQLDeviceWebsocket('D')).toBeNull()
    }
  })

  it('an API without about, or without websocket in it: UNSUPPORTED, no error banner', async () => {
    for (const message of [
      'Cannot query field "about" on type "Device".',
      'Cannot query field "websocket" on type "DeviceAbout".',
    ]) {
      request.mockResolvedValue({ data: { errors: [{ message }] }, headers: {} })
      expect(await graphQLDeviceWebsocket('D')).toBe(UNSUPPORTED)
    }
    expect(uiSet).not.toHaveBeenCalled()
  })
})
