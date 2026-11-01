import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The admin Upgrades page: each channel's buckets and delivery, the runs newest first with the live one marked, and a
// run's detail — a hold for failures puts them first, with what an earlier resume reviewed, and Resume says how many
// it will mark reviewed; Abort asks a reason, then confirms.
const FALLBACK = vi.hoisted(() => ({
  ladder: [1, 10, 50, 100],
  soakMinutes: 5,
  firstSoakMinutes: 10,
  rateFloor: 2,
  rateCeiling: 15,
  failureThreshold: 0,
}))
const { channels, runs, run, mutate, served, packages, defaults, install, setInstall, refresh } = vi.hoisted(() => ({
  install: vi.fn(),
  refresh: vi.fn(),
  setInstall: vi.fn(async () => ({ ok: true } as any)),
  packages: vi.fn(),
  defaults: vi.fn(),
  channels: vi.fn(),
  runs: vi.fn(),
  run: vi.fn(),
  mutate: vi.fn(async () => ({ ok: true } as any)),
  served: vi.fn(
    async () =>
      new Set([
        'startDaemonRollout',
        'pauseDaemonRollout',
        'resumeDaemonRollout',
        'abortDaemonRollout',
        'skipDaemonRolloutStep',
        'setDaemonRolloutRate',
        'setDaemonInstall',
      ])
  ),
}))
vi.mock('../../services/graphQLDaemonRollout', () => ({
  graphQLDaemonChannels: channels,
  graphQLDaemonRollouts: runs,
  graphQLDaemonRollout: run,
  rolloutActionsServed: served,
  rolloutAction: mutate,
  startDaemonRollout: mutate,
  graphQLDaemonPackages: packages,
  graphQLDaemonInstall: install,
  refreshDaemonRollout: refresh,
  setDaemonInstall: setInstall,
  startArgsServed: async () => new Set(['rollback']),
  graphQLRolloutDefaults: defaults,
  FALLBACK_DEFAULTS: FALLBACK,
}))
vi.mock('../../services/graphQLFleetVersions', () => ({ graphQLFleetVersions: vi.fn(), graphQLFleetDevices: vi.fn() }))
vi.mock('../../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', DAEMON_CHANNELS: ['stable', 'beta'] }))
vi.mock('../../components/Confirm', () => ({
  Confirm: ({ open, title, children, onConfirm, action, disabled }: any) =>
    open ? (
      <div data-confirm>
        <b>{title}</b> {children}
        <button disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
      </div>
    ) : null,
}))
vi.mock('../../components/Link', () => ({ Link: ({ to, children }: any) => <a href={to}>{children}</a> }))
vi.mock('../../components/Notice', () => ({ Notice: ({ children }: any) => <div>{children}</div> }))
vi.mock('../../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../../store', () => ({}))
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

const STABLE = {
  channel: 'stable',
  percent: 10,
  updated: '2026-10-30T23:47:48.000Z',
  accounts: [],
  devices: [],
  current: {
    version: '1.1.0.1',
    manifest: 'https://downloads.solo.remote.it/device/1.1.0.1/manifest.json',
    rollback: false,
  },
  candidate: {
    version: '1.1.0.2',
    manifest: 'https://downloads.solo.remote.it/device/1.1.0.2/manifest.json',
    rollback: false,
  },
  rollout: {
    wanted: 100,
    onWanted: 60,
    pending: 5,
    upgrading: 5,
    failed: 2,
    stuck: 1,
    unmanaged: 20,
    offline: 7,
    devices: 100,
    checked: '2026-10-30T23:49:49.983Z',
    stuckMinutes: 30,
    failures: [{ reason: 'download: 404', devices: 2 }],
    unmanagedReasons: [{ reason: 'no package', devices: 20 }],
    candidate: {
      wanted: 10,
      onWanted: 5,
      pending: 1,
      upgrading: 1,
      failed: 2,
      stuck: 1,
      unmanaged: 0,
      offline: 0,
      failures: [{ reason: 'download: 404', devices: 2 }],
    },
    current: {
      wanted: 90,
      onWanted: 55,
      pending: 4,
      upgrading: 4,
      failed: 0,
      stuck: 0,
      unmanaged: 20,
      offline: 7,
      failures: [],
    },
    pinned: { wanted: 0, onWanted: 0, pending: 0, upgrading: 0, failed: 0, stuck: 0, unmanaged: 0, offline: 0 },
  },
  delivery: {
    change: 16,
    version: '1.1.0.2',
    state: 'delivering',
    total: 100,
    delivered: 40,
    pacedDelivered: 30,
    unpacedDelivered: 10,
    skippedUnmanaged: 20,
    failed: 0,
    unchanged: 0,
    remaining: 60,
    walked: 100,
    perSecond: 15,
    startedAt: '2026-10-30T23:47:48.785Z',
    finishedAt: null,
    retryAt: null,
    error: null,
  },
}

