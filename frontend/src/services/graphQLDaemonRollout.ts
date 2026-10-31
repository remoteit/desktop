import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* Device package upgrades, as an admin watches them (graphql's daemon-release resolver and its rollout controller):
   each release channel's buckets and delivery (daemonChannels), and the rollout runs that step a candidate up a ladder
   of percentages, soaking at each and holding or aborting on presence's gates.

   The portal is released apart from graphql, and the controller arrives after the channels, so which of it this API
   serves is read from its schema once (as deviceDisable and jobRunOptions read theirs): a query names only fields the
   API has, and a mutation's variables take the types the API declares. An API without the channels answers
   UNSUPPORTED; one with the channels but no controller has no runs (`runs: false`). */

// deviceIds: not in the contract — the failing devices themselves, where the API names them (a sample, at most).
export type DaemonFailure = {
  reason: string
  devices: number
  deviceIds?: string[] | null
  failedDevices?: FailedDevice[] | null
}

// One failing device of a reason: transient and retrying ones are not counted against the run until they give up.
export type FailedDevice = {
  deviceId: string
  transient?: boolean | null
  retrying?: boolean | null
  attempts?: number | null
  retryAt?: string | null
}

export type DaemonBuckets = {
  wanted: number
  onWanted: number
  pending: number
  upgrading: number
  failed: number
  stuck: number
  unmanaged: number
  offline: number
  failures?: DaemonFailure[]
  unmanagedReasons?: DaemonFailure[]
}

export type DaemonChannelRollout = DaemonBuckets & {
  devices: number
  checked: string
  stuckMinutes: number
  candidate: DaemonBuckets
  current: DaemonBuckets
  pinned: DaemonBuckets
}

export type DaemonDelivery = {
  change: number
  version: string | null
  state: string // planning | delivering | stalled | done | …
  total: number
  delivered: number
  pacedDelivered: number
  unpacedDelivered: number
  skippedUnmanaged: number
  failed: number
  unchanged: number
  remaining: number
  walked: number
  perSecond: number
  startedAt: string
  finishedAt: string | null
  retryAt: string | null
  error: string | null
}

export type DaemonChannel = {
  channel: string
  percent: number
  updated: string | null
  accounts: string[]
  devices: string[]
  current: { version: string; manifest: string; rollback: boolean } | null
  candidate: { version: string; manifest: string; rollback: boolean } | null
  rollout: DaemonChannelRollout | null
  delivery: DaemonDelivery | null
}

export type RolloutState = 'running' | 'soaking' | 'holding' | 'aborted' | 'done' | 'cancelled'

export type RolloutStep = {
  percent: number
  startedAt?: string | null
  deliveredAt?: string | null
  convergedAt?: string | null
  soakedAt?: string | null
  paced?: number | null
  unpaced?: number | null
  skippedUnmanaged?: number | null
  failed?: number | null
  peakCpu?: number | null
  rate?: number | null
  change?: number | null
  skipped?: boolean | null
}

export type RolloutEvent = { at: string; kind: string; message?: string | null }

export type RolloutGates = {
  at?: string | null
  presenceCpuMax?: number | null
  presenceCpuAvg?: number | null
  presenceMemoryMax?: number | null
  refused?: number | null
  dropped?: number | null
  failures?: number | null // real failures not yet reviewed: what the gate counts
  reviewedFailures?: number | null // acknowledged on a resume, still failing
  excludedFailures?: number | null // left out by the run's excluded reasons
  transientFailures?: number | null // the device says transient, and is still retrying
  stuck?: number | null
  // The thresholds the controller reads against, percent: the rate is lowered at cpuHold, the run held at cpuAbort
  // (sustained) and at memoryAbort.
  cpuHold?: number | null
  cpuAbort?: number | null
  memoryAbort?: number | null
  cpuSource?: string | null // where the CPU reading came from
  queueDepthMax?: number | null
  queueOldestMs?: number | null
  queueOldestHold?: number | null // ms: the run holds while the oldest waits longer…
  queueSustainMinutes?: number | null // …for this long
  eventLoopLagMs?: number | null
  tasks?: number | null
  stale?: number | boolean | null
}

export type HoldCause = 'failures' | 'cpu' | 'memory' | 'refused' | 'stuck' | 'delivery' | 'queue' | 'manual'

export type RolloutRun = {
  id: string
  channel: string
  mode?: 'auto' | 'manual' | string | null
  version?: string | null
  fromVersion?: string | null
  state: RolloutState | string
  reason?: string | null
  holdCause?: HoldCause | string | null // why it holds, while holding
  percent?: number | null
  stepIndex?: number | null // 0-based, into the ladder
  soakUntil?: string | null
  ladder?: number[] | null
  rate?: number | null
  rateFloor?: number | null
  rateCeiling?: number | null
  startedAt?: string | null
  endedAt?: string | null
  startedBy?: string | { email?: string | null } | null
  promoteWhenDone?: boolean | null
  // Not in the contract, read where the API has them: what the run was started with.
  manifest?: string | null
  candidateManifest?: string | null
  soakMinutes?: number | null
  firstSoakMinutes?: number | null
  failureThreshold?: number | null
  // Not in the contract either: the failures an operator already acknowledged by resuming, which no longer count
  // against the threshold (gates.excludedFailures is their total).
  reviewedFailures?: DaemonFailure[] | null
  steps?: RolloutStep[] | null
  events?: RolloutEvent[] | null
  rollout?: DaemonChannelRollout | null
  delivery?: DaemonDelivery | null
  gates?: RolloutGates | null
}

// A device package published to the stage's downloads, its manifest and signature both there (graphql daemonPackages).
export type DaemonPackage = { version: string; manifest: string; publishedAt: string; platforms: string[] }

// What startDaemonRollout takes for each setting not given (graphql daemonRolloutDefaults).
export type RolloutDefaults = {
  ladder: number[]
  soakMinutes: number
  firstSoakMinutes: number
  rateFloor: number
  rateCeiling: number
  failureThreshold: number
}

// The controller's defaults as of graphql f75dc73d, for an API that does not say them.
export const FALLBACK_DEFAULTS: RolloutDefaults = {
  ladder: [1, 10, 50, 100],
  soakMinutes: 5,
  firstSoakMinutes: 10,
  rateFloor: 2,
  rateCeiling: 15,
  failureThreshold: 0,
}

export type StartRollout = {
  channel: string
  candidateVersion: string
  candidateManifest: string
  ladder?: number[]
  soakMinutes?: number
  firstSoakMinutes?: number
  rateFloor?: number
  rateCeiling?: number
  failureThreshold?: number
  promoteWhenDone?: boolean
}

export type RolloutAction =
  | { name: 'pauseDaemonRollout'; id: string }
  | { name: 'resumeDaemonRollout'; id: string }
  | { name: 'abortDaemonRollout'; id: string; reason: string }
  | { name: 'skipDaemonRolloutStep'; id: string }
  | { name: 'setDaemonRolloutRate'; id: string; rate: number }

type Result<T> = T | 'ERROR' | typeof UNSUPPORTED

const BUCKETS = 'wanted onWanted pending upgrading failed stuck unmanaged offline'
const REASONS = 'failures { reason devices } unmanagedReasons { reason devices }'
const channelRollout = (reasons = REASONS) => `
  ${BUCKETS} ${reasons} devices checked stuckMinutes
  candidate { ${BUCKETS} ${reasons} }
  current { ${BUCKETS} ${reasons} }
  pinned { ${BUCKETS} }`
const CHANNEL_ROLLOUT = channelRollout()
const DELIVERY = `change version state total delivered pacedDelivered unpacedDelivered skippedUnmanaged failed unchanged
  remaining walked perSecond startedAt finishedAt retryAt error`

export const EVENT_LIMIT = 200

// What a run's query asks for, of what the API has: scalars by name, objects with their own fields.
const RUN_SCALARS = [
  'id',
  'channel',
  'mode',
  'version',
  'fromVersion',
  'state',
  'reason',
  'holdCause',
  'percent',
  'stepIndex',
  'soakUntil',
  'ladder',
  'rate',
  'rateFloor',
  'rateCeiling',
  'startedAt',
  'endedAt',
  'promoteWhenDone',
  'manifest',
  'candidateManifest',
  'soakMinutes',
  'firstSoakMinutes',
  'failureThreshold',
]
const STEP_FIELDS = [
  'percent',
  'startedAt',
  'deliveredAt',
  'convergedAt',
  'soakedAt',
  'paced',
  'unpaced',
  'skippedUnmanaged',
  'failed',
  'peakCpu',
  'rate',
  'change',
  'skipped',
]
const EVENT_FIELDS = ['at', 'kind', 'message']
const GATE_FIELDS = [
  'at',
  'presenceCpuMax',
  'presenceCpuAvg',
  'presenceMemoryMax',
  'refused',
  'dropped',
  'failures',
  'reviewedFailures',
  'excludedFailures',
  'transientFailures',
  'stuck',
  'cpuHold',
  'cpuAbort',
  'memoryAbort',
  'cpuSource',
  'queueDepthMax',
  'queueOldestMs',
  'queueOldestHold',
  'queueSustainMinutes',
  'eventLoopLagMs',
  'tasks',
  'stale',
]

export const ACTIONS = [
  'startDaemonRollout',
  'pauseDaemonRollout',
  'resumeDaemonRollout',
  'abortDaemonRollout',
  'skipDaemonRolloutStep',
  'setDaemonRolloutRate',
] as const

type TypeRef = { kind: string; name?: string | null; ofType?: TypeRef | null }
type Field = { name: string; type?: TypeRef; args?: { name: string; type: TypeRef }[] }

export type RolloutSchema = {
  runs: boolean // daemonRollouts and daemonRollout are served
  list: string // a run's selection in the list
  detail: string // and in its detail
  queries: Partial<Record<'daemonRollouts' | 'daemonRollout' | 'daemonPackages' | 'daemonRolloutDefaults', Field>>
  mutations: Partial<Record<(typeof ACTIONS)[number], Field>>
  returns: string // what a mutation that returns a run is asked for
}

const TYPE_REF = 'kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }'
const PROBE = `query DaemonRolloutFields {
  query: __type(name: "Query") { fields { name args { name type { ${TYPE_REF} } } } }
  mutation: __type(name: "Mutation") { fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } }
  run: __type(name: "DaemonRolloutRun") { fields { name args { name } type { ${TYPE_REF} } } }
  step: __type(name: "DaemonRolloutStep") { fields { name } }
  event: __type(name: "DaemonRolloutEvent") { fields { name } }
  gates: __type(name: "DaemonRolloutGates") { fields { name type { ${TYPE_REF} } } }
  failure: __type(name: "DaemonRolloutFailure") { fields { name } }
}`

const named = (type?: TypeRef | null): TypeRef | undefined => (type?.ofType ? named(type.ofType) : type || undefined)

// A type as a variable declares it: [Int!]!, String, …
export const typeString = (type: TypeRef): string => {
  if (type.kind === 'NON_NULL') return `${typeString(type.ofType as TypeRef)}!`
  if (type.kind === 'LIST') return `[${typeString(type.ofType as TypeRef)}]`
  return type.name || 'String'
}

export function parseRolloutSchema(data: any): RolloutSchema {
  const fieldsOf = (type: any): Field[] => type?.fields || []
  const names = (type: any) => new Set(fieldsOf(type).map(f => f.name))
  const queryFields = fieldsOf(data?.query)
  const queries = new Set(queryFields.map(f => f.name))
  const run = fieldsOf(data?.run)
  const runNames = new Set(run.map(f => f.name))
  const pick = (wanted: string[], served: Set<string>) => wanted.filter(name => served.has(name)).join(' ')

  const runs = queries.has('daemonRollouts') && queries.has('daemonRollout') && runNames.has('id')

  const scalars = pick(RUN_SCALARS, runNames)
  const by = run.find(f => f.name === 'startedBy')
  const startedBy = by ? (named(by.type)?.kind === 'OBJECT' ? 'startedBy { email }' : 'startedBy') : ''
  const steps = runNames.has('steps') ? `steps { ${pick(STEP_FIELDS, names(data?.step))} }` : ''
  // A gate reading is a scalar: one the API serves as an object is left out rather than asked for without its fields.
  const gateScalars = new Set(
    fieldsOf(data?.gates)
      .filter(f => !f.type || ['SCALAR', 'ENUM'].includes(named(f.type)?.kind || ''))
      .map(f => f.name)
  )
  const gates = runNames.has('gates') ? `gates { ${pick(GATE_FIELDS, gateScalars)} }` : ''
  const delivery = runNames.has('delivery') ? `delivery { ${DELIVERY} }` : ''
  const failureFields = names(data?.failure)
  const ids = failureFields.has('deviceIds')
  const failed = failureFields.has('failedDevices')
    ? ' failedDevices { deviceId transient retrying attempts retryAt }'
    : ''
  const reasons =
    ids || failed
      ? `failures { reason devices${ids ? ' deviceIds' : ''}${failed} } unmanagedReasons { reason devices }`
      : REASONS
  const rollout = runNames.has('rollout') ? `rollout { ${channelRollout(reasons)} }` : ''
  const eventsField = run.find(f => f.name === 'events')
  const events = eventsField
    ? `events${eventsField.args?.some(a => a.name === 'limit') ? `(limit: ${EVENT_LIMIT})` : ''} { ${pick(
        EVENT_FIELDS,
        names(data?.event)
      )} }`
    : ''

  const reviewed = runNames.has('reviewedFailures')
    ? `reviewedFailures { reason devices${ids ? ' deviceIds' : ''} }`
    : ''
  const list = [scalars, startedBy, steps, gates, delivery, reviewed].filter(Boolean).join('\n')
  const detail = [list, rollout, events].filter(Boolean).join('\n')

  const mutations: RolloutSchema['mutations'] = {}
  for (const field of fieldsOf(data?.mutation))
    if ((ACTIONS as readonly string[]).includes(field.name)) mutations[field.name as (typeof ACTIONS)[number]] = field

  const reads: RolloutSchema['queries'] = {}
  for (const field of queryFields)
    if (['daemonRollouts', 'daemonRollout', 'daemonPackages', 'daemonRolloutDefaults'].includes(field.name))
      reads[field.name as keyof RolloutSchema['queries']] = field

  return {
    runs,
    list,
    detail,
    queries: reads,
    mutations,
    returns: pick(['id', 'state', 'reason', 'percent', 'rate'], runNames),
  }
}

let schema: Promise<RolloutSchema | 'ERROR'> | undefined

export function rolloutSchema(): Promise<RolloutSchema | 'ERROR'> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR' || response.data?.errors) {
        schema = undefined
        return 'ERROR'
      }
      return parseRolloutSchema(response.data?.data)
    })
  return schema
}

