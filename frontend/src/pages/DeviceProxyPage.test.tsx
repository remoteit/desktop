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
vi.mock('../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({}))

import { newProxyFields, PROXY_NAME_FILTER, proxyDomain, proxyHostPreview, proxyListeningLine } from './DeviceProxyPage'
import type { Proxy } from '../services/graphQLProxy'
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

describe('naming a proxy', () => {
  it('a name is letters and digits only: a dash is filtered out as it is typed, as graphql refuses one', () => {
    expect('Gw-1_x'.replace(PROXY_NAME_FILTER, '')).toBe('w1x')
  })

  it('made a proxy with the name typed before, or none for graphql to name it after the device', () => {
    expect(newProxyFields('')).toEqual({})
    expect(newProxyFields('  ')).toEqual({})
    expect(newProxyFields(' Gw ')).toEqual({ name: 'gw' })
  })

  it('shows where it will be reached: the name, or the device’s DNS name, before the slug, under the proxy domain', () => {
    const proxies = [
      { kind: 'own', host: 'nas-acme-corp.dev.r3proxy.com' },
      { kind: 'remoteit', host: 'e1.dev.r3proxy.com' },
    ] as Proxy[]
    const domain = proxyDomain(proxies)
    expect(domain).toBe('dev.r3proxy.com')
    expect(proxyHostPreview('kitchenpi-acme-corp.on.dev.remote.it', domain, '')).toBe(
      'kitchenpi-acme-corp.dev.r3proxy.com'
    )
    expect(proxyHostPreview('kitchenpi-acme-corp.on.dev.remote.it', domain, 'Gw')).toBe('gw-acme-corp.dev.r3proxy.com')
    expect(proxyDomain([])).toBeUndefined()
    expect(proxyHostPreview(undefined, domain, 'gw')).toBeUndefined()
    expect(proxyHostPreview('kitchenpi-acme-corp.on.dev.remote.it', undefined, 'gw')).toBeUndefined()
  })
})
