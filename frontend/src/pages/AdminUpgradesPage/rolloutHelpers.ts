import type {
  DaemonBuckets,
  DaemonFailure,
  DaemonDelivery,
  RolloutGates,
  RolloutRun,
  RolloutStep,
} from '../../services/graphQLDaemonRollout'

export const UPGRADES_ROUTE = '/admin/upgrades'
export const NEW_ROLLOUT = 'new'

// While a run is live the page reads again this often; the buckets themselves are recounted about every 66 s.
export const POLL_MS = 20 * 1000

// presence's gates as the controller applies them: CPU holds a run at 70% and aborts it at 85%, memory holds at 80%.
export const CPU_HOLD = 70
export const CPU_ABORT = 85
export const MEMORY_HOLD = 80

export const ACTIVE_STATES = ['running', 'soaking', 'holding']
export const active = (run?: Pick<RolloutRun, 'state'> | null) => !!run && ACTIVE_STATES.includes(run.state)

export type BucketKey = 'onWanted' | 'pending' | 'upgrading' | 'stuck' | 'failed' | 'offline' | 'unmanaged'

// The bar's segments, in order: what is on the wanted release, then on its way, then what needs a look, then what
// cannot be reached or does not take updates. graphql's buckets partition `wanted`, so they add up to it.
export const BUCKETS: { key: BucketKey; label: string; color: string; help: string }[] = [
  { key: 'onWanted', label: 'On wanted', color: 'success.main', help: 'Runs the release it should' },
  { key: 'pending', label: 'Pending', color: 'primaryLight.main', help: 'Told, has not started' },
  { key: 'upgrading', label: 'Upgrading', color: 'primary.main', help: 'Downloading or installing' },
  { key: 'stuck', label: 'Stuck', color: 'warning.main', help: 'Online and not converging' },
  { key: 'failed', label: 'Failed', color: 'danger.main', help: 'Its upgrade failed' },
  { key: 'offline', label: 'Offline', color: 'gray.main', help: 'Not reachable now' },
  { key: 'unmanaged', label: 'Unmanaged', color: 'grayLight.main', help: 'Does not take updates' },
]

export const bucketSegments = (buckets?: DaemonBuckets | null) => {
  const total = buckets?.wanted || 0
  return BUCKETS.map(bucket => {
    const count = buckets?.[bucket.key] || 0
    return { ...bucket, count, fraction: total ? count / total : 0 }
  })
}

// Devices told of the release that have yet to take it: the rollout's work in flight.
export const inFlight = (buckets?: DaemonBuckets | null) =>
  (buckets?.pending || 0) + (buckets?.upgrading || 0) + (buckets?.stuck || 0)

export const percentOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0)

const ms = (iso?: string | null) => {
  const time = iso ? Date.parse(iso) : NaN
  return isNaN(time) ? undefined : time
}

export const between = (from?: string | null, to?: string | null, now = Date.now()) => {
  const start = ms(from)
  if (start === undefined) return undefined
  const end = to ? ms(to) : now
  return end === undefined ? undefined : Math.max(0, end - start)
}

