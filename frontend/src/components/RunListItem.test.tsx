import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Link', () => ({ Link: ({ to, children }: any) => <a data-link={to}>{children}</a> }))
// Its actions are their own test's (RunActions.test.tsx): here, what they were given, and an answer.
vi.mock('./RunActions', () => ({
  RunActions: ({ scope, run, onDone }: any) => (
    <button data-actions={`${scope.kind}:${scope.name}:${run.state}`} onClick={() => onDone('RUNS')} />
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, text: string, values?: any) => fill(text, values) }) }
})

import { RunListItem, machineLines } from './RunListItem'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const proxyRun = (fields: any = {}) =>
  ({
    id: 'E1',
    name: 'e1',
    state: 'ACTIVE',
    joining: false,
    checks: [],
    host: 'e1-r3.solo.r3proxy.com',
    health: { state: 'healthy', since: null, reason: null },
    certificate: 'ready',
    openConnections: null,
    drain: null,
    ...fields,
  } as any)
const exitRun = (fields: any = {}) =>
  ({ id: 'MAC', name: 'Office Mac', state: 'ACTIVE', joining: false, checks: [], established: true, offering: true, refusal: null, health: null, ...fields } as any)

async function render(props: any) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<RunListItem {...props} />))
  return container
}

beforeEach(() => push.mockReset())

describe('a device in a proxy or an exit', () => {
  it('its name and state, what it waits for, and a link to it', async () => {
    const checks = [{ name: 'policy', passed: false, reason: 'its machine forbids exits' }]
    const row = await render({ kind: 'exit', run: exitRun({ state: 'RETIRED', joining: true, checks }), name: 'HA Derby', to: '/devices/MAC/runs' })
    expect(row.textContent).toContain('Office Mac')
    expect(row.querySelector('[data-run-state]')?.textContent).toBe('Joining')
    expect(row.textContent).toContain('Waiting for its checks: its machine forbids exits')
    await act(async () => (row.querySelector('[data-run]') as HTMLElement).click())
    expect(push).toHaveBeenCalledWith('/devices/MAC/runs')
  })

  it('with its actions, its title is the link, and an action’s answer is passed on with the device', async () => {
    const onChanged = vi.fn()
    const row = await render({ kind: 'exit', run: exitRun(), name: 'HA Derby', to: '/devices/MAC/runs', manage: true, onChanged })
    expect(row.querySelector('[data-link]')?.getAttribute('data-link')).toBe('/devices/MAC/runs')
    await act(async () => (row.querySelector('[data-actions="exit:HA Derby:ACTIVE"]') as HTMLElement).click())
    expect(onChanged).toHaveBeenCalledWith('RUNS', { id: 'MAC', name: 'Office Mac' })
    // The row itself takes no click.
    await act(async () => (row.querySelector('[data-run]') as HTMLElement).click())
    expect(push).not.toHaveBeenCalled()
  })

  it('a title given in place of the device’s name', async () => {
    const row = await render({ kind: 'proxy', run: proxyRun(), name: 'remote.it pdx1a', title: 'Proxy remote.it pdx1a' })
    expect(row.textContent).toContain('Proxy remote.it pdx1a')
  })
})

describe('what its machine says of it', () => {
  it('a proxy’s device: its health when not healthy, a certificate to come, its open connections, its drain', () => {
    expect(machineLines(t, 'proxy', proxyRun())).toEqual([])
    expect(
      machineLines(
        t,
        'proxy',
        proxyRun({
          health: { state: 'unhealthy', since: null, reason: 'its NAT keepalive failed' },
          certificate: 'pending',
          openConnections: { https: 2, tcp: 1, udp: 0, exit: 0, total: 3, reported: null },
          drain: { safeToStop: false, reason: '3 connections open', dnsClearAt: null, deadline: null },
        })
      )
    ).toEqual([
      'Health: unhealthy — its NAT keepalive failed',
      'Its certificate is issued within a day: until then https names fail',
      'Open: https 2 · tcp 1 · udp 0',
      'Not safe to stop yet: 3 connections open',
    ])
    expect(machineLines(t, 'proxy', proxyRun({ drain: { safeToStop: true, reason: 'nothing open' } }))).toEqual([
      'Safe to stop: nothing open',
    ])
  })

  it('an exit’s device: its health, for one of remote.it’s, when not healthy', () => {
    expect(machineLines(t, 'exit', exitRun({ health: 'healthy' }))).toEqual([])
    expect(machineLines(t, 'exit', exitRun({ health: 'unknown' }))).toEqual(['Health: unknown'])
    expect(machineLines(t, 'exit', exitRun())).toEqual([])
  })
})
