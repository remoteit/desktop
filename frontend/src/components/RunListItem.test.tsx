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
    health: { state: 'healthy', since: null, reason: null },
    certificate: 'ready',
    openConnections: null,
    drain: null,
    privateAddress: null,
    publicAddress: null,
    network: null,
    reachable: null,
    reachReason: null,
    ...fields,
  } as any)
const exitRun = (fields: any = {}) =>
  ({
    id: 'MAC',
    name: 'Office Mac',
    state: 'ACTIVE',
    joining: false,
    disabled: false,
    checks: [],
    established: true,
    offering: true,
    refusal: null,
    health: null,
    lan: false,
    lanReason: null,
    ...fields,
  } as any)

async function render(props: any) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<RunListItem {...props} />))
  return container
}

beforeEach(() => {
  push.mockReset()
})

describe('a device in a proxy or an exit', () => {
  it('its name and state, what it waits for, and a link to it', async () => {
    const checks = [{ name: 'policy', passed: false, pending: false, reason: 'its machine forbids exits' }]
    const row = await render({ kind: 'exit', run: exitRun({ state: 'RETIRED', joining: true, checks }), name: 'HA Derby', to: '/devices/MAC/runs' })
    expect(row.textContent).toContain('Office Mac')
    expect(row.querySelector('[data-run-state]')?.textContent).toBe('Joining')
    expect(row.textContent).toContain('Its checks fail: its machine forbids exits')
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
      'remote.it’s certificate is not issued yet: until it is, https names fail',
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

describe('a device of an own proxy: Internet or Local network', () => {
  // An own proxy's device: no host or health of its own, as remote.it's have.
  const own = (fields: any = {}) => proxyRun({ id: 'PI', name: 'Printer Pi', health: null, ...fields })
  const state = (row: HTMLElement) => row.querySelector('[data-run-state]')?.textContent

  it('an Internet proxy’s: reachable from the internet; or not, why in graphql’s words, and out of service', async () => {
    expect(machineLines(t, 'proxy', own({ reachable: true, publicAddress: '203.0.113.5' }))).toEqual([
      'Reachable from the internet',
    ])
    expect(
      machineLines(t, 'proxy', own({ reachable: false, reachReason: 'a connection to 203.0.113.5:40001 timed out' }))
    ).toEqual(['Not reachable from the internet: a connection to 203.0.113.5:40001 timed out'])
    expect(machineLines(t, 'proxy', own({ reachable: false }))).toEqual(['Not reachable from the internet'])
    let row = await render({ kind: 'proxy', run: own({ reachable: false, reachReason: 'refused' }), name: 'Gateway' })
    expect(state(row)).toBe('Out of service')
    expect(row.textContent).toContain('Not reachable from the internet: refused')
    row = await render({ kind: 'proxy', run: own({ reachable: true }), name: 'Gateway' })
    expect(state(row)).toBe('In service')
  })

  it('not tested, or not judged yet: nothing said of it', () => {
    expect(machineLines(t, 'proxy', own())).toEqual([])
  })

  it('a local proxy’s: its private address, said only for a local proxy', async () => {
    const pi = own({ privateAddress: '192.168.1.20', network: '192.168.1.0/24' })
    expect(machineLines(t, 'proxy', pi, true)).toEqual(['Private address: 192.168.1.20'])
    expect(machineLines(t, 'proxy', pi)).toEqual([])
    const row = await render({ kind: 'proxy', run: pi, name: 'Office', local: true })
    expect(state(row)).toBe('In service')
    expect(row.textContent).toContain('Private address: 192.168.1.20')
  })

  it('a local proxy’s on another network: its failed network check said as checks are, out of service until it is back', async () => {
    const checks = [
      {
        name: 'network',
        passed: false,
        pending: false,
        reason: 'Laptop is on another network (10.0.0.0/24) than Office (192.168.1.0/24)',
      },
    ]
    const row = await render({
      kind: 'proxy',
      run: own({ name: 'Laptop', privateAddress: '10.0.0.7', checks }),
      name: 'Office',
      local: true,
    })
    expect(state(row)).toBe('Out of service')
    expect(row.textContent).toContain(
      'Its checks fail: Laptop is on another network (10.0.0.0/24) than Office (192.168.1.0/24)'
    )
    expect(row.textContent).toContain('Private address: 10.0.0.7')
    // Put back to wait for its checks, it says so the same way.
    const joining = await render({
      kind: 'proxy',
      run: own({ name: 'Laptop', state: 'RETIRED', joining: true, checks }),
      name: 'Office',
      local: true,
    })
    expect(state(joining)).toBe('Joining')
    expect(joining.textContent).toContain('Its checks fail: Laptop is on another network')
  })
})

describe('a disabled device', () => {
  it('says so, whatever its state there, and serves nothing until restored', async () => {
    const row = await render({ kind: 'exit', run: exitRun({ disabled: true }), name: 'HA Derby' })
    expect(row.querySelector('[data-run-state]')?.textContent).toBe('Disabled')
    expect(row.textContent).toContain('Its device is disabled: it serves nothing until it is restored')
  })
})

describe('an exit’s device: its local network, as its machine has it', () => {
  const lan = (row: HTMLElement) => row.querySelector('[data-lan]') as HTMLElement | null

  it('an own exit’s: open or closed to the exit’s users, read only — nothing to set on the device', async () => {
    const own = { kind: 'exit', name: 'HA Derby', lan: true }
    let row = await render({ ...own, run: exitRun(), manage: true, onChanged: vi.fn() })
    expect(lan(row)?.getAttribute('data-lan')).toBe('closed')
    expect(lan(row)?.textContent).toBe('Its local network: closed to the exit’s users')
    expect(row.querySelector('input')).toBeNull()
    row = await render({ ...own, run: exitRun({ lan: true }) })
    expect(lan(row)?.getAttribute('data-lan')).toBe('open')
    expect(lan(row)?.textContent).toBe('Its local network: open to the exit’s users')
  })

  it('where it is not as its exit says, or not the cloud’s to set: why, in graphql’s words', async () => {
    let row = await render({
      kind: 'exit',
      run: exitRun({ lan: true, lanReason: 'its administrator keeps its exit node local' }),
      name: 'HA Derby',
      lan: true,
    })
    expect(lan(row)?.textContent).toBe(
      'Its local network: open to the exit’s users — its administrator keeps its exit node local'
    )
    row = await render({ kind: 'exit', run: exitRun({ lanReason: 'its machine closed it' }), name: 'Derby', lan: true })
    expect(lan(row)?.textContent).toBe('Its local network: closed to the exit’s users — its machine closed it')
  })

  it('a remote.it exit’s device — they reach no network of their machines —: said only where open or not the cloud’s', async () => {
    expect(lan(await render({ kind: 'exit', run: exitRun(), name: 'pdx1a', manage: true }))).toBeNull()
    expect(lan(await render({ kind: 'exit', run: exitRun({ lan: true }), name: 'pdx1a' }))?.textContent).toBe(
      'Its local network: open to the exit’s users'
    )
    expect(
      lan(await render({ kind: 'exit', run: exitRun({ lanReason: 'its administrator forbids exits' }), name: 'pdx1a' }))
        ?.textContent
    ).toBe('Its local network: closed to the exit’s users — its administrator forbids exits')
  })

  it('a proxy’s device: nothing of a local network', async () => {
    expect(lan(await render({ kind: 'proxy', run: proxyRun({ lan: true }), name: 'Gateway', lan: true }))).toBeNull()
  })

  it('from the device’s page: set on the exit, linked unless the row links there already; not said with a reason', async () => {
    const at = { kind: 'exit', name: 'HA Derby', lan: true, lanSetOn: '/exits/xha', to: '/exits/xha' }
    const acting = { manage: true, onChanged: vi.fn() }
    let row = await render({ ...at, ...acting, run: exitRun({ lan: true }) })
    expect(lan(row)?.textContent).toBe('Its local network: open to the exit’s users · Set on the exit')
    expect(lan(row)?.querySelector('[data-link]')?.getAttribute('data-link')).toBe('/exits/xha')
    row = await render({ ...at, run: exitRun() })
    expect(lan(row)?.textContent).toBe('Its local network: closed to the exit’s users · Set on the exit')
    expect(lan(row)?.querySelector('[data-link]')).toBeNull()
    row = await render({ ...at, ...acting, run: exitRun({ lanReason: 'its machine closed it' }) })
    expect(lan(row)?.textContent).toBe('Its local network: closed to the exit’s users — its machine closed it')
  })
})
