import { describe, it, expect } from 'vitest'
import {
  bucketSegments,
  managed,
  currentStep,
  deliveryProgress,
  failureRows,
  gateReadings,
  heldForFailures,
  holdCause,
  parseLadder,
  retryingDevices,
  transientDetail,
  shortDuration,
  stepLabel,
  stepTimes,
  unreviewedCount,
} from './rolloutHelpers'

// solo's stable channel, 2026-10-30.
const STABLE = {
  wanted: 61787,
  onWanted: 13307,
  pending: 0,
  upgrading: 0,
  failed: 0,
  stuck: 0,
  unmanaged: 48471,
  offline: 9,
}

describe('the bucket bar', () => {
  it('segments are the managed devices, adding up to wanted less the unmanaged', () => {
    const segments = bucketSegments(STABLE)
    expect(managed(STABLE)).toBe(13316)
    expect(segments.reduce((sum, s) => sum + s.count, 0)).toBe(STABLE.wanted - STABLE.unmanaged)
    expect(segments.reduce((sum, s) => sum + s.fraction, 0)).toBeCloseTo(1)
    expect(segments.map(s => s.key)).toEqual(['onWanted', 'pending', 'upgrading', 'stuck', 'failed', 'offline'])
    expect(segments[0].fraction).toBeGreaterThan(0.99) // 13,307 of 13,316, not a sliver of 61,787
  })

  it('an empty channel has no shares', () => {
    expect(
      bucketSegments({ ...STABLE, wanted: 0, onWanted: 0, unmanaged: 0, offline: 0 }).every(s => !s.fraction)
    ).toBe(true)
  })
})

describe('delivery progress', () => {
  const delivery = { state: 'delivering', total: 1000, delivered: 250, remaining: 750, perSecond: 15 } as any
  it('is delivered of total, with the rest at its pace', () => {
    expect(deliveryProgress(delivery)).toEqual({ done: false, fraction: 0.25, etaMs: 50000 })
  })
  it('a finished one with nothing to deliver is whole, no ETA', () => {
    expect(deliveryProgress({ ...delivery, state: 'done', total: 0, delivered: 0, remaining: 0 })).toEqual({
      done: true,
      fraction: 1,
      etaMs: undefined,
    })
  })
})

describe('the ladder', () => {
  it('names the step the run is on', () => {
    expect(currentStep({ ladder: [1, 5, 25, 100], percent: 25 })).toEqual({ index: 3, of: 4, percent: 25 })
    expect(stepLabel({ ladder: [1, 5, 25, 100], percent: 25 })).toBe('25% (3 of 4)')
    expect(stepLabel({ ladder: null, percent: null, steps: [] })).toBe('—')
  })

  it("the form's ladder rises within 1 to 100", () => {
    expect(parseLadder('1, 5 25,100')).toEqual([1, 5, 25, 100])
    expect(parseLadder('5, 1')).toBeUndefined()
    expect(parseLadder('0, 50')).toBeUndefined()
    expect(parseLadder('1, 101')).toBeUndefined()
    expect(parseLadder('1.5')).toBeUndefined()
  })
})

describe('step phases', () => {
  const step = { percent: 5, startedAt: '2026-10-30T10:00:00Z', deliveredAt: '2026-10-30T10:02:00Z' }
  const now = Date.parse('2026-10-30T10:05:00Z')
  it("the current step's phase under way counts to now", () => {
    expect(stepTimes(step, true, now)).toEqual({ deliver: 120000, converge: 180000, soak: undefined })
  })
  it("a past step's unfinished phase has no time", () => {
    expect(stepTimes(step, false, now)).toEqual({ deliver: 120000, converge: undefined, soak: undefined })
  })
  it('durations read short', () => {
    expect(shortDuration(125000)).toBe('2m 05s')
    expect(shortDuration(3 * 3600000 + 60000)).toBe('3h 01m')
    expect(shortDuration(undefined)).toBe('—')
  })
})

describe('gates', () => {
  const at = (readings: ReturnType<typeof gateReadings>, id: string) => readings.find(r => r.id === id)!

  it("each reading against the API's own thresholds, the defaults where it gives none", () => {
    const readings = gateReadings(
      { presenceCpuMax: 72, presenceCpuAvg: 40, presenceMemoryMax: 85, failures: 2, refused: 0 },
      0
    )
    expect(at(readings, 'presenceCpuMax')).toMatchObject({
      level: 'warn', // past the line that lowers the rate, short of the hold
      threshold: 'rate lowered at 70%, holds at 85% for 2 min',
    })
    expect(at(readings, 'presenceCpuAvg').level).toBe('info')
    expect(at(readings, 'presenceMemoryMax')).toMatchObject({ level: 'hold', threshold: 'holds at 80%' })
    expect(at(readings, 'failures')).toMatchObject({ level: 'hold', threshold: 'holds above 0' })
    expect(at(readings, 'refused').level).toBe('ok')
    expect(at(readings, 'dropped').level).toBe('unknown')

    const own = gateReadings({ presenceCpuMax: 72, cpuHold: 75, cpuAbort: 90, memoryAbort: 95, presenceMemoryMax: 85 })
    expect(at(own, 'presenceCpuMax')).toMatchObject({
      level: 'ok',
      threshold: 'rate lowered at 75%, holds at 90% for 2 min',
    })
    expect(at(own, 'presenceMemoryMax')).toMatchObject({ level: 'ok', threshold: 'holds at 95%' })
  })

  it('no failures at threshold 0 is ok; failures within a higher threshold are too', () => {
    expect(at(gateReadings({ failures: 0 }, 0), 'failures').level).toBe('ok')
    expect(at(gateReadings({ failures: 3 }, 3), 'failures').level).toBe('ok')
    expect(at(gateReadings({ failures: 4 }, 3), 'failures').level).toBe('hold')
  })

  it("presence's queue against its 1 s / 2 min hold; depth, lag, tasks, stale and the CPU source as info", () => {
    const readings = gateReadings({
      queueOldestMs: 1400,
      queueOldestHold: 1000,
      queueSustainMinutes: 2,
      queueDepthMax: 812,
      eventLoopLagMs: 35,
      tasks: 6,
      stale: 1,
      cpuSource: 'presence',
    })
    expect(at(readings, 'queueOldestMs')).toMatchObject({ level: 'hold', threshold: 'holds over 1 s for 2 min' })
    expect(at(gateReadings({ queueOldestMs: 300 }), 'queueOldestMs').level).toBe('ok')
    for (const id of ['queueDepthMax', 'eventLoopLagMs', 'tasks', 'stale', 'cpuSource'])
      expect(at(readings, id).level).toBe('info')
    expect(at(readings, 'cpuSource').value).toBe('presence')
    expect(at(gateReadings({ stale: true }), 'stale').value).toBe('yes')
  })
})