// For tests, and for a change of API or sign-in.
export function resetRolloutSchema() {
  schema = undefined
}

async function read<T>(query: string, variables: ILookup<any>, field: string): Promise<Result<T | null>> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, field)) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.[field] ?? null
}

export const graphQLDaemonChannels = () =>
  read<DaemonChannel[]>(
    `query DaemonChannels {
      daemonChannels {
        channel percent updated accounts devices
        current { version manifest rollback }
        candidate { version manifest rollback }
        rollout { ${CHANNEL_ROLLOUT} }
        delivery { ${DELIVERY} }
      }
    }`,
    {},
    'daemonChannels'
  )

// The runs, newest first; false where the API has no rollout controller.
export async function graphQLDaemonRollouts(
  options: { channel?: string; limit?: number; active?: boolean } = {}
): Promise<Result<RolloutRun[]> | false> {
  const served = await rolloutSchema()
  if (served === 'ERROR') return 'ERROR'
  if (!served.runs) return false
  const call = buildCall('query', served.queries.daemonRollouts as Field, options, served.list)
  const runs = await read<RolloutRun[]>(call.query, call.variables, 'daemonRollouts')
  return Array.isArray(runs) ? sortRuns(runs) : runs ?? []
}

export async function graphQLDaemonRollout(id: string): Promise<Result<RolloutRun | null> | false> {
  const served = await rolloutSchema()
  if (served === 'ERROR') return 'ERROR'
  if (!served.runs) return false
  const call = buildCall('query', served.queries.daemonRollout as Field, { id }, served.detail)
  return read<RolloutRun>(call.query, call.variables, 'daemonRollout')
}

