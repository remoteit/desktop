import { describe, it, expect } from 'vitest'
import {
  bucketSegments,
  currentStep,
  deliveryProgress,
  failureRows,
  gateReadings,
  heldForFailures,
  parseLadder,
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
  it('segments add up to wanted', () => {
    const segments = bucketSegments(STABLE)
    expect(segments.reduce((sum, s) => sum + s.count, 0)).toBe(STABLE.wanted)
    expect(segments.reduce((sum, s) => sum + s.fraction, 0)).toBeCloseTo(1)
    expect(segments.map(s => s.key)).toEqual([
      'onWanted',
      'pending',
      'upgrading',
      'stuck',
      'failed',
      'offline',
      'unmanaged',
    ])
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
  it('each reading against its threshold', () => {
    const readings = gateReadings(
      { presenceCpuMax: 72, presenceCpuAvg: 40, presenceMemoryMax: 85, failures: 2, refused: 0 },
      0
    )
    const at = (id: string) => readings.find(r => r.id === id)!
    expect(at('presenceCpuMax').level).toBe('hold')
    expect(at('presenceCpuAvg').level).toBe('ok')
    expect(at('presenceMemoryMax').level).toBe('hold')
    expect(at('failures')).toMatchObject({ level: 'abort', threshold: 'abort at 0' })
    expect(at('refused').level).toBe('ok')
    expect(at('dropped').level).toBe('unknown')
    expect(gateReadings({ presenceCpuMax: 90 })[0].level).toBe('abort')
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
      { reason: 'download: 404', devices: 3, reviewed: 0, unreviewed: 3, deviceIds: [] },
      { reason: 'gone', devices: 2, reviewed: 2, unreviewed: 0, deviceIds: [] },
      { reason: 'install: disk full', devices: 1, reviewed: 1, unreviewed: 0, deviceIds: [] },
    ])
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
