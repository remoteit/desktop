import type {
  DaemonBuckets,
  DaemonFailure,
  FailedDevice,
  DaemonDelivery,
  RolloutGates,
  RolloutRun,
  RolloutStep,
} from '../../services/graphQLDaemonRollout'

export const UPGRADES_ROUTE = '/admin/upgrades'
export const NEW_ROLLOUT = 'new'

// While a run is live the page reads again this often; the buckets themselves are recounted about every 66 s.
export const POLL_MS = 20 * 1000

// presence's gates, where the API does not say them (it does, on gates): the rate is lowered at 70% CPU, the run held at
// 85% sustained 2 minutes or 80% memory, or while presence's oldest queued message waits over 1 s for 2 minutes.
export const CPU_HOLD = 70
export const CPU_ABORT = 85
export const CPU_SUSTAIN_MINUTES = 2
export const MEMORY_ABORT = 80
export const QUEUE_OLDEST_HOLD = 1000
export const QUEUE_SUSTAIN_MINUTES = 2

// A transient failure the device is still retrying reads so; graphql leaves it out of the failures it counts.
export const TRANSIENT_REASON = 'failed (transient, retrying)'
export const transientReason = (reason: string) => reason.startsWith(TRANSIENT_REASON)

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
export const currentStep = (run: Pick<RolloutRun, 'ladder' | 'percent' | 'steps' | 'stepIndex'>) => {
  const ladder = run.ladder || []
  const at = run.stepIndex != null ? run.stepIndex : run.percent != null ? ladder.indexOf(run.percent) : -1
  const index = at >= 0 ? at + 1 : run.steps?.length || 0
  return { index, of: ladder.length, percent: run.percent ?? run.steps?.[run.steps.length - 1]?.percent }
}

