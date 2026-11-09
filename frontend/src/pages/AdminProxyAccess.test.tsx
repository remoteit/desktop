import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { machines, proxies } = vi.hoisted(() => ({
  machines: vi.fn(async () => [] as any),
  proxies: vi.fn(async () => [] as any),
}))
vi.mock('../services/graphQLRemoteit', () => ({
  graphQLRemoteitMachines: machines,
  graphQLRemoteitProxies: proxies,
}))
// The choice: each option a button that picks it.
vi.mock('../components/SelectSetting', () => ({
  SelectSetting: ({ label, value, values, onChange }: any) => (
    <div data-select={label} data-value={value}>
      {values.map((each: any) => (
        <button key={each.key} data-option={each.key} onClick={() => onChange(each.key)}>
          {each.name}
        </button>
      ))}
    </div>
  ),
}))
// The visits are the list's own test's (ProxyAccessList.test.tsx): here, whose it was asked for, and the names given.
vi.mock('../components/ProxyAccessList', () => ({
  ProxyAccessList: ({ scope, devices }: any) => (
    <div data-scope={JSON.stringify(scope)} data-devices={JSON.stringify(devices ?? null)} />
  ),
}))

import { AdminProxyAccess } from './AdminProxyAccess'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const scope = () => JSON.parse(find('[data-scope]').getAttribute('data-scope')!)
const devices = () => JSON.parse(find('[data-scope]').getAttribute('data-devices')!)

async function render() {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<AdminProxyAccess />))
  return container
}

beforeEach(() => {
  machines.mockReset().mockResolvedValue([
    { id: 'E1', name: 'e1', proxy: { proxy: { name: 'remote.it pdx1a' } } },
    { id: 'E2', name: 'e2', proxy: null },
  ])
  proxies.mockReset().mockResolvedValue([{ id: 'P1', name: 'remote.it pdx1a' }])
})

describe('who visited remote.it’s proxies', () => {
  it('all of them first, each visit saying the machine that served it', async () => {
    await render()
    expect([...document.body.querySelectorAll('[data-option]')].map(each => each.textContent)).toEqual([
      'All of them',
      'remote.it pdx1a',
      'e1 (remote.it pdx1a)',
    ])
    expect(scope()).toEqual({ admin: true })
    expect(devices()).toEqual({ E1: 'e1' })
  })

  it('one proxy’s, whichever of its machines served them, each saying which', async () => {
    await render()
    await act(async () => find('[data-option="P1"]').click())
    expect(scope()).toEqual({ admin: true, proxy: 'P1' })
    expect(devices()).toEqual({ E1: 'e1' })
  })

  it('one machine’s, with no machine to say', async () => {
    await render()
    await act(async () => find('[data-option="device:E1"]').click())
    expect(scope()).toEqual({ admin: true, deviceId: 'E1' })
    expect(devices()).toBeNull()
  })
})
