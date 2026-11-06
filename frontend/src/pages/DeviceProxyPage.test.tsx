import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { proxies, removeProxy, deviceGroup, deleteGroup, exitNode } = vi.hoisted(() => ({
  proxies: vi.fn(async () => [] as any),
  removeProxy: vi.fn(async (_id: string) => ({} as any)),
  deviceGroup: vi.fn(async (_id: string) => null as any),
  deleteGroup: vi.fn(async (_label: string, _confirm: boolean) => ({} as any)),
  exitNode: { setting: undefined as any },
}))
vi.mock('../selectors/state', () => ({ getUserAdmin: () => false, getActiveId: () => 'ACTIVE' }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLProxies: proxies,
  graphQLProxyPublicExit: async () => false,
  graphQLRemoveProxy: removeProxy,
}))
vi.mock('../services/graphQLProxyGroups', () => ({
  graphQLDeviceGroup: deviceGroup,
  graphQLDeleteProxyGroup: deleteGroup,
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('../components/ProxyAccessList', () => ({ ProxyAccessList: () => null }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../components/DeviceHeaderMenu', () => ({ DeviceHeaderMenu: ({ children }: any) => <>{children}</> }))
vi.mock('../components/DeviceExitSection', () => ({ DeviceExitOffer: () => null }))
vi.mock('../components/InlineTextFieldSetting', () => ({ InlineTextFieldSetting: () => null }))
// A switch, as a button: what clicking it does, and the confirmation it asks first, if any.
vi.mock('../components/ListItemSetting', () => ({
  ListItemSetting: ({ label, toggle, confirm, confirmProps, onClick }: any) =>
    toggle === undefined ? null : (
      <button data-toggle data-confirm={confirm ? confirmProps?.children : ''} onClick={onClick}>
        {label}
      </button>
    ),
}))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => null }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({
    setting: (name: string) => (name === 'exit_node' ? exitNode.setting : undefined),
    reload: async () => {},
  }),
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

describe('the page itself', () => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

  it('renders a proxy’s page, remote.it’s or one’s own, without an error', async () => {
    for (const kind of ['remoteit', 'own'] as const) {
      proxies.mockClear().mockResolvedValue([
        {
          id: 'PROXY',
          kind,
          region: null,
          host: 'e1.dev.r3proxy.com',
          name: null,
          domain: null,
          publicEndpoints: true,
          manage: false,
          certificate: 'ready',
        } as Proxy,
      ])
      const device = { id: 'PROXY', permissions: [], shared: false, owner: { id: 'OWNER' } } as any
      const container = document.createElement('div')
      await act(async () =>
        createRoot(container).render(
          <DeviceContext.Provider value={{ device } as any}>
            <DeviceProxyPage />
          </DeviceContext.Provider>
        )
      )
      await act(async () => {})
      expect(proxies).toHaveBeenCalledTimes(1)
      expect(container.querySelector('.MuiListSubheader-root')).not.toBeNull()
    }
  })
})

describe('stopping the last device in its group being a proxy', () => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const own = {
    id: 'GW',
    kind: 'own',
    region: null,
    host: 'gw-acme.dev.r3proxy.com',
    name: 'gw',
    domain: null,
    publicEndpoints: true,
    manage: true,
    certificate: 'ready',
  } as Proxy
  const member = (id: string) => ({ id, name: id, kind: 'own', state: 'active' })
  const office = (members = [member('GW')]) => ({
    label: 'gabc123',
    name: 'Office gateway',
    remoteit: false,
    host: own.host,
    members,
    users: 2,
    endpoints: 3,
  })
  const toggle = (c: HTMLElement) => c.querySelector('[data-toggle]') as HTMLButtonElement
  const button = (text: string) =>
    [...document.body.querySelectorAll('button')].find(b => b.textContent?.includes(text)) as HTMLButtonElement

  async function page() {
    document.body.innerHTML = ''
    proxies.mockResolvedValue([own])
    removeProxy.mockClear()
    deleteGroup.mockClear().mockResolvedValue({})
    const device = {
      id: 'GW',
      name: 'Office gateway',
      permissions: ['MANAGE'],
      shared: false,
      owner: { id: 'OWNER' },
    } as any
    const container = document.createElement('div')
    document.body.appendChild(container)
    await act(async () =>
      createRoot(container).render(
        <DeviceContext.Provider value={{ device } as any}>
          <DeviceProxyPage />
        </DeviceContext.Provider>
      )
    )
    await act(async () => {})
    return container
  }

  it('asks whether to delete the group too, naming it and what it has; keeping it is the default', async () => {
    exitNode.setting = undefined
    deviceGroup.mockResolvedValue(office())
    const container = await page()
    expect(toggle(container).dataset.confirm).toBe('') // no plain confirmation: the group's own question instead
    await act(async () => toggle(container).click())
    expect(document.body.textContent).toContain('Stop using Office gateway as a proxy?')
    expect(document.body.textContent).toContain('It is the last device in its group, Office gateway.')
    expect(document.body.textContent).toContain('2 devices use it as their exit, and it has 3 endpoints.')
    expect(button('Keep the group').className).toContain('MuiButton-contained')
    await act(async () => button('Keep the group').click())
    expect(removeProxy).toHaveBeenCalledWith('GW')
    expect(deleteGroup).not.toHaveBeenCalled()
  })

  it('deleting the group too: the proxy goes, then its group, confirmed; a refusal is said', async () => {
    exitNode.setting = undefined
    deviceGroup.mockResolvedValue(office())
    let container = await page()
    await act(async () => toggle(container).click())
    await act(async () => button('Delete the group too').click())
    expect(removeProxy).toHaveBeenCalledWith('GW')
    expect(deleteGroup).toHaveBeenCalledWith('gabc123', true)

    container = await page()
    deleteGroup.mockResolvedValue({ reason: 'A device joined Office gateway meanwhile: it is not deleted' })
    await act(async () => toggle(container).click())
    await act(async () => button('Delete the group too').click())
    expect(document.body.textContent).toContain('A device joined Office gateway meanwhile')
  })

  it('not the last device, or staying in its group as an exit: a plain confirmation says what happens to the group', async () => {
    deviceGroup.mockResolvedValue(office([member('GW'), member('GW2')]))
    let container = await page()
    expect(toggle(container).dataset.confirm).toBe(
      'The other devices in its group, Office gateway, go on serving its endpoints.'
    )
    await act(async () => toggle(container).click())
    expect(document.body.textContent).not.toContain('Keep the group')
    expect(removeProxy).toHaveBeenCalledWith('GW')

    exitNode.setting = { name: 'exit_node', value: { on: true, lan: false }, control: 'cloud+local' }
    deviceGroup.mockResolvedValue(office())
    container = await page()
    expect(toggle(container).dataset.confirm).toContain('It stays in its group, Office gateway, as an exit.')
    exitNode.setting = undefined
  })
})
