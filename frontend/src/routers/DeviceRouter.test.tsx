import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

const { carries } = vi.hoisted(() => ({ carries: { value: false as boolean | undefined } }))

vi.mock('../hooks/useDeviceCarries', () => ({ useDeviceCarries: () => carries.value }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../services/Context', async () => ({
  DeviceContext: (await import('react')).createContext({ device: { id: 'D1' } }),
}))
vi.mock('../store', () => ({}))
vi.mock('../pages/ScanPage', () => ({}))
vi.mock('../pages/DeviceDiscoverPage', () => ({}))
vi.mock('./ServiceRouter', () => ({}))
vi.mock('../selectors/devices', () => ({}))
vi.mock('../pages/ServiceAddPage', () => ({}))
vi.mock('../pages/DeviceDetailPage', () => ({}))
vi.mock('../pages/DeviceUsersPage', () => ({}))
vi.mock('../pages/DeviceEditPage', () => ({}))
vi.mock('../pages/DeviceRunsPage', () => ({}))
vi.mock('../pages/DeviceServicesPage', () => ({}))
vi.mock('../pages/DeviceActivityPage', () => ({}))
vi.mock('../hooks/useDeviceSessions', () => ({}))
vi.mock('../components/DynamicPanel', () => ({}))
vi.mock('../pages/DevicePage', () => ({}))
vi.mock('../pages/SharePage', () => ({}))
vi.mock('../components/Panel', () => ({}))
vi.mock('react-redux', () => ({}))
vi.mock('../pages/DeviceTransferPage', () => ({}))
vi.mock('../pages/DeviceAppCatalogPage', () => ({}))
vi.mock('../pages/DeviceAppPage', () => ({}))

import { LegacyRedirect } from './DeviceRouter'
import { LEGACY_PAGES } from '../helpers/deviceTabs'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const Where: React.FC = () => <div data-where>{useLocation().pathname}</div>

async function land(path: string) {
  const el = document.createElement('div')
  await act(async () =>
    createRoot(el).render(
      <MemoryRouter initialEntries={[path]}>
        <Switch>
          <Route path={`/devices/:deviceID/:page(${LEGACY_PAGES.join('|')})`}>
            <LegacyRedirect />
          </Route>
          <Route>
            <Where />
          </Route>
        </Switch>
      </MemoryRouter>
    )
  )
  return el
}

describe('old device addresses', () => {
  it.each([
    ['details', '/devices/D1/overview'],
    ['edit', '/devices/D1/settings'],
    ['users', '/devices/D1/sharing'],
    ['logs', '/devices/D1/activity'],
    ['agent', '/devices/D1/settings/agent'],
    ['runs', '/devices/D1/settings/advanced'],
    ['exit-flows', '/devices/D1/activity/flows'],
  ])('/devices/D1/%s lands on %s', async (page, target) => {
    carries.value = false
    expect((await land(`/devices/D1/${page}`)).querySelector('[data-where]')!.textContent).toBe(target)
  })

  it.each([
    ['runs', '/devices/D1/exit'],
    ['exit-flows', '/devices/D1/exit/flows'],
  ])('on a device that carries an exit, /devices/D1/%s lands on %s', async (page, target) => {
    carries.value = true
    expect((await land(`/devices/D1/${page}`)).querySelector('[data-where]')!.textContent).toBe(target)
  })

  it('waits while it is not yet known whether the device carries one', async () => {
    carries.value = undefined
    expect((await land('/devices/D1/runs')).querySelector('[data-loading]')).not.toBeNull()
  })
})