export const stepLabel = (run: Pick<RolloutRun, 'ladder' | 'percent' | 'steps' | 'stepIndex'>) => {
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

// ok; warn: past a line that slows the run, or worth a look; hold: past a line that holds it; info: read, not gated.
export type GateLevel = 'ok' | 'warn' | 'hold' | 'info' | 'unknown'

export type GateReading = {
  id: string
  label: string
  value?: number | string | null
  unit?: string
  threshold: string
  level: GateLevel
}

const level = (value: number | null | undefined, warn?: number, hold?: number): GateLevel => {
  if (value == null) return 'unknown'
  if (hold !== undefined && value >= hold) return 'hold'
  if (warn !== undefined && value >= warn) return 'warn'
  return 'ok'
}

const info = (value: unknown): GateLevel => (value == null ? 'unknown' : 'info')

export const gateLimits = (gates?: RolloutGates | null) => ({
  cpuHold: gates?.cpuHold ?? CPU_HOLD,
  cpuAbort: gates?.cpuAbort ?? CPU_ABORT,
  memoryAbort: gates?.memoryAbort ?? MEMORY_ABORT,
  queueOldestHold: gates?.queueOldestHold ?? QUEUE_OLDEST_HOLD,
  queueSustainMinutes: gates?.queueSustainMinutes ?? QUEUE_SUSTAIN_MINUTES,
})

const msLabel = (ms: number) => (ms >= 1000 && ms % 1000 === 0 ? `${ms / 1000} s` : `${ms} ms`)

// Each gate reading beside the line it is read against — the API's own thresholds where it gives them. A failure holds
// the run past the run's threshold (0: any); refused or dropped past 0; the queue and CPU when sustained.
export const gateReadings = (gates?: RolloutGates | null, failureThreshold?: number | null): GateReading[] => {
  const limits = gateLimits(gates)
  const threshold = failureThreshold ?? 0
  const stale = typeof gates?.stale === 'boolean' ? (gates.stale ? 'yes' : 'no') : gates?.stale
  return [
    {
      id: 'presenceCpuMax',
      label: 'Presence CPU (busiest task)',
      value: gates?.presenceCpuMax,
      unit: '%',
      threshold: `rate lowered at ${limits.cpuHold}%, holds at ${limits.cpuAbort}% for ${CPU_SUSTAIN_MINUTES} min`,
      level: level(gates?.presenceCpuMax, limits.cpuHold, limits.cpuAbort),
    },
    {
      id: 'presenceCpuAvg',
      label: 'Presence CPU (average)',
      value: gates?.presenceCpuAvg,
      unit: '%',
      threshold: 'info — the gate reads the busiest task',
      level: info(gates?.presenceCpuAvg),
    },
    {
      id: 'cpuSource',
      label: 'CPU source',
      value: gates?.cpuSource,
      threshold: 'info',
      level: info(gates?.cpuSource),
    },
    {
      id: 'presenceMemoryMax',
      label: 'Presence memory (busiest task)',
      value: gates?.presenceMemoryMax,
      unit: '%',
      threshold: `holds at ${limits.memoryAbort}%`,
      level: level(gates?.presenceMemoryMax, undefined, limits.memoryAbort),
    },
    {
      id: 'queueOldestMs',
      label: 'Queue oldest',
      value: gates?.queueOldestMs,
      unit: ' ms',
      threshold: `holds over ${msLabel(limits.queueOldestHold)} for ${limits.queueSustainMinutes} min`,
      level: level(gates?.queueOldestMs, undefined, limits.queueOldestHold),
    },
    {
      id: 'queueDepthMax',
      label: 'Queue depth (max)',
      value: gates?.queueDepthMax,
      threshold: 'info',
      level: info(gates?.queueDepthMax),
    },
    {
      id: 'eventLoopLagMs',
      label: 'Event-loop lag',
      value: gates?.eventLoopLagMs,
      unit: ' ms',
      threshold: 'info',
      level: info(gates?.eventLoopLagMs),
    },
    {
      id: 'tasks',
      label: 'Presence tasks',
      value: gates?.tasks,
      threshold: 'info',
      level: info(gates?.tasks),
    },
    {
      id: 'stale',
      label: 'Stale readings',
      value: stale,
      threshold: 'info',
      level: info(stale),
    },
    {
      id: 'refused',
      label: 'Refused',
      value: gates?.refused,
      threshold: 'holds above 0',
      level: level(gates?.refused, undefined, 1),
    },
    {
      id: 'dropped',
      label: 'Dropped',
      value: gates?.dropped,
      threshold: 'holds above 0',
      level: level(gates?.dropped, undefined, 1),
    },
    {
      id: 'failures',
      label: 'Failures (unreviewed)',
      value: gates?.failures,
      threshold: `holds above ${threshold}`,
      level: level(gates?.failures, undefined, threshold + 1),
    },
    {
      id: 'reviewedFailures',
      label: 'Failures reviewed',
      value: gates?.reviewedFailures,
      threshold: 'acknowledged on resume, not counted',
      level: info(gates?.reviewedFailures),
    },
    {
      id: 'transientFailures',
      label: 'Transient, retrying',
      value: gates?.transientFailures,
      threshold: 'not counted while retrying',
      level: info(gates?.transientFailures),
    },
    {
      id: 'excludedFailures',
      label: 'Excluded failures',
      value: gates?.excludedFailures,
      threshold: "the run's excluded reasons, not counted",
      level: info(gates?.excludedFailures),
    },
    {
      id: 'stuck',
      label: 'Stuck',
      value: gates?.stuck,
      threshold: 'holds the step',
      level: level(gates?.stuck, 1),
    },
  ]
}

// Why a run holds, for a person: graphql's holdCause.
export const HOLD_CAUSES: Record<string, { label: string; help: string }> = {
  failures: { label: 'Failures', help: 'Devices failed the upgrade. Review them, then Resume to acknowledge.' },
  cpu: {
    label: 'Presence CPU',
    help: "presence's busiest task stayed over the CPU line, or its load could not be read.",
  },
  memory: { label: 'Presence memory', help: "presence's busiest task passed the memory line." },
  queue: {
    label: 'Presence queue',
    help: "presence's oldest queued message waited past the line for the sustain time: presence is falling behind.",
  },
  refused: { label: 'Refused or dropped', help: 'presence refused logins or dropped packets.' },
  stuck: { label: 'Stuck devices', help: 'Online devices are not converging on the candidate.' },
  delivery: {
    label: 'Delivery',
    help: "The step's delivery was abandoned, or the channel was changed outside the rollout. Resume applies the step again.",
  },
  manual: { label: 'Paused', help: 'Paused by a person.' },
}

export const holdCause = (run: Pick<RolloutRun, 'state' | 'holdCause'>) =>
  run.state === 'holding' && run.holdCause
    ? HOLD_CAUSES[run.holdCause] || { label: run.holdCause, help: '' }
    : undefined

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
// graphql's holdCause where it gives one; else read from the reason and the count, as before it did.
export const heldForFailures = (
  run: Pick<RolloutRun, 'state' | 'reason' | 'gates' | 'failureThreshold' | 'holdCause'>
) =>
  run.state === 'holding' &&
  (run.holdCause !== undefined
    ? run.holdCause === 'failures'
    : /fail/i.test(run.reason || '') || (run.gates?.failures ?? 0) > (run.failureThreshold ?? 0))

const retrying = (device: FailedDevice) => !!device.transient && !!device.retrying

// The real failures by reason, each split into what is new and what an earlier resume already reviewed; transient ones
// the devices are still retrying are left to retryingDevices.
export const failureRows = (failures?: DaemonFailure[] | null, reviewed?: DaemonFailure[] | null) => {
  const before = new Map((reviewed || []).map(r => [r.reason, r.devices]))
  const reviewedIds = new Map((reviewed || []).map(r => [r.reason, r.deviceIds || []]))
  const rows = (failures || [])
    .filter(f => !transientReason(f.reason))
    .map(f => {
      const real = (f.failedDevices || []).filter(device => !retrying(device))
      const old = Math.min(f.devices, before.get(f.reason) || 0)
      before.delete(f.reason)
      return {
        reason: f.reason,
        devices: f.devices,
        reviewed: old,
        unreviewed: f.devices - old,
        deviceIds: f.failedDevices ? real.map(device => device.deviceId) : f.deviceIds || [],
        failedDevices: real,
      }
    })
  // A reviewed reason no longer failing still shows, as reviewed.
  for (const [reason, devices] of before)
    rows.push({
      reason,
      devices,
      reviewed: devices,
      unreviewed: 0,
      deviceIds: reviewedIds.get(reason) || [],
      failedDevices: [],
    })
  return rows.sort((a, b) => b.unreviewed - a.unreviewed || b.devices - a.devices)
}

// The devices whose failure is transient and still retrying, soonest retry first, each with its reason: not counted
// against the run unless they give up. Those of a transient reason that name no devices count in `devices` alone.
export const retryingDevices = (failures?: DaemonFailure[] | null) => {
  const devices: (FailedDevice & { reason: string })[] = []
  let total = 0
  for (const failure of failures || []) {
    if (transientReason(failure.reason)) total += failure.devices
    for (const device of failure.failedDevices || [])
      if (retrying(device)) devices.push({ ...device, reason: failure.reason })
  }
  total = Math.max(total, devices.length)
  devices.sort((a, b) => (Date.parse(a.retryAt || '') || Infinity) - (Date.parse(b.retryAt || '') || Infinity))
  return { devices, total }
}

// "failed (transient, retrying): download timed out" → "download timed out"
export const transientDetail = (reason: string) =>
  transientReason(reason) ? reason.slice(TRANSIENT_REASON.length).replace(/^[:\s]+/, '') || reason : reason

// What a resume acknowledges: the failures counted against the run now.
export const unreviewedCount = (run: Pick<RolloutRun, 'gates' | 'rollout' | 'reviewedFailures'>) =>
  run.gates?.failures ??
  failureRows(run.rollout?.candidate?.failures, run.reviewedFailures).reduce((sum, row) => sum + row.unreviewed, 0)