describe('hold causes', () => {
  it('read for a person, queue and delivery among them, only while holding', () => {
    expect(holdCause({ state: 'holding', holdCause: 'queue' })?.label).toBe('Presence queue')
    expect(holdCause({ state: 'holding', holdCause: 'delivery' })?.help).toContain('Resume applies the step again')
    expect(holdCause({ state: 'holding', holdCause: 'something new' })?.label).toBe('something new')
    expect(holdCause({ state: 'running', holdCause: 'queue' })).toBeUndefined()
  })

  it("a failures hold is graphql's holdCause where it gives one, not the reason's words", () => {
    expect(
      heldForFailures({ state: 'holding', holdCause: 'queue', reason: 'failed to drain', gates: { failures: 2 } })
    ).toBe(false)
    expect(heldForFailures({ state: 'holding', holdCause: 'failures', reason: '', gates: {} })).toBe(true)
  })
})

describe('failures', () => {
  const failures = [
    { reason: 'download: 404', devices: 3 },
    { reason: 'install: disk full', devices: 1 },
  ]
  it('splits what an earlier resume reviewed from what is new, new first', () => {
    expect(
      failureRows(failures, [
        { reason: 'install: disk full', devices: 1 },
        { reason: 'gone', devices: 2 },
      ])
    ).toEqual([
      { reason: 'download: 404', devices: 3, reviewed: 0, unreviewed: 3, deviceIds: [], failedDevices: [] },
      { reason: 'gone', devices: 2, reviewed: 2, unreviewed: 0, deviceIds: [], failedDevices: [] },
      { reason: 'install: disk full', devices: 1, reviewed: 1, unreviewed: 0, deviceIds: [], failedDevices: [] },
    ])
  })

  it('keeps transient devices still retrying apart from the real failures', () => {
    const mixed = [
      {
        reason: 'download: 404',
        devices: 2,
        deviceIds: ['A', 'B'],
        failedDevices: [
          { deviceId: 'A', transient: false, retrying: false, attempts: 1 },
          { deviceId: 'B', transient: true, retrying: true, attempts: 2, retryAt: '2026-10-30T20:05:00Z' },
        ],
      },
      {
        reason: 'failed (transient, retrying): download timed out',
        devices: 2,
        failedDevices: [
          { deviceId: 'C', transient: true, retrying: true, attempts: 3, retryAt: '2026-10-30T20:02:00Z' },
          { deviceId: 'D', transient: true, retrying: true, attempts: 1, retryAt: null },
        ],
      },
    ]
    const rows = failureRows(mixed)
    expect(rows.map(r => r.reason)).toEqual(['download: 404'])
    expect(rows[0].deviceIds).toEqual(['A'])
    const { devices, total } = retryingDevices(mixed)
    expect(total).toBe(3)
    expect(devices.map(d => [d.deviceId, d.attempts])).toEqual([
      ['C', 3],
      ['B', 2],
      ['D', 1],
    ]) // soonest retry first, none last
    expect(transientDetail(devices[0].reason)).toBe('download timed out')
  })

  it('a transient reason without devices still counts as retrying', () => {
    expect(retryingDevices([{ reason: 'failed (transient, retrying): x', devices: 4 }])).toEqual({
      devices: [],
      total: 4,
    })
  })

  it("a resume acknowledges the gate's count, else the unreviewed", () => {
    expect(unreviewedCount({ gates: { failures: 4 } })).toBe(4)
    expect(
      unreviewedCount({
        rollout: { candidate: { failures } } as any,
        reviewedFailures: [{ reason: 'download: 404', devices: 1 }],
      })
    ).toBe(3)
  })

  it('a hold is for failures when its reason says so or they pass the threshold', () => {
    expect(heldForFailures({ state: 'holding', reason: '2 devices failed', gates: {} })).toBe(true)
    expect(heldForFailures({ state: 'holding', reason: 'presence cpu 74%', gates: { failures: 1 } })).toBe(true)
    expect(heldForFailures({ state: 'holding', reason: 'presence cpu 74%', gates: { failures: 0 } })).toBe(false)
    expect(heldForFailures({ state: 'running', reason: 'failed', gates: { failures: 3 } })).toBe(false)
  })
})
