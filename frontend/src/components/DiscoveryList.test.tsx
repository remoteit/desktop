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
vi.mock('./Icon', () => ({ Icon: () => null }))
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
    const { container } = await render({ at: null, offers: [offer({}), printer, sshd], withheld: [] })
    const text = container.textContent || ''
    expect(text).toContain('On its network')
    expect(text).toContain('brother.local · 192.168.1.30')
    expect(text).toContain('Printer · TCP 631')
    expect(text).toContain('HTTP · TCP 80')
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
