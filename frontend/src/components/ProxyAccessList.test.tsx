import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Who used a proxy endpoint: each visitor connection with its address as graphql gives it — masked for whoever does
// not manage the proxy, and said so — how it ended, and the filter by outcome asking graphql for only those.
const { access } = vi.hoisted(() => ({ access: vi.fn() }))
vi.mock('../services/graphQLProxyAccess', () => {
  const ACCESS_OUTCOMES = ['served', 'refused', 'password-refused', 'unknown']
  return { ACCESS_OUTCOMES, FAILURES: ACCESS_OUTCOMES.filter(o => o !== 'served'), graphQLProxyAccess: access }
})
vi.mock('../helpers/dateHelper', () => ({ humanizeDuration: (ms: number) => `${ms / 1000} seconds` }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../components/Timestamp', () => ({ Timestamp: () => <span>then</span> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ value, values, onChange }: any) => (
    <select data-filter value={value} onChange={e => onChange(e.target.value)}>
      {values.map((v: any) => (
        <option key={v.key} value={v.key}>
          {v.name}
        </option>
      ))}
    </select>
  ),
}))

import { ProxyAccessList } from './ProxyAccessList'
import { FAILURES } from '../services/graphQLProxyAccess'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const visit = {
  id: 'a1',
  proxyId: 'P1',
  deviceId: 'E1',
  endpointId: 'ep',
  serviceId: 'S1',
  kind: 'https',
  name: 'k7q2abcdwxyz.r3proxy.com',
  port: 443,
  started: '2026-11-02T10:00:00Z',
  ended: '2026-11-02T10:00:03Z',
  durationMs: 3000,
  bytesIn: 812,
  bytesOut: 20480,
  code: null,
  reason: null,
  userEmail: null,
  passwordFailures: 0,
}

async function render(scope: any, devices?: ILookup<string>) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () => createRoot(el).render(<ProxyAccessList scope={scope} devices={devices} />))
  return el
}

describe('ProxyAccessList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    access.mockResolvedValue({
      items: [
        { ...visit, visitor: '73.92.100.x', visitorPort: null, masked: true, outcome: 'served' },
        {
          ...visit,
          id: 'a2',
          visitor: '203.0.113.9',
          visitorPort: 51515,
          masked: false,
          outcome: 'refused',
          code: 1,
          reason: 'no access to the target',
          passwordFailures: 2,
        },
      ],
      hasMore: true,
      last: '1:a2',
    })
  })

  it('shows each visit as graphql gives it: masked and said so, or whole; how it ended and why', async () => {
    const el = await render({ serviceId: 'S1' })
    expect(access).toHaveBeenCalledWith({ serviceId: 'S1' }, undefined, undefined)
    expect(el.textContent).toContain('73.92.100.x · Served')
    expect(el.textContent).toContain('address partly hidden')
    // (interpolation is i18next's, not set up here)
    expect(el.textContent).toContain('203.0.113.9:51515 · No session: refused (error ')
    expect(el.textContent).toContain('no access to the target')
    expect(el.textContent).toContain('wrong passwords: ')
    expect(el.textContent.match(/address partly hidden/g)).toHaveLength(1)
  })

  it('filters by outcome, and pages on from the last', async () => {
    const el = await render({ proxy: 'P1' })
    const select = el.querySelector('select[data-filter]') as HTMLSelectElement
    await act(async () => {
      select.value = 'failures'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(access).toHaveBeenLastCalledWith({ proxy: 'P1' }, [...FAILURES], undefined)
    const more = [...el.querySelectorAll('button')].find(b => b.textContent === 'More')!
    await act(async () => more.click())
    expect(access).toHaveBeenLastCalledWith({ proxy: 'P1' }, [...FAILURES], '1:a2')
  })

  it('names the device that served each visit, where asked to — its id where it has no name', async () => {
    let el = await render({ proxy: 'P1' }, { E1: 'e1-r3.solo.r3proxy.com' })
    expect(el.textContent).toContain(' · e1-r3.solo.r3proxy.com')
    document.body.innerHTML = ''
    el = await render({ admin: true }, {})
    expect(el.textContent).toContain(' · E1')
    document.body.innerHTML = ''
    el = await render({ deviceId: 'E1' })
    expect(el.textContent).not.toContain(' · E1')
  })

  it('shows nothing on an API without proxies', async () => {
    access.mockResolvedValue('UNSUPPORTED')
    const el = await render({ serviceId: 'S1' })
    expect(el.textContent).toBe('')
  })
})
