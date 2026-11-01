import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The Upgrades page's Fleet tab: until graphql serves fleetVersions it says so; then a matrix of groups by version,
// the releases labelled, the older amber and folded, totals, a cell's devices on a click — and the choices in the URL.
const { versions, devices, fields } = vi.hoisted(() => ({ versions: vi.fn(), devices: vi.fn(), fields: vi.fn() }))
vi.mock('../../services/graphQLFleetVersions', () => ({
  graphQLFleetVersions: versions,
  graphQLFleetDevices: devices,
  graphQLFleetFields: fields,
}))
vi.mock('../../services/graphQLDaemonRollout', () => ({
  graphQLDaemonChannels: vi.fn(async () => []),
  graphQLDaemonRollouts: vi.fn(async () => []),
  graphQLDaemonInstall: vi.fn(async () => false),
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

// FleetDevice's fields once graphql serves what a device is (DEVICE-TAXONOMY's build contract), the old package type
// still among them.
const TAXONOMY = new Set([
  'id',
  'version',
  'packageType',
  'implementation',
  'implementationSource',
  'controlLink',
  'features',
  'featuresSource',
  'distribution',
  'format',
  'updatedBy',
  'updateState',
])

beforeEach(() => {
  document.body.innerHTML = ''
  fields.mockReset().mockResolvedValue(new Set(['id', 'version', 'packageType']))
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
    // Online only by default; All says so in the URL.
    expect(versions).toHaveBeenCalledWith(expect.objectContaining({ onlineOnly: true }))
    await act(async () => (el.querySelector('[data-show="all"]') as HTMLButtonElement).click())
    expect(location.search).toContain('online=0')
    await act(async () => (el.querySelector('[data-percent]') as HTMLButtonElement).click())
    expect(location.search).toContain('pct=1')
    expect(versions).toHaveBeenLastCalledWith(expect.objectContaining({ versionOf: 'package', onlineOnly: false }))
    // The second grouping reads None when empty, its label above it.
    const then = el.querySelector('[data-choice="then"]')!.closest('.MuiFormControl-root')!
    expect(then.textContent).toContain('Then by')
    expect(then.textContent).toContain('None')
  })
})

describe('before graphql serves what a device is', () => {
  it('groups by package type, as today, and offers none of the new groupings', async () => {
    const el = await render('/admin/upgrades?view=fleet')
    expect(versions).toHaveBeenCalledWith(expect.objectContaining({ groupBy: ['packageType'] }))
    expect(el.querySelector('[data-fleet-matrix] th')!.textContent).toBe('Package type')
    expect(el.textContent).not.toContain('(old)')
  })

  it("the API's own words for a device without a Control Link are not shown", async () => {
    versions.mockResolvedValue({
      ...VIEW,
      rows: [{ ...VIEW.rows[0], key: 'c', values: ['connectd, no device session'], label: 'connectd, no device session' }],
    })
    const el = await render('/admin/upgrades?view=fleet&group=packageType')
    expect(el.textContent).toContain('connectd, Classic')
    expect(el.textContent).not.toMatch(/device session/i)
  })
})

describe('once graphql serves what a device is', () => {
  // As graphql serves it (graphql-api solo-taxonomy ce86ef62): versions keyed beside their implementation, Go's
  // columns first, each daemon's unknown last, none last of all.
  const GO = 'Go 5.6.1.1761000000'
  const GO_OLD = 'Go 5.6.0.1760000000'
  const TAXONOMY_VIEW = {
    ...VIEW,
    groupBy: ['implementation', 'controlLink'],
    versionOf: 'connectd',
    columns: [
      { ...count(GO, 5, 5), implementation: 'go', majorMinor: false, label: 'current', behind: null },
      { ...count(GO_OLD, 2, 1), implementation: 'go', majorMinor: false, label: null, behind: 1 },
      { ...count('Go unknown', 1, 1), implementation: 'go', majorMinor: false, label: null, behind: null },
      { ...count('C 5.6', 30, 20), implementation: 'c', majorMinor: true, label: null, behind: null },
      { ...count('C 5.5', 4, 1), implementation: 'c', majorMinor: true, label: null, behind: null },
      { ...count('C unknown', 3, 0), implementation: 'c', majorMinor: false, label: null, behind: null },
      { ...count('none', 0, 0), implementation: null, majorMinor: false, label: 'none', behind: null },
    ],
    rows: [
      { key: 'go', values: ['go'], label: 'Go', dimension: 'implementation', depth: 0, parentKey: null, total: 8, online: 7, cells: [count(GO, 5, 5), count(GO_OLD, 2, 1), count('Go unknown', 1, 1)] },
      { key: 'go/true', values: ['go', 'true'], label: 'Control Link', dimension: 'controlLink', depth: 1, parentKey: 'go', total: 8, online: 7, cells: [count(GO, 5, 5), count(GO_OLD, 2, 1), count('Go unknown', 1, 1)] },
      { key: 'c', values: ['c'], label: 'C', dimension: 'implementation', depth: 0, parentKey: null, total: 37, online: 21, cells: [count('C 5.6', 30, 20), count('C 5.5', 4, 1), count('C unknown', 3, 0)] },
      { key: 'c/false', values: ['c', 'false'], label: 'Classic', dimension: 'controlLink', depth: 1, parentKey: 'c', total: 37, online: 21, cells: [count('C 5.6', 30, 20), count('C 5.5', 4, 1), count('C unknown', 3, 0)] },
    ],
    totals: { devices: 45, online: 28 },
  }

  beforeEach(() => {
    fields.mockResolvedValue(TAXONOMY)
    versions.mockResolvedValue(TAXONOMY_VIEW)
  })

  it('groups by daemon, then by Control Link, unless the URL says; the rows in the names customers see', async () => {
    const el = await render('/admin/upgrades?view=fleet')
    expect(versions).toHaveBeenCalledWith(expect.objectContaining({ groupBy: ['implementation', 'controlLink'] }))
    expect(el.querySelector('[data-fleet-matrix] th')!.textContent).toBe('Daemon › Control Link')
    const label = (key: string) => el.querySelector(`[data-row="${key}"] th, [data-row="${key}"] td`)!.textContent
    expect(label('go')).toBe('Go')
    expect(label('go/true')).toBe('Control Link')
    expect(label('c')).toBe('C')
    expect(label('c/false')).toBe('Classic')
  })

  it('a link that names the old package type still opens it', async () => {
    await render('/admin/upgrades?view=fleet&group=packageType')
    expect(versions).toHaveBeenCalledWith(expect.objectContaining({ groupBy: ['packageType'] }))
  })

  it('each version beside its daemon, C major.minor marked, unknown its own column, none of them folded together', async () => {
    const el = await render('/admin/upgrades?view=fleet')
    const columns = [...el.querySelectorAll('[data-column]')]
    expect(columns.map(c => c.getAttribute('data-column'))).toEqual([GO, GO_OLD, 'Go unknown', 'C 5.6', 'C 5.5', 'C unknown', 'none'])
    expect(columns.map(c => c.querySelector('div')!.textContent)).toEqual([
      GO,
      GO_OLD,
      'Go unknown',
      'C 5.6',
      'C 5.5',
      'C unknown',
      'none',
    ])
    expect(el.querySelector('[data-column="C 5.6"] [data-major-minor]')!.textContent).toBe('major.minor')
    expect(el.querySelector(`[data-column="${GO}"] [data-major-minor]`)).toBeNull()
    expect(el.querySelector('[data-column="C unknown"] [data-major-minor]')).toBeNull()
    expect(el.querySelector('[data-cell="c|C unknown"]')!.textContent).toBe('3')
    // A cell's devices by the API's own key.
    await act(async () => (el.querySelector('[data-cell="c|C 5.6"] [role="button"]') as HTMLElement).click())
    expect(devices).toHaveBeenLastCalledWith(expect.objectContaining({ values: ['c'], versions: ['C 5.6'] }))
  })

  it('the distribution in the names customers see: never CloudShift', async () => {
    versions.mockResolvedValue({
      ...TAXONOMY_VIEW,
      groupBy: ['distribution'],
      rows: [
        { ...TAXONOMY_VIEW.rows[0], key: 'remoteit', values: ['remoteit'], label: 'CloudShift package', dimension: 'distribution' },
        { ...TAXONOMY_VIEW.rows[0], key: 'remoteit-device', values: ['remoteit-device'], label: 'remoteit-device', dimension: 'distribution' },
        { ...TAXONOMY_VIEW.rows[0], key: 'odd', values: ['odd'], label: 'a CloudShift build', dimension: 'distribution' },
      ],
    })
    const el = await render('/admin/upgrades?view=fleet&group=distribution')
    expect(el.querySelector('[data-row="remoteit"]')!.textContent).toContain('remote.it package (classic)')
    expect(el.querySelector('[data-row="remoteit-device"]')!.textContent).toContain('remote.it package')
    expect(el.textContent).not.toMatch(/cloud ?shift/i)
  })

  it('a feature grouping names its feature, with a picker for which, and reads supports or not', async () => {
    versions.mockResolvedValue({
      ...TAXONOMY_VIEW,
      groupBy: ['feature:subnet'],
      rows: [
        { ...TAXONOMY_VIEW.rows[0], key: 'yes', values: ['yes'], label: 'supports subnet', dimension: 'feature:subnet' },
        { ...TAXONOMY_VIEW.rows[0], key: 'no', values: ['no'], label: 'does not support subnet', dimension: 'feature:subnet' },
      ],
    })
    const el = await render('/admin/upgrades?view=fleet&group=feature:subnet')
    expect(versions).toHaveBeenCalledWith(expect.objectContaining({ groupBy: ['feature:subnet'] }))
    expect((el.querySelector('[data-feature="group"]') as HTMLInputElement).value).toBe('subnet')
    expect(el.querySelector('[data-fleet-matrix] th')!.textContent).toBe('Feature: subnet')
    expect(el.querySelector('[data-row="yes"]')!.textContent).toContain('supports subnet')
    expect(el.querySelector('[data-row="no"]')!.textContent).toContain('does not support subnet')
  })

  it("a cell's devices say what each is: daemon, link, package, what upgrades it, its features — a held one blocked", async () => {
    devices.mockResolvedValue({
      checked: VIEW.checked,
      total: 2,
      devices: [
        {
          id: '80:00:00:00:00:00:00:01',
          name: 'pi-1',
          version: GO,
          online: true,
          lastSeen: 'online',
          package: '1.1.0.9',
          connectd: '5.6.1.1761000000',
          connectdMajorMinor: false,
          release: 'current',
          managed: 'managed: held',
          implementation: 'go',
          implementationSource: 'report',
          controlLink: true,
          features: ['remote-upgrade', 'subnet'],
          featuresSource: 'report',
          distribution: 'remoteit-device',
          format: 'deb',
          updatedBy: 'remoteit',
          updateState: 'held',
        },
        {
          id: '80:00:00:00:00:00:00:02',
          name: 'old',
          version: 'C 5.6',
          online: true,
          lastSeen: 'online',
          connectd: '5.6',
          connectdMajorMinor: true,
          format: null,
          release: 'no device session',
          managed: 'unmanaged: classic',
          implementation: 'c',
          implementationSource: 'fallback',
          controlLink: false,
          features: [],
          featuresSource: 'table',
          distribution: 'remoteit',
          updatedBy: 'package-manager',
          updateState: null,
        },
        {
          id: '80:00:00:00:00:00:00:03',
          name: 'box',
          version: 'Go unknown',
          online: true,
          lastSeen: 'online',
          connectd: null,
          connectdMajorMinor: false,
          format: 'container',
          release: 'current',
          managed: 'unmanaged: updated by image',
          implementation: 'go',
          implementationSource: 'fallback',
          controlLink: true,
          features: [],
          featuresSource: 'table',
          distribution: 'unknown',
          updatedBy: 'image',
          updateState: null,
        },
      ],
    })
    const el = await render('/admin/upgrades?view=fleet')
    await act(async () => (el.querySelector(`[data-cell="go|${GO}"] [role="button"]`) as HTMLElement).click())
    await act(async () => {})
    const row = (id: string) => el.querySelector(`[data-device="${id}"]`)!
    const pi = row('80:00:00:00:00:00:00:01')
    expect(pi.querySelector('[data-drill-version]')!.textContent).toBe(GO)
    expect(pi.querySelector('[data-drill-link]')!.textContent).toBe('Control Link')
    expect(pi.querySelector('[data-drill-package]')!.textContent).toBe('remote.it package 1.1.0.9Debian package (.deb)')
    expect(pi.querySelector('[data-drill-updated-by]')!.textContent).toBe('remote.it rollouts')
    expect(pi.querySelector('[data-drill-features]')!.textContent).toBe('remote-upgrade, subnet')
    expect(pi.querySelector('[data-held]')!.textContent).toBe("blocked: held by the device's admin")
    expect(pi.textContent).toContain("managed: held by the device's admin")
    const old = row('80:00:00:00:00:00:00:02')
    expect(old.querySelector('[data-drill-version]')!.textContent).toBe('C 5.6major.minor')
    expect(old.querySelector('[data-drill-link]')!.textContent).toBe('Classic')
    expect(old.querySelector('[data-drill-package]')!.textContent).toBe('remote.it package (classic)')
    expect(old.querySelector('[data-drill-updated-by]')!.textContent).toBe('package manager')
    expect(old.querySelector('[data-drill-features]')!.textContent).toBe('—from its version')
    expect(old.querySelector('[data-held]')).toBeNull()
    expect(old.textContent).toContain('unmanaged: Classic')
    const box = row('80:00:00:00:00:00:00:03')
    expect(box.querySelector('[data-drill-version]')!.textContent).toBe('Go unknown')
    expect(box.querySelector('[data-drill-package]')!.textContent).toBe('unknowncontainer image')
    expect(box.querySelector('[data-drill-updated-by]')!.textContent).toBe('container image')
    expect(box.textContent).toContain('unmanaged: updated by container image')
    expect(el.querySelector('[data-drill]')!.textContent).not.toMatch(/device session|cloud ?shift/i)
  })
})