// The packages published to the stage, newest first; false where the API does not list them.
export async function graphQLDaemonPackages(limit = 30): Promise<DaemonPackage[] | 'ERROR' | false> {
  const served = await rolloutSchema()
  if (served === 'ERROR') return 'ERROR'
  if (!served.queries.daemonPackages) return false
  const call = buildCall('query', served.queries.daemonPackages, { limit }, 'version manifest publishedAt platforms')
  const packages = await read<DaemonPackage[]>(call.query, call.variables, 'daemonPackages')
  return Array.isArray(packages) ? packages : packages === null ? [] : 'ERROR'
}

// The controller's own defaults; FALLBACK_DEFAULTS where the API does not say them or the read fails.
export async function graphQLRolloutDefaults(): Promise<RolloutDefaults> {
  const served = await rolloutSchema()
  if (served === 'ERROR' || !served.queries.daemonRolloutDefaults) return FALLBACK_DEFAULTS
  const call = buildCall(
    'query',
    served.queries.daemonRolloutDefaults,
    {},
    'ladder soakMinutes firstSoakMinutes rateFloor rateCeiling failureThreshold'
  )
  const defaults = await read<RolloutDefaults>(call.query, call.variables, 'daemonRolloutDefaults')
  return defaults && typeof defaults === 'object' ? { ...FALLBACK_DEFAULTS, ...defaults } : FALLBACK_DEFAULTS
}

