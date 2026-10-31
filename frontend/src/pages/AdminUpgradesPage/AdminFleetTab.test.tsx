import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The Upgrades page's Fleet tab: until graphql serves fleetVersions it says so; then a matrix of groups by version,
// the releases labelled, the older amber and folded, totals, a cell's devices on a click — and the choices in the URL.
const { versions, devices } = vi.hoisted(() => ({ versions: vi.fn(), devices: vi.fn() }))
vi.mock('../../services/graphQLFleetVersions', () => ({ graphQLFleetVersions: versions, graphQLFleetDevices: devices }))
vi.mock('../../services/graphQLDaemonRollout', () => ({
  graphQLDaemonChannels: vi.fn(async () => []),
  graphQLDaemonRollouts: vi.fn(async () => []),
}))
vi.mock('../../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', DAEMON_CHANNELS: ['stable', 'beta'] }))
vi.mock('../../components/Link', () => ({ Link: ({ to, children }: any) => <a href={to}>{children}</a> }))
vi.mock('../../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../../store', () => ({}))
vi.mock('../../components/Confirm', () => ({ Confirm: () => null }))
vi.mock('../../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../../components/Attributes', () => ({
  Attribute: class {
    constructor(options: object) {
      Object.assign(this, options)
    }
  },
}))
vi.mock('../../components/Icon', () => ({ Icon: () => null }))
vi.mock('../../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../../components/GridList', () => ({ GridList: ({ children }: any) => <div>{children}</div> }))
vi.mock('../../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => <button onClick={onClick}>{title}</button>,
}))
vi.mock('../../hooks/useContainerWidth', () => ({ useContainerWidth: () => ({ containerRef: { current: null } }) }))
vi.mock('../../hooks/useResizablePanel', () => ({
  useResizablePanel: () => ({ width: 500, panelRef: { current: null }, onDown: () => {}, grab: false }),
}))

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { lightColors } from '../../styling'
import { AdminUpgradesPage } from './AdminUpgradesPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const count = (version: string, devices: number, online = 0) => ({ version, devices, online })
const VERSIONS = ['1.1.0.9', '1.1.0.8', '1.1.0.7', '1.1.0.6', '1.1.0.5', '1.1.0.4', '1.1.0.3', '1.1.0.2']
const VIEW = {
  checked: '2026-10-30T23:49:49.983Z',
  groupBy: ['packageType'],
  versionOf: 'package',
  columns: [
    { ...count(VERSIONS[0], 3, 3), label: 'candidate', behind: null },
    { ...count(VERSIONS[1], 50, 40), label: 'current', behind: null },
    ...VERSIONS.slice(2).map((version, i) => ({ ...count(version, 2, 1), label: null, behind: i + 1 })),
    { ...count('none', 10, 2), label: 'none', behind: null },
  ],
  rows: [
    {
      key: 'deb',
      values: ['deb'],
      label: 'deb',
      dimension: 'packageType',
      depth: 0,
      parentKey: null,
      total: 41,
      online: 30,
      cells: [count(VERSIONS[1], 40, 30), count(VERSIONS[7], 1, 0)],
    },
    {
      key: 'bare%20connectd',
      values: ['bare connectd'],
      label: 'bare connectd',
      dimension: 'packageType',
      depth: 0,
      parentKey: null,
      total: 10,
      online: 2,
      cells: [count('none', 10, 2)],
    },
  ],
  totals: { devices: 75, online: 52 },
}

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})
const state = { ui: { layout: { singlePanel: false }, columnWidths: {} } }
const store = { getState: () => state, subscribe: () => () => {}, dispatch: () => {} } as any

let location: { search: string } = { search: '' }
async function render(path: string) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () =>
    createRoot(el).render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[path]}>
            <Route path="/admin/upgrades/:rolloutId?">
              <AdminUpgradesPage />
            </Route>
            <Route
              path="*"
              render={({ location: at }) => {
                location = at
                return null
              }}
            />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    )
  )
  await act(async () => {})
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
  versions.mockReset().mockResolvedValue(VIEW)
  devices.mockReset().mockResolvedValue({
    checked: VIEW.checked,
    total: 40,
    devices: [
      {
        id: '80:00:00:00:00:00:00:01',
        name: 'pi-1',
        version: VERSIONS[1],
        online: true,
        lastSeen: 'online',
        packageType: 'deb',
        package: VERSIONS[1],
        os: 'Debian GNU/Linux 12',
        arch: 'arm64',
        account: 'Acme (ops@acme.test)',
        release: 'current',
        managed: 'managed',
      },
    ],
  })
})

