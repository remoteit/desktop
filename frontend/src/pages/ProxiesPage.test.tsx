import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { proxies, list, access } = vi.hoisted(() => ({
  proxies: vi.fn(async () => [] as any),
  list: { value: undefined as any },
  access: { manages: true },
}))
vi.mock('../services/graphQLProxy', () => ({ graphQLProxies: proxies }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
// The account's own proxies are the shared store's (hooks/useAccountStore.ts): here, what it holds.
vi.mock('../hooks/useAccountExits', () => ({ useAccountProxies: () => ({ value: list.value, reload: () => {} }) }))
vi.mock('../hooks/useDeviceDisable', () => ({ useDisabledDevicesAccess: () => access.manages }))
// A proxy's row: where it leads, its icon, its title and its line.
vi.mock('../components/ListItemLocation', () => ({
  ListItemLocation: ({ to, icon, title, subtitle, ...props }: any) => (
    <div data-proxy={props['data-proxy']} data-to={to}>
      {icon}
      <span data-title>{title}</span>
      <span data-subtitle>{subtitle}</span>
    </div>
  ),
}))
vi.mock('../components/Icon', () => ({ Icon: ({ name, color }: any) => <i data-icon={name} data-color={color} /> }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, icon, to }: any) => (
    <button data-icon={icon} data-to={to}>
      {title}
    </button>
  ),
}))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ severity, children }: any) => <div data-notice={severity ?? 'info'}>{children}</div>,
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { ProxiesPage, proxyLine, serving } from './ProxiesPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
const t = ((_key: string, a: any, b?: any) =>
  typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a)) as any

const run = (id: string, name: string | null, extra: any = {}) => ({
  id,
  name,
  state: 'ACTIVE',
  joining: false,
  checks: [],
  ...extra,
})
const GATEWAY = {
  id: 'P1',
  name: 'Gateway',
  host: 'gw-acme.dev.r3proxy.com',
  domain: null,
  remoteit: false,
  publicEndpoints: true,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  owner: { id: 'ACCOUNT', email: 'pat@example.com' },
  devices: [run('D1', 'Office Mac')],
  endpoints: 2,
  certificate: 'ready',
} as any
const NAS = {
  ...GATEWAY,
  id: 'P2',
  name: 'NAS',
  host: 'nas-acme.dev.r3proxy.com',
  devices: [],
  endpoints: 0,
  certificate: 'pending',
}
const PDX = {
  id: 'R1',
  name: 'remote.it pdx1a',
  host: 'pdx1a.dev.r3proxy.com',
  domain: null,
  remoteit: true,
  publicEndpoints: true,
  location: 'pdx1',
  provider: 'AWS us-west-2 (Boardman)',
}

async function render() {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<ProxiesPage />))
  return container
}
const row = (id: string) => document.body.querySelector(`[data-proxy="${id}"]`) as HTMLElement
const subtitle = (id: string) => row(id).querySelector('[data-subtitle]')?.textContent
const iconColor = (id: string) => row(id).querySelector('[data-icon="server"]')?.getAttribute('data-color')

beforeEach(() => {
  access.manages = true
  list.value = [GATEWAY, NAS]
  proxies.mockReset().mockResolvedValue([])
})