// 3h 12m, 4m 05s, 12s — short enough for a column.
export const shortDuration = (millis?: number) => {
  if (millis === undefined) return '—'
  const seconds = Math.round(millis / 1000)
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export const dateTime = (iso?: string | null) => {
  const time = ms(iso)
  return time === undefined
    ? '—'
    : new Date(time).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
}

// Where the delivery stands: how much of it is done, and when the rest will be at its pace.
export const deliveryProgress = (delivery?: DaemonDelivery | null) => {
  if (!delivery) return undefined
  const done = delivery.state === 'done'
  const fraction = delivery.total ? delivery.delivered / delivery.total : done ? 1 : 0
  const etaMs =
    !done && delivery.remaining && delivery.perSecond > 0 ? (delivery.remaining / delivery.perSecond) * 1000 : undefined
  return { done, fraction, etaMs }
}

// The ladder's step the run is on: its index (1-based) of the ladder's length, from its percent or else its steps.
export const currentStep = (run: Pick<RolloutRun, 'ladder' | 'percent' | 'steps'>) => {
  const ladder = run.ladder || []
  const at = run.percent != null ? ladder.indexOf(run.percent) : -1
  const index = at >= 0 ? at + 1 : run.steps?.length || 0
  return { index, of: ladder.length, percent: run.percent ?? run.steps?.[run.steps.length - 1]?.percent }
}

export const stepLabel = (run: Pick<RolloutRun, 'ladder' | 'percent' | 'steps'>) => {
  const { index, of, percent } = currentStep(run)
  if (percent == null) return '—'
  return of ? `${percent}% (${index} of ${of})` : `${percent}%`
}

// A step's phases: delivering (telling its devices), converging (until they run it), soaking (held clean). A phase
// under way on the run's current step counts to now; one a past step never finished (skipped, aborted) has no time.
const phase = (from: string | null | undefined, to: string | null | undefined, current: boolean, now: number) =>
  !from ? undefined : to ? between(from, to) : current ? between(from, null, now) : undefined

export const stepTimes = (step: RolloutStep, current = false, now = Date.now()) => ({
  deliver: phase(step.startedAt, step.deliveredAt, current, now),
  converge: phase(step.deliveredAt, step.convergedAt, current, now),
  soak: phase(step.convergedAt, step.soakedAt, current, now),
})

export const failureCount = (run: Pick<RolloutRun, 'gates' | 'rollout' | 'steps'>) =>
  run.gates?.failures ??
  run.rollout?.candidate?.failed ??
  run.steps?.reduce((sum, step) => sum + (step.failed || 0), 0) ??
  undefined

export const startedByLabel = (by: RolloutRun['startedBy']) => (typeof by === 'string' ? by : by?.email) || '—'

export type GateLevel = 'ok' | 'hold' | 'abort' | 'unknown'

export type GateReading = {
  id: keyof RolloutGates | 'failuresTotal'
  label: string
  value?: number | null
  unit?: string
  threshold: string
  level: GateLevel
}

const level = (value: number | null | undefined, hold?: number, abort?: number): GateLevel => {
  if (value == null) return 'unknown'
  if (abort !== undefined && value >= abort) return 'abort'
  if (hold !== undefined && value >= hold) return 'hold'
  return 'ok'
}

// Each gate reading beside what it is held to. refused and dropped hold at any; failures at the run's threshold.
export const gateReadings = (gates?: RolloutGates | null, failureThreshold?: number | null): GateReading[] => [
  {
    id: 'presenceCpuMax',
    label: 'Presence CPU (max)',
    value: gates?.presenceCpuMax,
    unit: '%',
    threshold: `hold ${CPU_HOLD}%, abort ${CPU_ABORT}%`,
    level: level(gates?.presenceCpuMax, CPU_HOLD, CPU_ABORT),
  },
  {
    id: 'presenceCpuAvg',
    label: 'Presence CPU (avg)',
    value: gates?.presenceCpuAvg,
    unit: '%',
    threshold: `hold ${CPU_HOLD}%, abort ${CPU_ABORT}%`,
    level: level(gates?.presenceCpuAvg, CPU_HOLD, CPU_ABORT),
  },
  {
    id: 'presenceMemoryMax',
    label: 'Presence memory (max)',
    value: gates?.presenceMemoryMax,
    unit: '%',
    threshold: `hold ${MEMORY_HOLD}%`,
    level: level(gates?.presenceMemoryMax, MEMORY_HOLD),
  },
  {
    id: 'refused',
    label: 'Refused',
    value: gates?.refused,
    threshold: 'hold above 0',
    level: level(gates?.refused, 1),
  },
  {
    id: 'dropped',
    label: 'Dropped',
    value: gates?.dropped,
    threshold: 'hold above 0',
    level: level(gates?.dropped, 1),
  },
  {
    id: 'failures',
    label: 'Failures',
    value: gates?.failures,
    threshold: failureThreshold != null ? `abort at ${failureThreshold}` : 'run threshold',
    level:
      failureThreshold != null
        ? level(gates?.failures, undefined, failureThreshold)
        : gates?.failures == null
        ? 'unknown'
        : 'ok',
  },
  {
    id: 'excludedFailures',
    label: 'Excluded failures',
    value: gates?.excludedFailures,
    threshold: 'not counted',
    level: gates?.excludedFailures == null ? 'unknown' : 'ok',
  },
  {
    id: 'stuck',
    label: 'Stuck',
    value: gates?.stuck,
    threshold: 'holds the step',
    level: level(gates?.stuck, 1),
  },
]

// The form's ladder: "1, 5, 25, 100" → [1, 5, 25, 100]; undefined unless it climbs strictly within 1–100.
export const parseLadder = (text: string): number[] | undefined => {
  const parts = text
    .split(/[\s,]+/)
    .map(part => part.trim())
    .filter(Boolean)
  if (!parts.length) return undefined
  const ladder = parts.map(Number)
  if (ladder.some(n => !Number.isInteger(n) || n < 1 || n > 100)) return undefined
  if (ladder.some((n, i) => i && n <= ladder[i - 1])) return undefined
  return ladder
}

// A hold the failures caused: the controller pauses a run on any failure it counts (the threshold defaults to 0).
export const heldForFailures = (run: Pick<RolloutRun, 'state' | 'reason' | 'gates' | 'failureThreshold'>) =>
  run.state === 'holding' &&
  (/fail/i.test(run.reason || '') || (run.gates?.failures ?? 0) > (run.failureThreshold ?? 0))

// The failures by reason, each split into what is new and what an earlier resume already reviewed.
export const failureRows = (failures?: DaemonFailure[] | null, reviewed?: DaemonFailure[] | null) => {
  const before = new Map((reviewed || []).map(r => [r.reason, r.devices]))
  const reviewedIds = new Map((reviewed || []).map(r => [r.reason, r.deviceIds || []]))
  const rows = (failures || []).map(f => {
    const old = Math.min(f.devices, before.get(f.reason) || 0)
    before.delete(f.reason)
    return {
      reason: f.reason,
      devices: f.devices,
      reviewed: old,
      unreviewed: f.devices - old,
      deviceIds: f.deviceIds || [],
    }
  })
  // A reviewed reason no longer failing still shows, as reviewed.
  for (const [reason, devices] of before)
    rows.push({ reason, devices, reviewed: devices, unreviewed: 0, deviceIds: reviewedIds.get(reason) || [] })
  return rows.sort((a, b) => b.unreviewed - a.unreviewed || b.devices - a.devices)
}

// What a resume acknowledges: the failures counted against the run now.
export const unreviewedCount = (run: Pick<RolloutRun, 'gates' | 'rollout' | 'reviewedFailures'>) =>
  run.gates?.failures ??
  failureRows(run.rollout?.candidate?.failures, run.reviewedFailures).reduce((sum, row) => sum + row.unreviewed, 0)
