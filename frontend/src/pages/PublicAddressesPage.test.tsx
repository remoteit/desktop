import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { read, removed, pushed, opened, usage } = vi.hoisted(() => ({
  read: vi.fn(async (_accountId?: string): Promise<any> => ({ addresses: [], devices: 0, total: 0 })),
  removed: vi.fn(async (_id: string): Promise<any> => ({})),
  pushed: vi.fn(),
  opened: vi.fn(),
  usage: { value: null as null | { text: string; over: boolean } },
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: pushed }) }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLPublicAddresses', () => ({ graphQLPublicAddresses: read }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLRemoveEndpoint: removed,
  endpointAddress: (endpoint: any) => (endpoint.kind === 'https' ? endpoint.url : `${endpoint.host}:${endpoint.port}`),
}))
vi.mock('../services/browser', () => ({ windowOpen: opened }))
vi.mock('../components/TransferUsage', () => ({
  useTransferUsageHint: () => usage.value,
  TransferUsageHintText: ({ hint }: any) => <span data-usage>{hint.text}</span>,
}))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: ({ value }: any) => <button data-copy={value} /> }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => (
    <button data-open onClick={onClick}>
      {title}
    </button>
  ),
}))
vi.mock('../buttons/ConfirmIconButton', () => ({
  ConfirmIconButton: ({ onClick, confirmProps }: any) => (
    <button data-remove data-confirm={confirmProps.title} onClick={onClick} />
  ),
}))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      <div data-header>{header}</div>
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, severity = 'info', ...props }: any) => (
    <div data-notice={severity} data-partial={props['data-partial'] ? '' : undefined}>
      {children}
    </div>
  ),
}))
vi.mock('../components/Link', () => ({ Link: ({ to, children }: any) => <a data-to={to}>{children}</a> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { PublicAddressesPage } from './PublicAddressesPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const address = (id: string, more: any = {}) => ({
  id,
  serviceId: `S-${id}`,
  proxy: { id: 'P', name: 'remote.it pdx1a', host: 'pdx1a-r3.example', remoteit: true, local: false },
  kind: 'https',
  lifetime: 'permanent',
  access: 'signed-in',
  lockedIp: null,
  allow: null,
  host: `${id}.example`,
  port: null,
  url: `https://${id}.example`,
  localAddresses: [],
  created: '2026-11-01',
  expires: null,
  device: { id: 'D1', name: 'lab-printer' },
  service: { id: `S-${id}`, name: 'web' },
  ...more,
})

let root: Root
let host: HTMLDivElement
const render = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  await act(async () => root.render(<PublicAddressesPage />))
}
const text = () => host.textContent ?? ''

beforeEach(() => {
  read.mockReset()
  removed.mockReset().mockResolvedValue({})
  pushed.mockReset()
  opened.mockReset()
  usage.value = null
  act(() => root?.unmount())
  document.body.innerHTML = ''
})

describe('public addresses', () => {
  it('lists every address with its service, device, who may use it and when it expires', async () => {
    read.mockResolvedValue({
      addresses: [
        address('a'),
        address('b', {
          kind: 'tcp',
          host: 'pdx1a-r3.example',
          port: 30001,
          url: 'tcp://pdx1a-r3.example:30001',
          access: 'public',
          lifetime: 'temporary',
          expires: null,
          proxy: { id: 'O', name: 'Office', host: 'office-acme.example', remoteit: false, local: false },
          device: { id: 'D2', name: 'nas' },
          service: { id: 'S2', name: 'smb' },
        }),
      ],
      devices: 2,
      total: 2,
    })
    await render()
    expect(read).toHaveBeenCalledWith('ACCOUNT')
    const rows = host.querySelectorAll('[data-address]')
    expect(rows.length).toBe(2)
    expect(rows[0].textContent).toContain('https://a.example')
    expect(rows[0].textContent).toContain('web')
    expect(rows[0].textContent).toContain('lab-printer')
    expect(rows[0].textContent).toContain('People who may connect, signed in · Never expires')
    expect(rows[0].querySelector('a')?.getAttribute('data-to')).toBe('/devices/D1/S-a')
    expect(rows[1].textContent).toContain('pdx1a-r3.example:30001')
    expect(rows[1].textContent).toContain('Anyone with the address · Expires when unused · Through Office')
  })

  it('copies any address, opens only a web one, and removes one after confirming, then reads them again', async () => {
    read.mockResolvedValue({
      addresses: [address('a'), address('b', { kind: 'udp', host: 'h', port: 1, url: 'udp://h:1' })],
      devices: 1,
      total: 1,
    })
    await render()
    const rows = host.querySelectorAll('[data-address]')
    expect(rows[0].querySelector('[data-copy]')?.getAttribute('data-copy')).toBe('https://a.example')
    expect(rows[1].querySelector('[data-open]')).toBeNull()
    await act(async () => (rows[0].querySelector('[data-open]') as HTMLButtonElement).click())
    expect(opened).toHaveBeenCalledWith('https://a.example', '_blank', true)
    expect(rows[0].querySelector('[data-remove]')?.getAttribute('data-confirm')).toBe('Remove this public address?')
    await act(async () => (rows[0].querySelector('[data-remove]') as HTMLButtonElement).click())
    expect(removed).toHaveBeenCalledWith('a', { about: [expect.any(String)] })
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('a removal that fails is said', async () => {
    read.mockResolvedValue({ addresses: [address('a')], devices: 1, total: 1 })
    removed.mockResolvedValue('ERROR')
    await render()
    await act(async () => (host.querySelector('[data-remove]') as HTMLButtonElement).click())
    expect(text()).toContain('Couldn’t remove the address. Try again.')
  })

  it('none yet: says what one is for, with Add public address, which starts from choosing a service', async () => {
    read.mockResolvedValue({ addresses: [], devices: 3, total: 3 })
    await render()
    expect(host.querySelector('[data-empty]')?.textContent).toContain('No public addresses yet')
    const add = [...host.querySelectorAll('button')].filter(button => button.textContent === 'Add public address')
    expect(add.length).toBe(1)
    await act(async () => add[0].click())
    expect(pushed).toHaveBeenCalledWith('/public-addresses/new')
  })

  it('says when the account has more devices than were read', async () => {
    read.mockResolvedValue({ addresses: [address('a')], devices: 1000, total: 1500 })
    await render()
    expect(text()).toContain('Showing addresses for the first 1000 of your 1500 devices.')
  })

  it('shows the month’s transfer through Remote.It’s proxy servers where the API has it', async () => {
    read.mockResolvedValue({ addresses: [address('a')], devices: 1, total: 1 })
    usage.value = { text: '1.2 of 5 GB this month', over: false }
    await render()
    expect(host.querySelector('[data-usage]')?.textContent).toBe('1.2 of 5 GB this month')
  })

  it('loading, a server without them, and a failed read', async () => {
    read.mockReturnValue(new Promise(() => {}))
    await render()
    expect(host.querySelector('[data-loading]')).not.toBeNull()
    act(() => root.unmount())
    read.mockResolvedValue('UNSUPPORTED')
    await render()
    expect(text()).toContain('Public addresses aren’t available on this server.')
    act(() => root.unmount())
    read.mockResolvedValue('ERROR')
    await render()
    expect(host.querySelector('[data-notice="error"]')?.textContent).toBe('Couldn’t load your public addresses. Try again.')
  })
})