describe('the Fleet tab', () => {
  it('says the API is not there yet until graphql serves fleetVersions', async () => {
    versions.mockResolvedValue('UNSUPPORTED')
    const el = await render('/admin/upgrades?view=fleet&group=packageType')
    expect(el.textContent).toContain('This API has no fleet view yet')
  })

  it('the rollouts view has the tab beside it', async () => {
    const el = await render('/admin/upgrades')
    expect(el.querySelector('[data-tab="fleet"]')).not.toBeNull()
    expect(versions).not.toHaveBeenCalled()
  })

  it('asks for the view the URL names', async () => {
    await render('/admin/upgrades?view=fleet&group=account&then=os&of=package&online=1&q=acme')
    expect(versions).toHaveBeenCalledWith({
      groupBy: ['account', 'os'],
      versionOf: 'package',
      onlineOnly: true,
      accountSearch: 'acme',
    })
  })

  it('the newest six versions their own columns, the rest folded, none last; the releases labelled, the older amber', async () => {
    const el = await render('/admin/upgrades?view=fleet&group=packageType&of=package')
    const columns = [...el.querySelectorAll('[data-column]')].map(c => c.getAttribute('data-column'))
    expect(columns).toEqual([...VERSIONS.slice(0, 6), 'older', 'none'])
    expect(el.querySelector(`[data-column="${VERSIONS[1]}"]`)!.textContent).toContain('current')
    expect(el.querySelector(`[data-column="${VERSIONS[0]}"]`)!.textContent).toContain('candidate')
    const shade = (version: string) => getComputedStyle(el.querySelector(`[data-column="${version}"]`)!).backgroundColor
    expect(shade(VERSIONS[1])).not.toMatch(/237, 153, 18/)
    expect(shade(VERSIONS[2])).toMatch(/237, 153, 18/)
    expect(shade(VERSIONS[2])).not.toBe(shade(VERSIONS[4]))
    // The fold holds the two oldest: deb's one device on the oldest is under it.
    expect(el.querySelector('[data-cell="deb|older"]')!.textContent).toBe('1')
    expect(el.querySelector('[data-cell="deb|total"]')!.textContent).toBe('41')
    expect(el.querySelector('[data-cell="|total"]')!.textContent).toBe('75')
    expect(el.querySelector('[data-cell="|none"]')!.textContent).toBe('10')

    await act(async () => (el.querySelector('[data-expand-older]') as HTMLButtonElement).click())
    expect(location.search).toContain('older=1')
    expect([...el.querySelectorAll('[data-column]')]).toHaveLength(9)
  })

  it('percentages of each row, in the URL', async () => {
    const el = await render('/admin/upgrades?view=fleet&group=packageType&pct=1')
    expect(el.querySelector(`[data-cell="deb|${VERSIONS[1]}"]`)!.textContent).toBe('97.6%')
    expect(el.querySelector('[data-cell="deb|total"]')!.textContent).toBe('41')
  })

  it("a cell's devices on a click, linked to the device", async () => {
    const el = await render('/admin/upgrades?view=fleet&group=packageType&of=package')
    await act(async () => (el.querySelector(`[data-cell="deb|${VERSIONS[1]}"] [role="button"]`) as HTMLElement).click())
    await act(async () => {})
    expect(devices).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: ['packageType'], values: ['deb'], versions: [VERSIONS[1]], limit: 200 })
    )
    const drill = el.querySelector('[data-drill]')!
    expect(drill.textContent).toContain('The first 1 of 40, online first')
    expect(drill.querySelector('a')!.getAttribute('href')).toBe('/admin/devices/80:00:00:00:00:00:00:01')

    // The fold's cell: all its versions.
    await act(async () => (el.querySelector('[data-cell="deb|older"] [role="button"]') as HTMLElement).click())
    expect(devices).toHaveBeenLastCalledWith(expect.objectContaining({ values: ['deb'], versions: VERSIONS.slice(6) }))
    // A total: every version.
    await act(async () => (el.querySelector('[data-cell="|total"] [role="button"]') as HTMLElement).click())
    expect(devices).toHaveBeenLastCalledWith(expect.objectContaining({ values: [], versions: undefined }))
  })
})

describe('the choices', () => {
  it('each change goes into the URL; the desktop app version is offered but not recorded', async () => {
    const el = await render('/admin/upgrades?view=fleet&group=packageType')
    await act(async () => (el.querySelector('[data-version-of="package"]') as HTMLButtonElement).click())
    expect(location.search).toContain('of=package')
    expect((el.querySelector('[data-version-of="desktop"]') as HTMLButtonElement).disabled).toBe(true)
    await act(async () => (el.querySelector('[data-show="online"]') as HTMLButtonElement).click())
    expect(location.search).toContain('online=1')
    await act(async () => (el.querySelector('[data-percent]') as HTMLButtonElement).click())
    expect(location.search).toContain('pct=1')
    expect(versions).toHaveBeenLastCalledWith(expect.objectContaining({ versionOf: 'package', onlineOnly: true }))
  })
})
