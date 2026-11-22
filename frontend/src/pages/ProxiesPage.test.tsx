import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { proxies, list, base, access, pushed } = vi.hoisted(() => ({
  pushed: vi.fn(),
  proxies: vi.fn(async () => [] as any),
  list: { value: undefined as any },
  base: { value: null as any },
  access: { manages: true, admin: true },
}))
vi.mock('../services/graphQLProxy', () => ({ graphQLProxies: proxies }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: pushed }) }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
// The account's own proxies and its base are the shared store's (hooks/useAccountStore.ts): here, what it holds.
vi.mock('../hooks/useAccountExits', () => ({
  useAccountProxies: () => ({ value: list.value, reload: () => {} }),
  useAccountProxyBase: () => ({ value: base.value, reload: () => {} }),
}))
vi.mock('../hooks/useDeviceDisable', () => ({ useDisabledDevicesAccess: () => access.manages }))
vi.mock('../hooks/useAccountAdmin', () => ({ useAccountAdmin: () => access.admin }))
// A proxy's row: where it leads, its icon, its title and its line.
vi.mock('../components/ListItemLocation', () => ({
  ListItemLocation: ({ to, icon, title, subtitle, ...props }: any) => (
    <div data-proxy={props['data-proxy']} data-remoteit={props['data-remoteit']} data-to={to}>
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

import { ProxiesPage, ownNameLine, proxyLine, serving } from './ProxiesPage'
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
  remoteit: false,
  local: false,
  localNetwork: null,
  publicEndpoints: true,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  owner: { id: 'ACCOUNT', email: 'pat@example.com' },
  devices: [run('D1', 'Office Mac')],
  endpointCount: 2,
  certificate: 'ready',
} as any
const NAS = {
  ...GATEWAY,
  id: 'P2',
  name: 'NAS',
  host: 'nas-acme.dev.r3proxy.com',
  devices: [],
  endpointCount: 0,
  certificate: 'pending',
}
const PDX = {
  id: 'R1',
  name: 'remote.it pdx1a',
  host: 'pdx1a-r3.dev.r3proxy.com',
  remoteit: true,
  local: false,
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
  pushed.mockReset()
  access.manages = true
  access.admin = true
  base.value = null
  list.value = [GATEWAY, NAS]
  proxies.mockReset().mockResolvedValue([])
})

describe('the account’s proxies', () => {
  it('lists your own, each leading to its page, whether it is ready and where it runs, its public addresses, its host and a certificate still to come', async () => {
    await render()
    expect(row('P1').getAttribute('data-to')).toBe('/proxies/P1')
    expect(row('P1').querySelector('[data-title]')?.textContent).toBe('Gateway')
    expect(subtitle('P1')).toBe('Ready · on Office Mac · 2 public addresses · gw-acme.dev.r3proxy.com')
    expect(row('P2').getAttribute('data-to')).toBe('/proxies/P2')
    expect(subtitle('P2')).toBe('No device yet · nas-acme.dev.r3proxy.com · Certificate pending')
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

  it('marks one reached on its devices’ own network only beside its name; an Internet one is not marked', async () => {
    list.value = [GATEWAY, { ...NAS, local: true, localNetwork: '192.168.1.0/24' }]
    await render()
    expect(row('P1').querySelector('[data-title]')?.textContent).toBe('Gateway')
    expect(row('P1').querySelector('[data-local]')).toBeNull()
    expect(row('P2').querySelector('[data-title]')?.textContent).toBe('NASLocal network')
    expect(row('P2').querySelector('[data-local]')?.textContent).toBe('Local network')
  })

  it('a device out of service — failing its network check, or not reachable from the internet — is not serving', async () => {
    const offNetwork = [{ name: 'network', passed: false, pending: false, reason: 'Laptop is on another network' }]
    list.value = [
      { ...GATEWAY, id: 'P5', devices: [run('D5', 'Laptop', { checks: offNetwork })] },
      { ...GATEWAY, id: 'P6', devices: [run('D6', 'Pi', { reachable: false, reachReason: 'connect timed out' })] },
      { ...GATEWAY, id: 'P7', devices: [run('D7', 'Mini', { reachable: true })] },
    ]
    await render()
    expect(['P5', 'P6', 'P7'].map(iconColor)).toEqual(['grayDark', 'grayDark', 'primary'])
  })

  it('lists Remote.It’s apart and labelled, each opening on its page by where it is, none of the account’s own among them', async () => {
    proxies.mockResolvedValue([
      PDX,
      { ...PDX, id: 'R2', name: 'remote.it sea1a', host: 'sea1a-r3.dev.r3proxy.com', provider: '' },
      GATEWAY,
    ])
    const page = await render()
    expect(page.textContent).toContain('Remote.It proxy servers')
    const remoteit = [...page.querySelectorAll('[data-remoteit]')]
    expect(remoteit.map(item => item.getAttribute('data-remoteit'))).toEqual(['R1', 'R2'])
    expect(remoteit.map(item => item.getAttribute('data-to'))).toEqual(['/proxies/R1', '/proxies/R2'])
    const lines = remoteit.map(item => [
      item.querySelector('[data-title]')?.textContent,
      item.querySelector('[data-subtitle]')?.textContent,
    ])
    expect(lines).toEqual([
      ['remote.it pdx1a', 'pdx1 · Run by Remote.It'],
      ['remote.it sea1a', 'pdx1 · Run by Remote.It'],
    ])
    expect(page.querySelector('[data-proxy="R1"]')).toBeNull()
  })

  it('no list of remote.it’s where none could be read, or there are none', async () => {
    proxies.mockResolvedValue('ERROR')
    expect((await render()).textContent).not.toContain('Remote.It proxy servers')
    proxies.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).not.toContain('Remote.It proxy servers')
    proxies.mockResolvedValue([GATEWAY])
    expect((await render()).querySelector('[data-remoteit]')).toBeNull()
  })

  it('offers Create proxy server to whoever manages devices here, and not to others', async () => {
    const page = await render()
    const create = page.querySelector('[data-create]') as HTMLButtonElement
    expect(create.textContent).toBe('Create proxy server')
    await act(async () => create.click())
    expect(pushed).toHaveBeenCalledWith('/proxies/new')
    access.manages = false
    expect((await render()).querySelector('[data-create]')).toBeNull()
  })

  it('none of its own yet: says Remote.It’s are used until one is made', async () => {
    list.value = []
    const page = await render()
    expect(page.querySelector('[data-proxy]')).toBeNull()
    expect(page.textContent).toContain('No proxy servers yet. Your public addresses use Remote.It’s until you create one.')
  })

  it('says it is reading them, a server without proxies, and proxies that could not be read', async () => {
    list.value = undefined
    expect((await render()).querySelector('[data-loading]')).not.toBeNull()
    list.value = 'UNSUPPORTED'
    let page = await render()
    expect(page.querySelector('[data-notice="info"]')?.textContent).toBe('Proxy servers aren’t available on this server.')
    expect(page.querySelector('[data-proxy]')).toBeNull()
    list.value = 'ERROR'
    page = await render()
    expect(page.querySelector('[data-notice="error"]')?.textContent).toBe('Couldn’t load your proxy servers. Try again.')
    expect(page.querySelector('[data-proxy]')).toBeNull()
  })
})

describe('a proxy of the account in a line', () => {
  it('serving: one of its devices in service, not joining, disabled or out of service', () => {
    expect(serving(GATEWAY)).toBe(true)
    expect(serving({ devices: [run('D1', 'Office Mac', { joining: true })] } as any)).toBe(false)
    expect(serving({ devices: [run('D1', 'Office Mac', { state: 'RETIRED' })] } as any)).toBe(false)
    expect(serving({ devices: [run('D1', 'Office Mac', { state: 'DRAINING' }), run('D2', 'Spare')] } as any)).toBe(true)
    expect(serving({ devices: [run('D1', 'Office Mac', { disabled: true })] } as any)).toBe(false)
    expect(serving({ devices: [run('D1', 'Office Mac', { reachable: false })] } as any)).toBe(false)
    expect(serving({ devices: [run('D1', 'Office Mac', { reachable: false }), run('D2', 'Spare')] } as any)).toBe(true)
    const failed = [{ name: 'network', passed: false, pending: false, reason: 'on another network' }]
    expect(serving({ devices: [run('D1', 'Office Mac', { checks: failed })] } as any)).toBe(false)
    const waits = [{ name: 'policy', passed: false, pending: true, reason: 'waits for its machine' }]
    expect(serving({ devices: [run('D1', 'Office Mac', { checks: waits })] } as any)).toBe(true)
    expect(serving({ devices: null })).toBe(false)
  })

  it('its devices by name, or by id where a device has none, and its public addresses counted', () => {
    expect(proxyLine(t, { ...GATEWAY, devices: [run('D1', 'Office Mac'), run('D9', null)], endpointCount: 1 })).toBe(
      'Ready · on Office Mac, D9 · 1 public address · gw-acme.dev.r3proxy.com'
    )
    expect(proxyLine(t, { ...GATEWAY, devices: [run('D1', 'Office Mac', { state: 'RETIRED' })], endpointCount: 0 })).toBe(
      'Paused · Office Mac · gw-acme.dev.r3proxy.com'
    )
  })

  it('no device yet, with its host, where its devices, addresses and certificate are not read', () => {
    expect(proxyLine(t, { ...GATEWAY, devices: null, endpointCount: null, certificate: null })).toBe(
      'No device yet · gw-acme.dev.r3proxy.com'
    )
  })
})

describe('its own name in its line', () => {
  const named = (state: string, via = 'name') => ({ ...GATEWAY, ownName: { name: 'gw.example.com', state, via } })

  it('in place of its host where it has one, its own or its account base’s', async () => {
    list.value = [
      named('active'),
      {
        ...named('active', 'base'),
        id: 'P2',
        ownName: { name: 'nas.proxies.example.com', state: 'active', via: 'base' },
      },
      NAS,
    ]
    await render()
    expect(subtitle('P1')).toBe('Ready · on Office Mac · 2 public addresses · gw.example.com')
    expect(subtitle('P2')).toBe('Ready · on Office Mac · 2 public addresses · nas.proxies.example.com')
  })

  it('not reached under it yet, or no longer right: where it stands said with it', () => {
    expect(ownNameLine(t, { name: 'gw.example.com', state: 'active', via: 'name' })).toBe('gw.example.com')
    expect(ownNameLine(t, { name: 'gw.example.com', state: 'pending', via: 'name' })).toBe('gw.example.com (pending)')
    expect(ownNameLine(t, { name: 'gw.example.com', state: 'verified', via: 'name' })).toBe(
      'gw.example.com (not moved yet)'
    )
    expect(ownNameLine(t, { name: 'gw.proxies.example.com', state: 'broken', via: 'base' })).toBe(
      'gw.proxies.example.com (broken)'
    )
    expect(proxyLine(t, named('pending'))).toBe('Ready · on Office Mac · 2 public addresses · gw.example.com (pending)')
  })

  it('none: its host', () => {
    expect(proxyLine(t, { ...GATEWAY, ownName: null })).toBe('Ready · on Office Mac · 2 public addresses · gw-acme.dev.r3proxy.com')
  })
})

describe('the account’s base for its proxies’ names', () => {
  const entry = () => document.body.querySelector('[data-to="/proxies/base"]') as HTMLElement | null
  const records = (...found: boolean[]) =>
    found.map((each, n) => ({
      name: 'proxies.example.com',
      type: 'NS',
      value: `ns-${n + 1}.awsdns.org`,
      found: each,
      seen: null,
    }))
  const BASE = {
    base: 'proxies.example.com',
    state: 'pending',
    nameServers: ['ns-1.awsdns.org', 'ns-2.awsdns.org'],
    records: records(true, false),
    checked: null,
    problem: null,
    proxies: 0,
  }

  it('none yet: offered to an admin of the account last, a paid add-on in one sentence, leading to its page', async () => {
    const page = await render()
    expect(page.querySelector('[data-proxy-base]')?.getAttribute('data-proxy-base')).toBe('none')
    expect(page.textContent).toContain('Your own domain')
    expect(entry()?.querySelector('[data-title]')?.textContent).toBe('Not set up')
    expect(entry()?.querySelector('[data-subtitle]')?.textContent).toBe(
      'A paid add-on that puts your public addresses under a domain you own.'
    )
    expect(entry()?.querySelector('[data-icon="sitemap"]')?.getAttribute('data-color')).toBe('grayDark')
    // After your own proxy servers and Remote.It's.
    expect(page.textContent!.indexOf('Your own domain')).toBeGreaterThan(page.textContent!.indexOf('Your proxy servers'))
  })

  it('set: its subdomain and where it stands — pending, verified, active with its proxies, broken naming what is missing', async () => {
    const lines: [any, string, string][] = [
      [BASE, 'Pending: 1 of 2 NS records found', 'warning'],
      [
        { ...BASE, state: 'verified', records: records(true, true) },
        'Verified: its delegation to remote.it is seen',
        'warning',
      ],
      [
        { ...BASE, state: 'active', records: records(true, true), proxies: 3 },
        'Active: 3 proxies named under it',
        'primary',
      ],
      [
        { ...BASE, state: 'active', records: records(true, true), proxies: 1 },
        'Active: 1 proxy named under it',
        'primary',
      ],
      [{ ...BASE, state: 'broken' }, 'Broken: NS ns-2.awsdns.org is missing', 'danger'],
    ]
    for (const [read, line, color] of lines) {
      base.value = read
      const page = await render()
      expect(page.querySelector('[data-proxy-base]')?.getAttribute('data-proxy-base')).toBe(read.state)
      expect(entry()?.querySelector('[data-title]')?.textContent).toBe('proxies.example.com')
      expect(entry()?.querySelector('[data-subtitle]')?.textContent).toBe(line)
      expect(entry()?.querySelector('[data-icon="sitemap"]')?.getAttribute('data-color')).toBe(color)
    }
  })

  it('not offered to anyone who does not administer the account', async () => {
    access.admin = false
    base.value = BASE
    const page = await render()
    expect(page.querySelector('[data-proxy-base]')).toBeNull()
    expect(entry()).toBeNull()
  })

  it('hidden while it is read, where this server has none, and where it could not be read', async () => {
    for (const read of [undefined, 'UNSUPPORTED', 'ERROR']) {
      base.value = read
      const page = await render()
      expect(page.querySelector('[data-proxy-base]')).toBeNull()
      expect(page.querySelector('[data-proxy="P1"]')).not.toBeNull()
    }
  })
})
