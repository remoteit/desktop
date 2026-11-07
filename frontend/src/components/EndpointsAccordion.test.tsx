import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Making an endpoint: the proxy choice defaults to remote.it's nearest the device, which shows its name like any other
// choice and sends no proxy; a proxy chosen — remote.it's by its name and where, an own one by its name and host — is
// sent by its id.
const { create, endpoints, usage } = vi.hoisted(() => ({
  create: vi.fn(async () => ({} as any)),
  endpoints: vi.fn(async () => [] as any),
  usage: vi.fn(async (_accountId?: string) => [] as any),
}))
vi.mock('../services/graphQLProxy', () => ({
  graphQLServiceEndpoints: endpoints,
  graphQLProxies: async () => [
    {
      id: 'P1',
      name: 'remote.it pdx1a',
      host: 'pdx1a-r3.solo.r3proxy.com',
      domain: null,
      remoteit: true,
      publicEndpoints: true,
      location: 'pdx1',
      provider: 'AWS us-west-2 (Boardman)',
    },
    {
      id: 'P2',
      name: 'Office gateway',
      host: 'gw-acme.solo.r3proxy.com',
      domain: null,
      remoteit: false,
      publicEndpoints: true,
      location: null,
      provider: '',
    },
  ],
  graphQLCreateEndpoint: create,
  graphQLRemoveEndpoint: vi.fn(),
  endpointAddress: () => '',
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => (
    <button onClick={e => onClick({ ...e, stopPropagation() {} })}>{title}</button>
  ),
}))
vi.mock('../buttons/ConfirmIconButton', () => ({ ConfirmIconButton: () => null }))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: () => null }))
vi.mock('./Timestamp', async importOriginal => ({
  ...(await importOriginal<object>()),
  Timestamp: () => null,
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./ProxyAccessList', () => ({
  ProxyAccessList: ({ scope }: any) => <div data-visitors>{scope.serviceId}</div>,
}))
vi.mock('../services/transferUsage', () => ({ fetchTransferUsage: usage, UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { EndpointsAccordion } from './EndpointsAccordion'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const NEAREST = "remote.it's, nearest the device"

async function openForm() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const device = { id: 'DEVICE', permissions: ['MANAGE'] } as any
  await act(async () => root.render(<EndpointsAccordion device={device} service={{ id: 'SERVICE' } as any} />))
  const add = [...container.querySelectorAll('button')].find(b => b.textContent === 'Add an endpoint')!
  await act(async () => add.click())
  return container
}

const proxyField = (container: HTMLElement) =>
  [...container.querySelectorAll('.MuiFormControl-root')].find(f => f.querySelector('label')?.textContent === 'Proxy')!

const makeIt = async (container: HTMLElement) => {
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === 'Make the endpoint')!
  await act(async () => button.click())
}

describe('the endpoint form’s proxy choice', () => {
  beforeEach(() => {
    create.mockClear()
    document.body.innerHTML = ''
  })

  it('shows the nearest choice by name, the label raised above it', async () => {
    const field = proxyField(await openForm())
    expect(field.querySelector('.MuiSelect-select')?.textContent).toBe(NEAREST)
    expect(field.querySelector('label')?.getAttribute('data-shrink')).toBe('true')
  })

  it('sends no proxy for the nearest choice', async () => {
    await makeIt(await openForm())
    expect(create).toHaveBeenCalledTimes(1)
    expect((create.mock.calls[0] as any[])[1].proxy).toBeUndefined()
  })

  it('shows and sends a named proxy', async () => {
    const container = await openForm()
    const field = proxyField(container)
    await act(async () => (field.closest('.MuiListItemButton-root') as HTMLElement).click())
    const options = [...document.querySelectorAll('[role="option"]')].map(o => o.textContent)
    expect(options).toContain('remote.it pdx1a · AWS us-west-2 (Boardman)')
    const option = [...document.querySelectorAll('[role="option"]')].find(o =>
      o.textContent?.includes('gw-acme.solo.r3proxy.com')
    ) as HTMLElement
    await act(async () => option.click())
    expect(field.querySelector('.MuiSelect-select')?.textContent).toBe('Office gateway · gw-acme.solo.r3proxy.com')
    await makeIt(container)
    expect((create.mock.calls[0] as any[])[1].proxy).toBe('P2')
  })
})

describe('who used the endpoints', () => {
  it('is shown to whoever manages the service, and to no one else', async () => {
    document.body.innerHTML = ''
    const render = async (permissions: string[]) => {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const device = { id: 'DEVICE', permissions } as any
      await act(async () =>
        createRoot(container).render(<EndpointsAccordion device={device} service={{ id: 'SERVICE' } as any} />)
      )
      return container
    }
    expect((await render(['MANAGE'])).querySelector('[data-visitors]')?.textContent).toBe('SERVICE')
    expect((await render(['CONNECT'])).querySelector('[data-visitors]')).toBeNull()
  })
})

describe('the account’s public-proxy transfer under the endpoints', () => {
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
  const endpoint = (kind: 'remoteit' | 'own') => ({
    id: `EP-${kind}`,
    serviceId: 'SERVICE',
    proxy: { id: 'P', name: kind === 'remoteit' ? 'remote.it pdx1a' : 'Office gateway', host: 'e1.solo.r3proxy.com', remoteit: kind === 'remoteit' },
    kind: 'https',
    lifetime: 'temporary',
    access: 'public',
    lockedIp: null,
    allow: null,
    host: 'x.e1.solo.r3proxy.com',
    port: null,
    url: 'https://x.e1.solo.r3proxy.com',
    created: '2026-11-01T00:00:00.000Z',
    expires: null,
  })
  async function render(list: any[], owner: { id: string } | undefined = { id: 'OWNER' }) {
    endpoints.mockResolvedValue(list)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const device = { id: 'DEVICE', permissions: ['CONNECT'], owner } as any
    await act(async () =>
      createRoot(container).render(<EndpointsAccordion device={device} service={{ id: 'SERVICE' } as any} />)
    )
    await act(async () => {})
    return container
  }
  const hint = (c: HTMLElement) => c.querySelector('[data-testid="transfer-usage-hint"]')

  beforeEach(() => {
    document.body.innerHTML = ''
    usage.mockReset()
  })

  it.each([
    ['with an allowance', row(), '8.2 of 10 GB this month'],
    ['over it', row({ usedBytes: 12e9, over: true }), `Slowed to 5 Mbit/s until ${resets}`],
    ['with no allowance', row({ allowanceBytes: null }), '8.2 GB this month'],
  ])('an endpoint on remote.it’s proxy, %s: the service’s owner’s', async (_, answer, text) => {
    usage.mockResolvedValue([answer])
    const page = await render([endpoint('own'), endpoint('remoteit')])
    expect(usage).toHaveBeenCalledTimes(1)
    expect(usage).toHaveBeenCalledWith('OWNER')
    expect(hint(page)!.textContent).toBe(text)
    expect(hint(page)!.getAttribute('data-over')).toBe(answer.over ? 'true' : null)
  })

  it('nothing for endpoints only on one’s own proxies, or none, and nothing asked', async () => {
    usage.mockResolvedValue([row()])
    expect(hint(await render([endpoint('own')]))).toBeNull()
    expect(hint(await render([]))).toBeNull()
    expect(usage).not.toHaveBeenCalled()
  })

  it('nothing where the usage cannot be read, the endpoints still listed', async () => {
    usage.mockRejectedValue(new Error('network'))
    let page = await render([endpoint('remoteit')])
    expect(hint(page)).toBeNull()
    expect(page.querySelector('li')).not.toBeNull()
    for (const answer of ['ERROR', 'UNSUPPORTED', [], [{ ...row(), kind: 'exit' }]]) {
      usage.mockReset().mockResolvedValue(answer)
      page = await render([endpoint('remoteit')])
      expect(hint(page)).toBeNull()
      expect(page.querySelector('li')).not.toBeNull()
    }
  })
})