export const sortRuns = (runs: RolloutRun[]) =>
  [...runs].sort((a, b) => (Date.parse(b.startedAt || '') || 0) - (Date.parse(a.startedAt || '') || 0))

// A query or mutation as the API declares it: the variables given that it takes, typed as it types them.
export function buildCall(
  operation: 'query' | 'mutation',
  field: Field,
  variables: ILookup<any>,
  selection: string
): { query: string; variables: ILookup<any> } {
  const args = (field.args || []).filter(arg => variables[arg.name] !== undefined || arg.type.kind === 'NON_NULL')
  const declared = args.map(arg => `$${arg.name}: ${typeString(arg.type)}`).join(', ')
  const passed = args.map(arg => `${arg.name}: $${arg.name}`).join(', ')
  const returned = named(field.type)?.kind === 'OBJECT' || !field.type ? (selection ? ` { ${selection} }` : '') : ''
  const used: ILookup<any> = {}
  for (const arg of args) used[arg.name] = variables[arg.name]
  const title = field.name.charAt(0).toUpperCase() + field.name.slice(1)
  return {
    query: `${operation} ${title}${declared ? `(${declared})` : ''} {
      ${field.name}${passed ? `(${passed})` : ''}${returned}
    }`,
    variables: used,
  }
}

// The mutation's own refusal comes back as its reason, for the page to show.
export async function graphQLRolloutMutation(
  name: (typeof ACTIONS)[number],
  variables: ILookup<any>
): Promise<{ ok: true; data?: any } | { ok: false; reason: string }> {
  const served = await rolloutSchema()
  if (served === 'ERROR') return { ok: false, reason: 'Could not read what this API serves.' }
  const field = served.mutations[name]
  if (!field) return { ok: false, reason: `This API has no ${name}.` }
  const request = buildCall('mutation', field, variables, served.returns)
  const response = await graphQLRequestWithReason(request.query, request.variables)
  if (response === 'ERROR') return { ok: false, reason: `${name} failed.` }
  if ('reason' in response) return { ok: false, reason: response.reason || `${name} was refused.` }
  return { ok: true, data: response.data?.data?.[name] }
}

export const startDaemonRollout = (start: StartRollout) => graphQLRolloutMutation('startDaemonRollout', start)

export const rolloutAction = ({ name, ...variables }: RolloutAction) => graphQLRolloutMutation(name, variables)

export async function rolloutActionsServed(): Promise<Set<string>> {
  const served = await rolloutSchema()
  return new Set(served === 'ERROR' ? [] : Object.keys(served.mutations))
}
