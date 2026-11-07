import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Admin → Proxies & exits as tabs: Proxies · Exits · Machines · Access log · Limits & policy · Usage, the tab in the
// URL's ?view=, each tab its own sections; Usage shown whatever became of the exit policy.
const { policy } = vi.hoisted(() => ({ policy: vi.fn() }))
vi.mock('../services/graphQLExitPolicy', () => ({
  graphQLExitPolicy: policy,
  graphQLSetExitPolicy: vi.fn(),
  graphQLSetExitSuspended: vi.fn(),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('./AdminRemoteit', () => ({
  AdminRemoteitProxies: () => <div data-section="proxies" />,
  AdminRemoteitExits: () => <div data-section="exits" />,
  AdminRemoteitMachines: () => <div data-section="machines" />,
}))
vi.mock('./AdminProxyAccess', () => ({ AdminProxyAccess: () => <div data-section="access" /> }))
vi.mock('./AdminProxyLimits', () => ({ AdminProxyLimits: () => <div data-section="limits" /> }))
vi.mock('./AdminTransferUsage', () => ({ AdminTransferUsage: () => <div data-section="usage" /> }))
vi.mock('../components/InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: ({ label }: any) => <div data-setting>{label}</div>,
}))
vi.mock('../buttons/ConfirmIconButton', () => ({ ConfirmIconButton: ({ title }: any) => <button>{title}</button> }))
vi.mock('../components/Timestamp', () => ({ Timestamp: () => <span>then</span> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))

import { AdminProxiesPage, proxiesView } from './AdminProxiesPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const POLICY = {
  blockTcp: [],
  blockUdp: [],
  flowsPerSecond: 0,
  logDays: 30,
  accessLogDays: 14,
  updated: null,
  updatedBy: null,
  suspensions: [],
}

let location: { pathname: string; search: string }

async function render(at = '/admin/proxies') {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(
      <MemoryRouter initialEntries={[at]}>
        <AdminProxiesPage />
        <Route
          path="*"
          render={props => {
            location = props.location
            return null
          }}
        />
      </MemoryRouter>
    )
  )
  return container
}

const sections = (c: HTMLElement) => [...c.querySelectorAll('[data-section]')].map(e => e.getAttribute('data-section'))
const tab = (c: HTMLElement, name: string) => c.querySelector<HTMLElement>(`[data-tab="${name}"]`)!

describe('AdminProxiesPage', () => {
  beforeEach(() => {
    policy.mockReset()
    policy.mockResolvedValue(POLICY)
  })

  it('reads the tab from ?view=, the Proxies tab without one', () => {
    expect(proxiesView('')).toBe('proxies')
    expect(proxiesView('?view=exits')).toBe('exits')
    expect(proxiesView('?view=machines')).toBe('machines')
    expect(proxiesView('?view=access')).toBe('access')
    expect(proxiesView('?view=limits')).toBe('limits')
    expect(proxiesView('?view=usage')).toBe('usage')
    expect(proxiesView('?view=nonsense')).toBe('proxies')
  })

  it('shows six tabs, the Proxies tab first, with remote.it’s proxies alone', async () => {
    const c = await render()
    expect([...c.querySelectorAll('[data-tab]')].map(t => t.textContent)).toEqual([
      'Proxies',
      'Exits',
      'Machines',
      'Access log',
      'Limits & policy',
      'Usage',
    ])
    expect(tab(c, 'proxies').getAttribute('aria-selected')).toBe('true')
    expect(sections(c)).toEqual(['proxies'])
    expect(c.textContent).not.toContain('Suspended accounts')
  })

  it('switches tab into the URL, each with its own sections', async () => {
    const c = await render()

    await act(async () => tab(c, 'exits').click())
    expect(location.search).toBe('?view=exits')
    expect(sections(c)).toEqual(['exits'])

    await act(async () => tab(c, 'machines').click())
    expect(location.search).toBe('?view=machines')
    expect(sections(c)).toEqual(['machines'])

    await act(async () => tab(c, 'access').click())
    expect(location.search).toBe('?view=access')
    expect(sections(c)).toEqual(['access'])
    expect(tab(c, 'access').getAttribute('aria-selected')).toBe('true')

    await act(async () => tab(c, 'limits').click())
    expect(location.search).toBe('?view=limits')
    expect(sections(c)).toEqual(['limits'])
    expect(c.textContent).toContain('Exit nodes: refused')
    expect(c.textContent).toContain('Days the access log is kept')
    expect(c.textContent).toContain('Suspended accounts')

    await act(async () => tab(c, 'usage').click())
    expect(location.search).toBe('?view=usage')
    expect(sections(c)).toEqual(['usage'])

    await act(async () => tab(c, 'proxies').click())
    expect(location.pathname).toBe('/admin/proxies')
    expect(location.search).toBe('')
    expect(sections(c)).toEqual(['proxies'])
  })

  it('lands on the tab the URL names', async () => {
    const c = await render('/admin/proxies?view=limits')
    expect(tab(c, 'limits').getAttribute('aria-selected')).toBe('true')
    expect(sections(c)).toEqual(['limits'])
  })

  it('shows Usage when the exit policy could not be read, and the other tabs say so', async () => {
    policy.mockResolvedValue('ERROR')
    const c = await render('/admin/proxies?view=usage')
    expect(sections(c)).toEqual(['usage'])
    await act(async () => tab(c, 'proxies').click())
    expect(sections(c)).toEqual([])
    expect(c.textContent).toContain('Could not read the exit policy.')
  })
})
