import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, windowOpen: vi.fn() }))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value }: { value: string }) => <span data-testid="copy" data-value={value} />,
}))

import { LocalPortsListed } from './LocalPortsListed'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

// A service's other local ports on this machine, as its daemon lists them to this OS account (graphql-api
// docs/PROXY-GROUPS.md §15, "Local ports listed per account"): each in connectd's menu words, its address copied as the
// menu copies it — never one that answers no one.
describe('LocalPortsListed', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const PORT = { port: 33001, bind: '127.0.0.1', proto: 'tcp', target: '80:00:00:00:00:00:00:02', state: 'armed' }

  it('each line as the menu says it; copied but for one that answers no one', async () => {
    await act(async () =>
      root.render(
        <LocalPortsListed
          ports={[
            { ...PORT, id: 'm', scope: 'machine', tls: 'web.at.remote.it' },
            { ...PORT, id: 'u', port: 5353, proto: 'udp', scope: 'account', person: 'P1', yours: true },
            { ...PORT, id: 'k', port: 33002, scope: 'account', person: 'P2', email: 'kim@example.com' },
            { ...PORT, id: 'n', port: 33003, scope: 'account', person: 'P3', noOne: true },
          ]}
        />
      )
    )
    const rows = [...container.querySelectorAll('[data-port]')]
    expect(container.textContent).toContain('Also on a local port of this machine')
    expect(rows.map(r => r.querySelector('div')!.textContent)).toEqual([
      '127.0.0.1:33001 → web.at.remote.it (every account)',
      '127.0.0.1:5353/udp → 80:00:00:00:00:00:00:02 (yours)',
      "127.0.0.1:33002 → 80:00:00:00:00:00:00:02 (kim@example.com's)",
      "127.0.0.1:33003 → 80:00:00:00:00:00:00:02 (P3's: answers no one until they sign in)",
    ])
    expect(rows.map(r => r.querySelector('[data-testid="copy"]')?.getAttribute('data-value') ?? null)).toEqual([
      '127.0.0.1:33001',
      '127.0.0.1:5353',
      '127.0.0.1:33002',
      null,
    ])
  })

  it('none: nothing', async () => {
    await act(async () => root.render(<LocalPortsListed ports={[]} />))
    expect(container.innerHTML).toBe('')
  })
})