describe('the account’s proxies', () => {
  it('lists its own, each leading to its page, with its host, the devices it runs on, its endpoints and a certificate still to come', async () => {
    await render()
    expect(row('P1').getAttribute('data-to')).toBe('/proxies/P1')
    expect(row('P1').querySelector('[data-title]')?.textContent).toBe('Gateway')
    expect(subtitle('P1')).toBe('gw-acme.dev.r3proxy.com · Runs on Office Mac · 2 endpoints')
    expect(row('P2').getAttribute('data-to')).toBe('/proxies/P2')
    expect(subtitle('P2')).toBe('nas-acme.dev.r3proxy.com · Runs on no device · No endpoints · Certificate pending')
  })

  it('marks one serving while a device of it is in service, and not one whose devices are joining, draining or none', async () => {
    list.value = [
      GATEWAY,
      NAS,
      { ...GATEWAY, id: 'P3', devices: [run('D3', 'Spare', { joining: true })] },
      { ...GATEWAY, id: 'P4', devices: [run('D4', 'Old Mac', { state: 'DRAINING' })] },
    ]
    await render()
    expect(['P1', 'P2', 'P3', 'P4'].map(iconColor)).toEqual(['primary', 'grayDark', 'grayDark', 'grayDark'])
  })

  it('lists remote.it’s apart, by name with their host and provider, none of the account’s own among them', async () => {
    proxies.mockResolvedValue([
      PDX,
      { ...PDX, id: 'R2', name: 'remote.it sea1a', host: 'sea1a.dev.r3proxy.com', provider: '' },
      GATEWAY,
    ])
    const page = await render()
    expect(page.textContent).toContain('remote.it’s')
    const remoteit = [...page.querySelectorAll('[data-remoteit]')]
    expect(remoteit.map(item => item.getAttribute('data-remoteit'))).toEqual(['R1', 'R2'])
    const lines = remoteit.map(item => [
      item.querySelector('.MuiListItemText-primary')?.textContent,
      item.querySelector('.MuiListItemText-secondary')?.textContent,
    ])
    expect(lines).toEqual([
      ['remote.it pdx1a', 'pdx1a.dev.r3proxy.com · AWS us-west-2 (Boardman)'],
      ['remote.it sea1a', 'sea1a.dev.r3proxy.com'],
    ])
    expect(page.querySelector('[data-proxy="R1"]')).toBeNull()
  })

  it('no list of remote.it’s where none could be read, or there are none', async () => {
    proxies.mockResolvedValue('ERROR')
    expect((await render()).textContent).not.toContain('remote.it’s')
    proxies.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).not.toContain('remote.it’s')
    proxies.mockResolvedValue([GATEWAY])
    expect((await render()).querySelector('[data-remoteit]')).toBeNull()
  })

  it('offers New proxy to whoever manages devices here, and not to others', async () => {
    const page = await render()
    expect(page.querySelector('[data-icon="plus"]')?.getAttribute('data-to')).toBe('/proxies/new')
    expect(page.querySelector('[data-icon="plus"]')?.textContent).toBe('New proxy')
    access.manages = false
    expect((await render()).querySelector('[data-icon="plus"]')).toBeNull()
  })

  it('none of its own yet: says to make one, then add the devices that run it', async () => {
    list.value = []
    const page = await render()
    expect(page.querySelector('[data-proxy]')).toBeNull()
    expect(page.textContent).toContain('None yet: make a proxy, then add the devices that run it.')
  })

  it('says it is reading them, a server without proxies, and proxies that could not be read', async () => {
    list.value = undefined
    expect((await render()).querySelector('[data-loading]')).not.toBeNull()
    list.value = 'UNSUPPORTED'
    let page = await render()
    expect(page.querySelector('[data-notice="info"]')?.textContent).toBe('This server does not have proxies.')
    expect(page.querySelector('[data-proxy]')).toBeNull()
    list.value = 'ERROR'
    page = await render()
    expect(page.querySelector('[data-notice="error"]')?.textContent).toBe('The proxies could not be read.')
    expect(page.querySelector('[data-proxy]')).toBeNull()
  })
})

describe('a proxy of the account in a line', () => {
  it('serving: one of its devices in service, not joining', () => {
    expect(serving(GATEWAY)).toBe(true)
    expect(serving({ devices: [run('D1', 'Office Mac', { joining: true })] } as any)).toBe(false)
    expect(serving({ devices: [run('D1', 'Office Mac', { state: 'RETIRED' })] } as any)).toBe(false)
    expect(serving({ devices: [run('D1', 'Office Mac', { state: 'DRAINING' }), run('D2', 'Spare')] } as any)).toBe(true)
    expect(serving({ devices: null })).toBe(false)
  })

  it('its devices by name, or by id where a device has none, and its endpoint counted', () => {
    expect(proxyLine(t, { ...GATEWAY, devices: [run('D1', 'Office Mac'), run('D9', null)], endpoints: 1 })).toBe(
      'gw-acme.dev.r3proxy.com · Runs on Office Mac, D9 · 1 endpoint'
    )
  })

  it('its host alone where its devices, endpoints and certificate are not read', () => {
    expect(proxyLine(t, { ...GATEWAY, devices: null, endpoints: null, certificate: null })).toBe(
      'gw-acme.dev.r3proxy.com'
    )
  })
})