const HELD = {
  id: 'R2',
  channel: 'stable',
  mode: 'auto',
  version: '1.1.0.2',
  fromVersion: '1.1.0.1',
  state: 'holding',
  reason: '3 devices failed',
  holdCause: 'failures',
  percent: 5,
  ladder: [1, 5, 25, 100],
  rate: 10,
  rateCeiling: 15,
  failureThreshold: 0,
  startedAt: '2026-10-30T20:00:00Z',
  endedAt: null,
  startedBy: 'evan@remote.it',
  promoteWhenDone: true,
  steps: [
    {
      percent: 1,
      startedAt: '2026-10-30T20:00:00Z',
      deliveredAt: '2026-10-30T20:01:00Z',
      convergedAt: '2026-10-30T20:10:00Z',
      soakedAt: '2026-10-30T20:40:00Z',
      paced: 10,
      unpaced: 0,
      failed: 0,
      peakCpu: 41,
      rate: 10,
    },
    {
      percent: 5,
      startedAt: '2026-10-30T20:40:00Z',
      deliveredAt: '2026-10-30T20:45:00Z',
      paced: 40,
      unpaced: 2,
      failed: 3,
      peakCpu: 55,
      rate: 10,
    },
  ],
  events: [
    { at: '2026-10-30T20:00:00Z', kind: 'start', message: 'started' },
    { at: '2026-10-30T20:50:00Z', kind: 'hold', message: '3 devices failed' },
  ],
  rollout: {
    ...STABLE.rollout,
    candidate: {
      ...STABLE.rollout.candidate,
      failures: [
        {
          reason: 'download: 404',
          devices: 3,
          deviceIds: ['80:00:00:00:00:00:00:0A'],
          failedDevices: [{ deviceId: '80:00:00:00:00:00:00:0A', transient: false, retrying: false, attempts: 1 }],
        },
        { reason: 'install: disk full', devices: 1 },
        {
          reason: 'failed (transient, retrying): download timed out',
          devices: 1,
          failedDevices: [
            {
              deviceId: '80:00:00:00:00:00:00:0B',
              transient: true,
              retrying: true,
              attempts: 2,
              retryAt: '2026-10-30T20:52:00Z',
            },
          ],
        },
      ],
    },
  },
  reviewedFailures: [{ reason: 'install: disk full', devices: 1 }],
  delivery: STABLE.delivery,
  gates: {
    at: '2026-10-30T20:50:00Z',
    presenceCpuMax: 74,
    presenceCpuAvg: 30,
    presenceMemoryMax: 50,
    refused: 0,
    dropped: 0,
    failures: 3,
    reviewedFailures: 1,
    excludedFailures: 1,
    transientFailures: 1,
    stuck: 0,
    cpuHold: 70,
    cpuAbort: 85,
    memoryAbort: 80,
  },
}
const DONE = {
  ...HELD,
  id: 'R1',
  state: 'done',
  reason: null,
  version: '1.1.0.1',
  fromVersion: '1.1.0.0',
  startedAt: '2026-10-01T00:00:00Z',
  endedAt: '2026-10-01T03:00:00Z',
  gates: { failures: 0 },
}

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})
const state = { ui: { layout: { singlePanel: false }, columnWidths: {} } }
const store = {
  getState: () => state,
  subscribe: () => () => {},
  dispatch: () => {},
} as any

let seenAt: { pathname: string; search: string } = { pathname: '', search: '' }
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
                at && (seenAt = at)
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

const button = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll('button')].find(b => b.textContent?.trim() === text)!
const click = (el: HTMLElement, text: string) => act(async () => button(el, text).click())

