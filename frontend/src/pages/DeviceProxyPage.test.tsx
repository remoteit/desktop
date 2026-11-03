import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { proxies, usage } = vi.hoisted(() => ({
  proxies: vi.fn(async () => [] as any),
  usage: vi.fn(async (_accountId?: string) => [] as any),
}))
vi.mock('../selectors/state', () => ({ getUserAdmin: () => false, getActiveId: () => 'ACTIVE' }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLProxies: proxies,
  graphQLProxyPublicExit: async () => false,
}))
vi.mock('../services/transferUsage', () => ({ fetchTransferUsage: usage, UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('../components/ProxyAccessList', () => ({ ProxyAccessList: () => null }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../components/DeviceHeaderMenu', () => ({ DeviceHeaderMenu: ({ children }: any) => <>{children}</> }))
vi.mock('../components/DeviceExitSection', () => ({ DeviceExitOffer: () => null }))
vi.mock('../components/InlineTextFieldSetting', () => ({ InlineTextFieldSetting: () => null }))
vi.mock('../components/ListItemSetting', () => ({ ListItemSetting: () => null }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => null }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Notice', () => ({ Notice: () => null }))
vi.mock('../components/SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({ setting: () => undefined, reload: async () => {} }),
}))
vi.mock('../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({}))

import {
  DeviceProxyPage,
  newProxyFields,
  PROXY_NAME_FILTER,
  proxyDomain,
  proxyHostPreview,
  proxyListeningLine,
} from './DeviceProxyPage'
import { DeviceContext } from '../services/Context'
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

describe('the account’s public-proxy transfer, on one of remote.it’s public proxies', () => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const resetsAt = '2026-12-01T00:00:00.000Z'
  const resets = new Date(resetsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const row = (fields = {}) => ({
    kind: 'proxy',
    month: '2026-11',
    usedBytes: 8.2e9,
    allowanceBytes: 10e9,
    rateBps: 5e6,
    over: false,
    resetsAt,
    devices: [],
    ...fields,
  })
  const proxy = (kind: 'remoteit' | 'own') =>
    ({
      id: 'PROXY',
      kind,
      region: null,
      host: 'e1.dev.r3proxy.com',
      name: null,
      domain: null,
      publicEndpoints: true,
      manage: false,
      certificate: 'ready',
    } as Proxy)

  async function render(kind: 'remoteit' | 'own', owner: { id: string } | null = { id: 'OWNER' }) {
    proxies.mockResolvedValue([proxy(kind)])
    const device = { id: 'PROXY', permissions: [], shared: false, owner } as any
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () =>
      root.render(
        <DeviceContext.Provider value={{ device } as any}>
          <DeviceProxyPage />
        </DeviceContext.Provider>
      )
    )
    await act(async () => {})
    return container
  }
  const hint = (c: HTMLElement) => c.querySelector('[data-testid="transfer-usage-hint"]')

  it.each([
    ['with an allowance', row(), '8.2 of 10 GB this month'],
    ['over it', row({ usedBytes: 12e9, over: true }), `Slowed to 5 Mbit/s until ${resets}`],
    ['with no allowance', row({ allowanceBytes: null }), '8.2 GB this month'],
  ])('%s: the device owner’s', async (_, answer, text) => {
    usage.mockReset().mockResolvedValue([answer])
    const page = await render('remoteit')
    expect(usage).toHaveBeenCalledTimes(1)
    expect(usage).toHaveBeenCalledWith('OWNER')
    expect(hint(page)!.textContent).toBe(text)
    expect(hint(page)!.getAttribute('data-over')).toBe(answer.over ? 'true' : null)
  })

  it('the active account’s where the device’s owner is not known', async () => {
    usage.mockReset().mockResolvedValue([row()])
    await render('remoteit', null)
    expect(usage).toHaveBeenCalledWith('ACTIVE')
  })

  it('nothing on a proxy not remote.it’s, and nothing asked', async () => {
    usage.mockReset().mockResolvedValue([row()])
    expect(hint(await render('own'))).toBeNull()
    expect(usage).not.toHaveBeenCalled()
  })

  it('nothing where the usage cannot be read', async () => {
    usage.mockReset().mockRejectedValue(new Error('network'))
    expect(hint(await render('remoteit'))).toBeNull()
    for (const answer of ['ERROR', 'UNSUPPORTED', [], [{ ...row(), kind: 'exit' }]]) {
      usage.mockReset().mockResolvedValue(answer)
      expect(hint(await render('remoteit'))).toBeNull()
    }
  })
})
