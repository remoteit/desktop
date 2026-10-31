import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The admin Upgrades page: each channel's buckets and delivery, the runs newest first with the live one marked, and a
// run's detail — a hold for failures puts them first, with what an earlier resume reviewed, and Resume says how many
// it will mark reviewed; Abort asks a reason, then confirms.
const { channels, runs, run, mutate, served } = vi.hoisted(() => ({
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
    current: { wanted: 90, onWanted: 55, pending: 4, upgrading: 4, failed: 0, stuck: 0, unmanaged: 20, offline: 7 },
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
})

describe('AdminUpgradesPage', () => {
  it("shows each channel's buckets, adding up to wanted, and its delivery", async () => {
    const el = await render('/admin/upgrades')
    const channel = el.querySelector('[data-channel="stable"]')!
    expect(channel.textContent).toContain('candidate 1.1.0.2 at 10%')
    const bar = channel.querySelector('[data-bucket-bar]')!
    const segments = [...bar.querySelectorAll('[data-segment]')].map(s => s.getAttribute('data-segment'))
    expect(segments).toEqual(['onWanted', 'pending', 'upgrading', 'stuck', 'failed', 'offline', 'unmanaged'])
    expect(channel.querySelector('[data-delivery]')!.textContent).toContain('40 of 100 delivered')
    expect(channel.querySelector('[data-delivery]')!.textContent).toContain('ETA 4s')
    expect(channel.textContent).toContain('no package')
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

  it('the start form holds on any failure unless changed', async () => {
    const el = await render('/admin/upgrades/new')
    const threshold = el.querySelector('[data-failure-threshold]') as HTMLInputElement
    expect(threshold.value).toBe('0')
    expect(threshold.disabled).toBe(false)
  })
})