beforeEach(() => {
  document.body.innerHTML = ''
  channels.mockReset().mockResolvedValue([STABLE])
  runs.mockReset().mockResolvedValue([HELD, DONE])
  run.mockReset().mockResolvedValue(HELD)
  mutate.mockClear()
  packages.mockReset().mockResolvedValue(false)
  install.mockReset().mockResolvedValue(false)
  refresh.mockReset().mockResolvedValue(false)
  setInstall.mockClear()
  defaults.mockReset().mockResolvedValue(FALLBACK)
})

describe('AdminUpgradesPage', () => {
  it("shows each channel's managed buckets, the unmanaged beside them, and its delivery", async () => {
    const el = await render('/admin/upgrades')
    const channel = el.querySelector('[data-channel="stable"]')!
    expect(channel.textContent).toContain('candidate 1.1.0.2 at 10%')
    const bar = channel.querySelector('[data-bucket-bar]')!
    const segments = [...bar.querySelectorAll('[data-segment]')].map(s => s.getAttribute('data-segment'))
    expect(segments).toEqual(['onWanted', 'pending', 'upgrading', 'stuck', 'failed', 'offline'])
    expect(bar.textContent).not.toContain('Unmanaged')
    const bars = [...channel.querySelectorAll('[data-bucket-bar]')]
    expect(bars.map(b => b.querySelector('[data-bar-heading]')!.textContent)).toEqual([
      'Whole channel: every managed device on stable · 80 devices',
      'Candidate group: the 10% selected for 1.1.0.2 · 10 devices',
    ])
    expect(bars[0].querySelector('[data-bar-hint]')!.textContent).toContain('outside the candidate group want current')
    expect(bars[1].querySelector('[data-bar-hint]')!.textContent).toContain('chosen to run the candidate')
    // The candidate group has the same legend, with its counts.
    expect(bars[1].textContent).toContain('On wanted 5')
    expect(bars[1].textContent).toContain('Failed 2')
    const line = channel.querySelector('[data-managed-line]')!
    // The managed line heads the card, above both bars.
    expect(line.compareDocumentPosition(bars[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Failures by group, where graphql gives the split.
    const failures = channel.querySelector('[data-channel-failures]')!
    expect(failures.textContent).toContain('Failures · candidate group')
    expect(failures.textContent).toContain('2 download: 404')
    expect(failures.textContent).toContain('Failures · rest of the channel: none')
    expect(line.textContent).toContain('80 managed · 20 unmanaged')
    expect(line.textContent).not.toContain('no package')
    expect(channel.querySelector('[data-delivery]')!.textContent).toContain('40 of 80 managed devices delivered')
    expect(channel.querySelector('[data-delivery]')!.textContent).not.toContain('skipped')
    expect(channel.querySelector('[data-delivery-bookkeeping]')!.textContent).toBe('0 unchanged')
    expect(channel.querySelector('[data-delivery]')!.textContent).toContain('ETA 4s')
    await act(async () => (line.querySelector('[data-unmanaged-toggle]') as HTMLElement).click())
    expect(line.textContent).toContain('no package')
  })

  it('lists the runs newest first, the live one marked', async () => {
    const el = await render('/admin/upgrades')
    const rows = [...el.querySelectorAll('[data-rollout]')]
    expect(rows.map(r => r.getAttribute('data-rollout'))).toEqual(['R2', 'R1'])
    expect(rows[0].textContent).toContain('holding')
    expect(rows[0].textContent).toContain('5% (2 of 4)')
    expect(rows[0].textContent).toContain('evan@remote.it')
    expect(rows[1].textContent).toContain('3h 00m')
  })

  it('without a controller: the channels still, and a note for the runs', async () => {
    runs.mockResolvedValue(false)
    const el = await render('/admin/upgrades')
    expect(el.querySelector('[data-channel="stable"]')).not.toBeNull()
    expect(el.textContent).toContain('no rollout controller yet')
    expect(button(el, 'New rollout')).toBeUndefined()
  })

  it('a hold for failures puts them first, with what was reviewed, and Resume says how many it marks reviewed', async () => {
    const el = await render('/admin/upgrades/R2')
    const failures = el.querySelector('[data-failures]')!
    expect(failures.textContent).toContain('Held for failures')
    const steps = el.querySelector('[data-steps]')!
    expect(failures.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(el.querySelector('[data-failure="install: disk full"]')!.textContent).toContain('1 reviewed')
    expect(el.querySelector('[data-gate="presenceCpuMax"]')!.textContent).toContain(
      'rate lowered at 70%, holds at 85% for 2 min'
    )
    expect(el.querySelector('[data-gate="failures"]')!.textContent).toContain('holds above 0')
    expect(el.querySelector('[data-gate="queueOldestMs"]')).toBeNull() // not given by this API: left out
    expect(el.querySelector('[data-hold-cause="failures"]')!.textContent).toContain('Failures')
    // A transient failure still retrying is apart from the real ones, with its attempts.
    const real = el.querySelector('[data-real-failures]')!
    expect(real.textContent).not.toContain('timed out')
    expect(real.querySelector('a[href="/admin/devices/80:00:00:00:00:00:00:0A"]')).not.toBeNull()
    const retrying = el.querySelector('[data-retrying-device="80:00:00:00:00:00:00:0B"]')!
    expect(retrying.textContent).toContain('download timed out')
    expect(retrying.textContent).toContain('2')
    expect(el.querySelector('[data-events]')!.textContent).toContain('3 devices failed')

    await click(el, 'Resume')
    expect(el.querySelector('[data-resume-message]')!.textContent).toContain('3 failures will be marked reviewed')
    await act(async () => (el.querySelector('[data-confirm] button') as HTMLButtonElement).click())
    expect(mutate).toHaveBeenCalledWith({ name: 'resumeDaemonRollout', id: 'R2' })
  })

  it('abort asks a reason, then confirms', async () => {
    const el = await render('/admin/upgrades/R2')
    await click(el, 'Abort')
    expect(button(el, 'Continue').disabled).toBe(true)
    const input = el.querySelector('[data-confirm] textarea') as HTMLTextAreaElement
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
      setter.call(input, 'cpu too high')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(el, 'Continue')
    expect(mutate).not.toHaveBeenCalled()
    expect(el.querySelector('[data-confirm]')!.textContent).toContain('Reason: cpu too high')
    await act(async () => (el.querySelector('[data-confirm] button') as HTMLButtonElement).click())
    expect(mutate).toHaveBeenCalledWith({ name: 'abortDaemonRollout', id: 'R2', reason: 'cpu too high' })
  })

  it('a queue hold reads as such, with the queue against its line, and no failures panel first', async () => {
    run.mockResolvedValue({
      ...HELD,
      holdCause: 'queue',
      reason: 'presence queue oldest 1.4 s for 2 min',
      gates: {
        ...HELD.gates,
        failures: 0,
        queueOldestMs: 1400,
        queueOldestHold: 1000,
        queueSustainMinutes: 2,
        queueDepthMax: 900,
      },
    })
    const el = await render('/admin/upgrades/R2')
    expect(el.querySelector('[data-hold-cause="queue"]')!.textContent).toContain('Presence queue')
    expect(el.textContent).toContain('presence queue oldest 1.4 s for 2 min')
    expect(el.querySelector('[data-gate="queueOldestMs"]')!.textContent).toContain('holds over 1 s for 2 min')
    expect(el.textContent).not.toContain('Held for failures')
  })

  it('a finished run offers no actions', async () => {
    run.mockResolvedValue(DONE)
    const el = await render('/admin/upgrades/R1')
    expect(el.querySelector('[data-rollout-actions]')).toBeNull()
  })

  it("the start form shows the controller's defaults, each editable", async () => {
    defaults.mockResolvedValue({ ...FALLBACK, soakMinutes: 7 })
    const el = await render('/admin/upgrades/new')
    const field = (name: string) => el.querySelector(`[data-field="${name}"]`) as HTMLInputElement
    expect(field('ladder').value).toBe('1, 10, 50, 100')
    expect(field('soak').value).toBe('7') // the server's, not the form's own
    expect(field('firstSoak').value).toBe('10')
    expect(field('rateFloor').value).toBe('2')
    expect(field('rateCeiling').value).toBe('15')
    expect(field('failureThreshold').value).toBe('0')
    expect(field('failureThreshold').disabled).toBe(false)
  })

  it('offers the published versions, newest first, marked; picking one fills its manifest, read-only until Edit', async () => {
    packages.mockResolvedValue([
      {
        version: '1.1.0.3',
        manifest: 'https://d/device/1.1.0.3/manifest.json',
        publishedAt: '2026-10-31T01:16:41Z',
        platforms: ['mac'],
      },
      {
        version: '1.1.0.2',
        manifest: 'https://d/device/1.1.0.2/manifest.json',
        publishedAt: '2026-10-30T21:57:55Z',
        platforms: [],
      },
      {
        version: '1.1.0.1',
        manifest: 'https://d/device/1.1.0.1/manifest.json',
        publishedAt: '2026-10-30T19:44:51Z',
        platforms: [],
      },
    ])
    const el = await render('/admin/upgrades/new')
    const version = el.querySelector('[data-field="version"]') as HTMLInputElement
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(version, '1.1.0.3')
      version.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const manifest = el.querySelector('[data-field="manifest"]') as HTMLInputElement
    expect(manifest.value).toBe('https://d/device/1.1.0.3/manifest.json')
    expect(manifest.readOnly).toBe(true)
    await click(el, 'Edit')
    expect((el.querySelector('[data-field="manifest"]') as HTMLInputElement).readOnly).toBe(false)
  })

  it('picking a version older than the devices run warns, and a rollback says so plainly', async () => {
    packages.mockResolvedValue([
      {
        version: '1.1.0.2',
        manifest: 'https://d/device/1.1.0.2/manifest.json',
        publishedAt: '2026-10-30T21:57:55Z',
        platforms: [],
      },
      {
        version: '1.1.0.0',
        manifest: 'https://d/device/1.1.0.0/manifest.json',
        publishedAt: '2026-10-29T21:57:55Z',
        platforms: [],
      },
    ])
    const el = await render('/admin/upgrades/new')
    const version = el.querySelector('[data-field="version"]') as HTMLInputElement
    const choose = (value: string) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(version, value)
        version.dispatchEvent(new Event('input', { bubbles: true }))
      })
    await choose('1.1.0.2')
    expect(el.querySelector('[data-older-warning]')).toBeNull()
    await choose('1.1.0.0') // older than the channel's candidate 1.1.0.2
    expect(el.querySelector('[data-older-warning]')!.textContent).toContain('check Rollback to go back')
    await act(async () => (el.querySelector('input[type="checkbox"]') as HTMLInputElement).click())
    expect(el.querySelector('[data-older-warning]')).toBeNull()
    await click(el, 'Start rollout')
    expect(el.querySelector('[data-rollback-confirm]')!.textContent).toBe('Rollback to 1.1.0.0 from 1.1.0.2.')
    await act(async () => (el.querySelector('[data-confirm] button') as HTMLButtonElement).click())
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ candidateVersion: '1.1.0.0', rollback: true }))
  })

  it("the server's refusal of a start is shown", async () => {
    packages.mockResolvedValue([
      {
        version: '1.1.0.0',
        manifest: 'https://d/device/1.1.0.0/manifest.json',
        publishedAt: '2026-10-29T21:57:55Z',
        platforms: [],
      },
    ])
    mutate.mockResolvedValueOnce({ ok: false, reason: 'Older than the running 1.1.0.2: only a rollback goes back' })
    const el = await render('/admin/upgrades/new')
    const version = el.querySelector('[data-field="version"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(version, '1.1.0.0')
      version.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(el, 'Start rollout')
    await act(async () => (el.querySelector('[data-confirm] button') as HTMLButtonElement).click())
    expect(el.textContent).toContain('only a rollback goes back')
  })

  it('a superseded rollback run links to the run that took its place, and its promote shows in the log', async () => {
    run.mockResolvedValue({
      ...DONE,
      state: 'superseded',
      reason: 'superseded by 9f00aa11-2222-3333-4444-555566667777',
      rollback: true,
      events: [{ at: '2026-10-30T20:00:00Z', kind: 'promoted', message: '1.1.0.1 promoted to current' }],
    })
    const el = await render('/admin/upgrades/R1')
    const link = el.querySelector('[data-superseded] a') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/admin/upgrades/9f00aa11-2222-3333-4444-555566667777')
    expect(el.querySelector('[data-rollback-chip]')).not.toBeNull()
    expect(el.querySelector('[data-event="promoted"]')!.textContent).toContain('promoted to current')
    expect(el.querySelector('[data-rollout-actions]')).toBeNull() // not active
  })

  it("held devices: their own segment, and what holds them beside the unmanaged, blocked by the device's admin", async () => {
    // As graphql serves them: a held count and heldReasons, apart from the failures and the unmanaged.
    channels.mockResolvedValue([
      {
        ...STABLE,
        rollout: {
          ...STABLE.rollout,
          onWanted: 57,
          held: 3,
          heldReasons: [{ reason: "held by the device's admin: held on the device (apt-mark hold)", devices: 3 }],
        },
      },
    ])
    const el = await render('/admin/upgrades')
    const channel = el.querySelector('[data-channel="stable"]')!
    const bar = channel.querySelector('[data-bucket-bar]')!
    expect([...bar.querySelectorAll('[data-segment]')].map(s => s.getAttribute('data-segment'))).toContain('held')
    expect(bar.textContent).toContain('Held 3')
    const line = channel.querySelector('[data-managed-line]')!
    // Held count as managed: 80 managed, of them 3 held.
    expect(line.textContent).toContain('80 managed · 20 unmanaged · 3 held')
    await act(async () => (line.querySelector('[data-held-toggle]') as HTMLElement).click())
    expect(line.textContent).toContain("Blocked — held by the device's admin: held on the device (apt-mark hold)")
    expect(line.querySelector('[data-held]')).not.toBeNull()
    expect(channel.querySelector('[data-channel-failures]')!.textContent).not.toContain('held')
  })

  it('no held count where the API does not count them', async () => {
    const el = await render('/admin/upgrades')
    expect(el.querySelector('[data-held-toggle]')).toBeNull()
    expect(el.querySelector('[data-managed-line]')!.textContent).not.toContain('held')
  })

  it("an unmanaged reason names what upgrades it by the name people see", async () => {
    channels.mockResolvedValue([
      { ...STABLE, rollout: { ...STABLE.rollout, unmanagedReasons: [{ reason: 'updated by image', devices: 20 }] } },
    ])
    const el = await render('/admin/upgrades')
    const line = el.querySelector('[data-channel="stable"] [data-managed-line]')!
    await act(async () => (line.querySelector('[data-unmanaged-toggle]') as HTMLElement).click())
    expect(line.textContent).toContain('20 updated by container image')
  })

  it('no Online · 7 days · 30 days · All until graphql counts the offline by age: every offline device counted', async () => {
    const el = await render('/admin/upgrades?seen=online')
    expect(el.querySelector('[data-upgrades-seen] [data-seen-toggle]')).toBeNull()
    const line = el.querySelector('[data-channel="stable"] [data-managed-line]')!
    expect(line.textContent).toContain('80 managed')
    expect(line.querySelector('[data-hidden-offline]')).toBeNull()
    expect(el.querySelector('[data-channel="stable"] [data-bucket-bar]')!.textContent).toContain('Offline 7')
  })

  describe('with the offline by age', () => {
    // stable's 7 offline: 2 under a day, 1 for 1–7 days, 1 for 7–30 days, 3 over 30 days.
    const bands = { offlineUnder1d: 2, offline1to7d: 1, offline7to30d: 1, offlineOver30d: 3 }
    beforeEach(() => {
      channels.mockResolvedValue([{ ...STABLE, rollout: { ...STABLE.rollout, ...bands } }])
      run.mockResolvedValue({ ...HELD, rollout: { ...HELD.rollout, ...bands } })
    })
    const pressed = (el: HTMLElement) =>
      el.querySelector('[data-upgrades-seen] [aria-pressed="true"]')?.getAttribute('data-show')

    it('30 days by default: the older offline left out of the bar and the managed count, and said so', async () => {
      const el = await render('/admin/upgrades')
      expect(pressed(el)).toBe('30')
      const channel = el.querySelector('[data-channel="stable"]')!
      const line = channel.querySelector('[data-managed-line]')!
      expect(line.textContent).toContain('77 managed')
      expect(line.querySelector('[data-hidden-offline]')!.textContent).toContain('3 offline over 30 days not shown')
      const bar = channel.querySelector('[data-bucket-bar]')!
      expect(bar.textContent).toContain('Offline 4')
      expect(bar.querySelector('[data-bar-heading]')!.textContent).toContain('77 devices')
    })

    it('each choice in the URL: 7 days, Online with no offline segment, All with every one', async () => {
      const el = await render('/admin/upgrades')
      const choose = (key: string) =>
        act(async () => (el.querySelector(`[data-upgrades-seen] [data-show="${key}"]`) as HTMLElement).click())
      const channel = () => el.querySelector('[data-channel="stable"]')!
      await choose('7')
      expect(seenAt.search).toBe('?seen=7')
      expect(channel().querySelector('[data-bucket-bar]')!.textContent).toContain('Offline 3')
      expect(channel().querySelector('[data-hidden-offline]')!.textContent).toContain('4 offline over 7 days not shown')
      await choose('online')
      expect(seenAt.search).toBe('?seen=online')
      expect(channel().querySelector('[data-segment="offline"]')).toBeNull()
      expect(channel().querySelector('[data-bucket-bar]')!.textContent).not.toContain('Offline')
      expect(channel().querySelector('[data-hidden-offline]')!.textContent).toContain('7 offline not shown')
      await choose('all')
      expect(seenAt.search).toBe('?seen=all')
      expect(channel().querySelector('[data-managed-line]')!.textContent).toContain('80 managed')
      expect(channel().querySelector('[data-hidden-offline]')).toBeNull()
      await choose('30')
      expect(seenAt.search).toBe('') // the default left out
    })

    it("a run's detail reads the same choice, carried from the channels to it", async () => {
      const el = await render('/admin/upgrades?seen=7')
      await act(async () => (el.querySelector('[data-rollout="R2"]') as HTMLElement).click())
      await act(async () => {})
      expect(seenAt.pathname).toBe('/admin/upgrades/R2')
      expect(seenAt.search).toBe('?seen=7')
      const detail = el.querySelectorAll('[data-managed-line]')
      expect(detail[detail.length - 1].querySelector('[data-hidden-offline]')!.textContent).toContain(
        'offline over 7 days not shown'
      )
    })
  })

  it('ahead devices have their own segment and legend entry where the API counts them', async () => {
    channels.mockResolvedValue([
      {
        ...STABLE,
        rollout: { ...STABLE.rollout, onWanted: 50, ahead: 10, candidate: { ...STABLE.rollout.candidate, ahead: 0 } },
      },
    ])
    runs.mockResolvedValue([{ ...HELD, rollback: true }])
    const el = await render('/admin/upgrades')
    const bar = el.querySelector('[data-channel="stable"] [data-bucket-bar]')!
    expect([...bar.querySelectorAll('[data-segment]')].map(s => s.getAttribute('data-segment'))).toContain('ahead')
    expect(bar.textContent).toContain('Ahead 10')
    expect(el.querySelector('[data-rollout="R2"] [data-rollback-chip]')).not.toBeNull()
  })

  it('says what new installs download on the stable card, and changes it only to builds no older than current', async () => {
    install.mockResolvedValue({
      version: '1.1.0.3',
      followsCurrent: false,
      manifest: 'https://d/device/1.1.0.3/manifest.json',
      updatedAt: '2026-10-31T15:00:00Z',
      updatedBy: 'evan@remote.it',
      enabled: true,
      target: '1.1.0.3',
      error: null,
      events: [{ at: '2026-10-31T15:00:01Z', kind: 'applied', message: '1.1.0.3 at the top of the downloads' }],
    })
    packages.mockResolvedValue([
      { version: '1.1.0.3', manifest: 'https://d/3', publishedAt: '2026-10-31T01:00:00Z', platforms: [] },
      { version: '1.1.0.1', manifest: 'https://d/1', publishedAt: '2026-10-30T01:00:00Z', platforms: [] },
      { version: '1.1.0.0', manifest: 'https://d/0', publishedAt: '2026-10-29T01:00:00Z', platforms: [] },
    ])
    const el = await render('/admin/upgrades')
    const line = el.querySelector('[data-channel="stable"] [data-install-line]')!
    expect(line.textContent).toContain('New installs: 1.1.0.3 (ahead of current)')
    expect(line.textContent).toContain('by evan@remote.it')
    expect(line.querySelector('[data-install-pending]')).toBeNull()
    await act(async () => (line.querySelector('[data-install-history]') as HTMLElement).click())
    expect(line.querySelector('[data-install-events]')!.textContent).toContain(
      'applied 1.1.0.3 at the top of the downloads'
    )
    await act(async () => (line.querySelector('[data-install-change]') as HTMLElement).click())
    await act(async () => {})
    // The choices: Follow current, and published builds no older than current (1.1.0.1); 1.1.0.0 is not offered.
    const select = el.querySelector('[data-field="install-version"]') as HTMLInputElement
    expect(select.value).toBe('1.1.0.3')
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(select, '1.1.0.0')
      select.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(select.value).toBe('1.1.0.3') // the select takes only an offered version: 1.1.0.0 is not one
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(select, '__follow__')
      select.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(el, 'Continue')
    expect(el.querySelector('[data-install-confirm]')!.textContent).toBe(
      'New installs everywhere will get 1.1.0.1 immediately — there is no gradual rollout for installs.'
    )
    await act(async () => (el.querySelector('[data-confirm] button') as HTMLButtonElement).click())
    expect(setInstall).toHaveBeenCalledWith(null)
  })

  it('no install line where the API does not say', async () => {
    const el = await render('/admin/upgrades')
    expect(el.querySelector('[data-install-line]')).toBeNull()
  })

  it("counts taken before the channel's step say so, dimmed, and the old group is not headlined as the new percent's", async () => {
    channels.mockResolvedValue([
      {
        ...STABLE,
        percent: 50,
        updated: '2026-10-31T10:56:55Z',
        rollout: { ...STABLE.rollout, checked: '2026-10-31T10:56:50Z' },
      },
    ])
    const el = await render('/admin/upgrades')
    const card = el.querySelector('[data-channel="stable"]')!
    expect(card.querySelector('[data-counts-before]')!.textContent).toBe('Counts from before the 50% step — updating…')
    expect(card.querySelector('[data-counts-dimmed]')).not.toBeNull()
    const headings = [...card.querySelectorAll('[data-bar-heading]')].map(h => h.textContent)
    expect(headings[1]).toContain('as counted before the 50% step')
    expect(headings[1]).not.toContain('the 50% selected')
  })

  it('warns when counts stop refreshing while the channel moves, and not when it is still', async () => {
    // STABLE's delivery is under way, its counts from 2026-10-30.
    let el = await render('/admin/upgrades')
    expect(el.querySelector('[data-channel="stable"] [data-counts-stalled]')!.textContent).toContain(
      'Counts haven’t refreshed since'
    )
    expect(el.querySelector('[data-channel="stable"] [data-counts-before]')).toBeNull()
    document.body.innerHTML = ''
    channels.mockResolvedValue([{ ...STABLE, delivery: { ...STABLE.delivery, state: 'done' } }])
    runs.mockResolvedValue([DONE])
    el = await render('/admin/upgrades')
    expect(el.querySelector('[data-counts-stalled]')).toBeNull()
  })

  it('refresh recounts where graphql offers it: Recounting… until a walk newer than the click lands', async () => {
    const old = { ...STABLE, rollout: { ...STABLE.rollout, checked: '2026-10-30T00:00:00Z' } }
    channels.mockResolvedValue([old])
    refresh.mockResolvedValue(true)
    const el = await render('/admin/upgrades')
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      await click(el, 'Refresh: recount the channels')
      expect(refresh).toHaveBeenCalledWith('stable')
      expect(el.querySelector('[data-recounting]')!.textContent).toBe('Recounting…')
      channels.mockResolvedValue([{ ...STABLE, rollout: { ...STABLE.rollout, checked: new Date().toISOString() } }])
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3100)
      })
      expect(el.querySelector('[data-recounting]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a recount that has not landed in two minutes says it is still under way', async () => {
    channels.mockResolvedValue([{ ...STABLE, rollout: { ...STABLE.rollout, checked: '2026-10-30T00:00:00Z' } }])
    refresh.mockResolvedValue(true)
    const el = await render('/admin/upgrades')
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      await click(el, 'Refresh: recount the channels')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2 * 60 * 1000 + 3500)
      })
      expect(el.querySelector('[data-recounting-slow]')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('without the recount, refresh re-reads', async () => {
    const el = await render('/admin/upgrades')
    const before = channels.mock.calls.length
    await click(el, 'Refresh: recount the channels')
    expect(channels.mock.calls.length).toBe(before + 1)
    expect(el.querySelector('[data-recounting]')).toBeNull()
  })
})
