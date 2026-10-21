import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('react-redux', () => ({
  useSelector: (select: any) =>
    select({
      applicationTypes: {
        all: [
          { id: 7, name: 'HTTP', port: 80 },
          { id: 28, name: 'SSH', port: 22 },
          { id: 50, name: 'IPP', port: 631 },
          { id: 1, name: 'TCP', port: 0 },
        ],
      },
    }),
}))
vi.mock('../store', () => ({}))
vi.mock('../models/applicationTypes', () => ({
  findType: (all: any[], id: number) => all.find(t => t.id === id) || all[0],
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn() }))
vi.mock('../i18n', () => ({
  default: { t: (_key: string, text: string, values: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '') },
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./ExpandIcon', () => ({ ExpandIcon: () => null }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DiscoveryList, offerAdded } from './DiscoveryList'
import type { Discovery, DiscoveryOffer } from '../services/graphQLDiscovery'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const offer = (more: Partial<DiscoveryOffer>): DiscoveryOffer => ({
  kind: 'network',
  type: '_http._tcp',
  name: 'Web',
  host: 'nas.local',
  addresses: ['192.168.1.20'],
  port: 80,
  protocol: 'tcp',
  application: 7,
  process: null,
  tls: null,
  txt: null,
  ...more,
})

const printer = offer({
  name: 'Brother',
  host: 'brother.local',
  addresses: ['192.168.1.30'],
  port: 631,
  application: 50,
})
const sshd = offer({
  kind: 'local',
  type: 'tcp',
  name: 'sshd',
  process: 'sshd',
  host: '127.0.0.1',
  addresses: ['0.0.0.0'],
  port: 22,
  application: 28,
})

async function render(discovery: Discovery, props: Partial<React.ComponentProps<typeof DiscoveryList>> = {}) {
  const container = document.createElement('div')
  const onAdd = vi.fn()
  await act(async () =>
    createRoot(container).render(<DiscoveryList discovery={discovery} services={[]} onAdd={onAdd} {...props} />)
  )
  return { container, onAdd }
}

describe('what a device sees, listed', () => {
  it('machines with their instances, then the device’s own listeners; a printer as a Printer', async () => {
    const hue = offer({ name: 'Philips Hue', type: '_hue._tcp', port: 443, application: 1 })
    const { container } = await render({ at: null, offers: [offer({}), hue, printer, sshd], withheld: [] })
    const text = container.textContent || ''
    expect(text).toContain('On its network')
    expect(text).toContain('Brotherbrother.local · 192.168.1.30')
    expect(text).toContain('Printer · TCP 631')
    expect(text).toContain('HTTP · TCP 80')
    // a bare socket: behind the machine's "more"
    expect(text).not.toContain('Philips Hue_hue._tcp')
    expect(text).toContain('1 more')
    expect(text.indexOf('On this device')).toBeGreaterThan(text.indexOf('nas'))
    expect(text).toContain('sshd · SSH · 0.0.0.0')
    expect(container.querySelectorAll('[data-notice]')).toHaveLength(0)
  })

  it('Add as service hands the offer over', async () => {
    const { container, onAdd } = await render({ at: null, offers: [printer], withheld: [] })
    const button = [...container.querySelectorAll('button')].find(b => b.textContent === 'Add as service')!
    await act(async () => button.click())
    expect(onAdd).toHaveBeenCalledWith(printer)
  })

  it('what the device’s policy withholds is said', async () => {
    const { container } = await render({ at: null, offers: [], withheld: ['network', 'local'] })
    const notices = [...container.querySelectorAll('[data-notice]')].map(n => n.textContent)
    expect(notices).toEqual([
      "This device's local policy doesn't share what its network advertises",
      "This device's local policy doesn't share what listens on it",
    ])
  })

  it('a machine’s own action sits on its header row', async () => {
    const { container } = await render(
      { at: null, offers: [printer], withheld: [] },
      { machineAction: machine => <span data-action>{machine.key}</span> }
    )
    expect(container.querySelector('[data-action]')?.textContent).toBe('brother.local')
  })
})

const click = async (container: HTMLElement, text: string) => {
  const row = [...container.querySelectorAll<HTMLElement>('[data-more]')].find(r => r.textContent?.includes(text))!
  await act(async () => row.click())
}

describe('what a device sees, ranked', () => {
  const ssh = offer({ name: 'NAS', label: 'SSH', rank: 'likely', type: '_ssh._tcp', port: 22, application: 28 })
  const web = offer({ name: 'NAS', label: 'Web admin', rank: 'other', port: 5000 })
  const cast = offer({
    name: 'NAS',
    label: 'Chromecast',
    rank: 'hidden',
    type: '_googlecast._tcp',
    port: 8009,
    note: 'Control only: casts from apps, not screen mirroring',
  })

  it('a machine’s likely offers, then N more to its others and, dimmed, the ones not reachable remotely', async () => {
    const { container } = await render({ at: null, offers: [cast, web, ssh], withheld: [] })
    let text = container.textContent || ''
    expect(text).toContain('NASnas.local · 192.168.1.20')
    expect(text).toContain('SSH_ssh._tcp · TCP 22')
    expect(text).toContain('2 more')
    expect(text).not.toContain('Web admin')
    expect(text).not.toContain('Chromecast')
    await click(container, '2 more')
    text = container.textContent || ''
    expect(text.indexOf('Web admin_http._tcp · TCP 5000')).toBeGreaterThan(text.indexOf('SSH'))
    const hidden = container.querySelector('[data-hidden]')!.textContent
    expect(hidden).toContain('Not reachable remotely')
    expect(hidden).toContain('Chromecast_googlecast._tcp · TCP 8009Control only: casts from apps, not screen mirroring')
    expect(hidden).not.toContain('Web admin')
    await click(container, '2 more')
    expect(container.textContent).not.toContain('Web admin')
  })

  it('machines with nothing likely: collapsed under the network’s other devices, at the bottom', async () => {
    const tv = offer({ name: 'Living Room TV', host: 'tv.local', label: 'AirPlay', rank: 'other', port: 7000 })
    const hub = offer({ name: '0176601908270003', host: '', addresses: ['192.168.1.50'], rank: 'hidden', port: 9 })
    const { container } = await render({ at: null, offers: [tv, ssh, hub], withheld: [] })
    let text = container.textContent || ''
    expect(text).toContain('NAS')
    expect(text).toContain('Other devices on the network (2)')
    expect(text).not.toContain('Living Room TV')
    await click(container, 'Other devices on the network')
    text = container.textContent || ''
    expect(text.indexOf('Device at 192.168.1.50')).toBeGreaterThan(text.indexOf('Other devices on the network'))
    expect(text.indexOf('Living Room TV')).toBeGreaterThan(text.indexOf('Device at 192.168.1.50'))
    // nothing likely: its others shown, its hidden ones behind "more"
    expect(text).toContain('AirPlay')
    expect(text).toContain('1 more')
  })

  it('the device’s own listeners: likely shown, the rest behind N more', async () => {
    const http = offer({ ...sshd, name: 'node', process: 'node', label: 'Web', rank: 'other', port: 3000 })
    const { container } = await render({
      at: null,
      offers: [{ ...sshd, label: 'SSH', rank: 'likely' }, http],
      withheld: [],
    })
    expect(container.textContent).toContain('SSH · TCP 22sshd · 0.0.0.0')
    expect(container.textContent).not.toContain('Web · TCP 3000')
    await click(container, '1 more')
    expect(container.textContent).toContain('Web · TCP 3000node · 0.0.0.0')
  })
})

describe('an offer already served', () => {
  it('a service at its host and port; a listener at any loopback name', () => {
    expect(offerAdded(printer, [{ host: 'brother.local', port: 631 } as IService])).toBe(true)
    expect(offerAdded(printer, [{ host: 'brother.local', port: 80 } as IService])).toBe(false)
    expect(offerAdded(sshd, [{ host: 'localhost', port: 22 } as IService])).toBe(true)
    expect(offerAdded(offer({ host: '127.0.0.1', port: 22 }), [{ host: 'localhost', port: 22 } as IService])).toBe(
      false
    )
  })
})
