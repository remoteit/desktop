import { describe, it, expect, vi } from 'vitest'

vi.mock('../selectors/state', () => ({ getUserAdmin: () => false }))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../services/graphQLProxy', () => ({}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../components/DeviceHeaderMenu', () => ({ DeviceHeaderMenu: () => null }))
vi.mock('../components/DeviceExitSection', () => ({ DeviceExitOffer: () => null }))
vi.mock('../components/InlineTextFieldSetting', () => ({ InlineTextFieldSetting: () => null }))
vi.mock('../components/ListItemSetting', () => ({ ListItemSetting: () => null }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => null }))
vi.mock('../components/Gutters', () => ({ Gutters: () => null }))
vi.mock('../components/Notice', () => ({ Notice: () => null }))
vi.mock('../components/SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('../hooks/useDeviceSettings', () => ({ useDeviceSettings: vi.fn() }))

import { proxyListeningLine } from './DeviceProxyPage'
import type { DeviceSetting, DeviceSettingControl } from '../services/graphQLDeviceSettings'

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const proxySetting = (
  value: boolean,
  control: DeviceSettingControl,
  more: Partial<DeviceSetting> = {}
): DeviceSetting => ({
  name: 'proxy',
  value,
  at: '2026-10-05T17:04:05.123Z',
  by: null,
  onDevice: false,
  control,
  ...more,
})

describe('the proxy’s listening, where it disagrees with its being a proxy', () => {
  it('none where they agree, or where the API has no device settings', () => {
    expect(proxyListeningLine(t, true, proxySetting(true, 'cloud+local'))).toBeUndefined()
    expect(proxyListeningLine(t, false, proxySetting(false, 'cloud+local'))).toBeUndefined()
    expect(proxyListeningLine(t, true, undefined)).toBeUndefined()
  })

  it('a proxy not listening: why, from its control and who set it on the device', () => {
    expect(proxyListeningLine(t, true, proxySetting(true, 'off'))).toBe(
      'Not listening: turned off on the device by its administrator'
    )
    expect(proxyListeningLine(t, true, proxySetting(false, 'local', { onDevice: true, by: 'bob' }))).toBe(
      'Not listening: set only on the device, which keeps it off'
    )
    expect(proxyListeningLine(t, true, proxySetting(false, 'cloud+local', { onDevice: true, by: 'bob' }))).toBe(
      'Not listening: turned off on the device by bob'
    )
    expect(
      proxyListeningLine(t, true, proxySetting(false, 'cloud+local', { onDevice: true, by: 'configuration' }))
    ).toBe("Not listening: turned off in the device's configuration")
  })

  it('listening, though not a proxy', () => {
    expect(proxyListeningLine(t, false, proxySetting(false, 'on'))).toBe(
      'Listening, though not a proxy: turned on on the device by its administrator'
    )
    expect(proxyListeningLine(t, false, proxySetting(true, 'cloud+local', { onDevice: true, by: 'bob' }))).toBe(
      'Listening, though not a proxy: turned on on the device by bob'
    )
  })
})
