import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* What a device runs (graphql-api docs/PROXY-GROUPS.md §13): at most one proxy and one exit, its state in each — in
   service, draining or retired, and joining while it waits to go into service, with its checks. The actions on a device
   act on every proxy and exit it runs, and say first what each affects (Device.actionEffects); those on one proxy or exit
   are its own (drainExitDevice…). Each answers what the device runs after, for the caller to say what it still runs. A
   refusal comes back in graphql's words. Device-session API only: an API without it answers UNSUPPORTED. */

export type RunState = 'ACTIVE' | 'DRAINING' | 'RETIRED'

// One of the checks a device waiting to go into service must pass: certificate, health, policy or nat.
export type RunCheck = { name: string; passed: boolean; reason: string }

type Run = {
  id: string // the device
  name: string | null
  state: RunState
  joining: boolean // added, waiting to go into service: by itself once its checks pass, or by an admin
  activeSince: string | null
  drainingSince: string | null
  checks: RunCheck[]
}

export type ProxyOpenConnections = {
  https: number
  tcp: number
  udp: number
  exit: number
  total: number
  reported: string | null
}

// While draining or retired: whether its instance can be stopped with nothing dropped, and why.
export type ProxyDrain = { safeToStop: boolean; reason: string; dnsClearAt: string | null; deadline: string | null }

export type ProxyDevice = Run & {
  host: string | null // one of remote.it's devices' own name; none on an own proxy's device
  drainMaxWaitMinutes: number | null
  health: { state: string; since: string | null; reason: string | null } | null // none for an own proxy's
  certificate: 'own' | 'ready' | 'pending'
  openConnections: ProxyOpenConnections | null // none from a daemon that does not say them
  drain: ProxyDrain | null // none while in service
  proxy?: { id: string; name: string; host: string; remoteit: boolean }
}

export type ExitDevice = Run & {
  established: boolean // in service and taking flows for 10 minutes without a break: new picks prefer it
  offering: boolean // its exit node on and its machine's policy allowing exits
  refusal: string | null // why it takes no exit flows now, by its machine
  health: string | null // presence's verdict, for a device running one of remote.it's proxies
  exit?: { id: string; name: string; remoteit: boolean }
}

export type DeviceRuns = { proxy: ProxyDevice | null; exit: ExitDevice | null }

export type DeviceAction = 'DRAIN' | 'UNDRAIN' | 'RETIRE' | 'REMOVE' | 'DELETE' | 'DECOMMISSION'

// What an action on a device does to one proxy or exit it runs, said before it is done.
export type DeviceActionEffect = {
  kind: 'proxy' | 'exit'
  id: string
  name: string
  state: RunState
  after: string // active, draining or retired; gone for one it leaves
  sessions: number | null // the connections open through it, by its daemon's word: none from one that does not say
  ends: boolean // whether the action ends them (a drain keeps them)
  endpoints: number // a proxy's: kept on the proxy, served by its devices still serving
  users: number // an exit's: the devices using it
  moved: number // of its users, those whose new connections go through this device now
  inService: number // the other devices left in service in it
  dormant: boolean // an own exit left with no device in service
  refusal: string | null
}

const RUN_FIELDS = 'id name state joining activeSince drainingSince checks { name passed reason }'
export const PROXY_DEVICE_FIELDS = `${RUN_FIELDS} host drainMaxWaitMinutes health { state since reason } certificate
  openConnections { https tcp udp exit total reported } drain { safeToStop reason dnsClearAt deadline }`
export const EXIT_DEVICE_FIELDS = `${RUN_FIELDS} established offering refusal health`
export const RUNS_FIELDS = `proxy { ${PROXY_DEVICE_FIELDS} proxy { id name host remoteit } }
  exit { ${EXIT_DEVICE_FIELDS} exit { id name remoteit } }`
const EFFECT_FIELDS = 'kind id name state after sessions ends endpoints users moved inService dormant refusal'

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

// What a device runs, for whoever manages it; none for one who does not.
export const graphQLDeviceRuns = (deviceId: string) =>
  read<DeviceRuns | null>(
    `query DeviceRuns($id: [String!]!) { login { device(id: $id) { id runs { ${RUNS_FIELDS} } } } }`,
    { id: [deviceId] },
    'runs',
    data => data?.login?.device?.[0]?.runs ?? null
  )

// What an action on a device would do to each proxy and exit it runs; none for one it runs nothing of.
export const graphQLActionEffects = (deviceId: string, action: DeviceAction, force = false) =>
  read<DeviceActionEffect[]>(
    `query DeviceActionEffects($id: [String!]!, $action: DeviceAction!, $force: Boolean) {
      login { device(id: $id) { id actionEffects(action: $action, force: $force) { ${EFFECT_FIELDS} } } }
    }`,
    { id: [deviceId], action, force },
    'actionEffects',
    data => data?.login?.device?.[0]?.actionEffects ?? []
  )

// A change to what a device runs: what it runs after, or graphql's refusal in its words ('' where it said none).
export type RunsChange = { runs: DeviceRuns } | { reason: string }

async function change(field: string, mutation: string, variables: ILookup<any>): Promise<RunsChange> {
  const result = await graphQLRequestWithReason(mutation, variables)
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return { reason: result.reason }
  return { runs: result.data?.data?.[field] ?? { proxy: null, exit: null } }
}

// drain, undrain, retire and remove: on every proxy and exit a device runs, or on one of them alone.
export type RunAction = 'DRAIN' | 'UNDRAIN' | 'RETIRE' | 'REMOVE'
export type RunActionOptions = { maxWaitMinutes?: number; force?: boolean }

// The mutation for an action: on the device as a whole, or on its proxy or its exit.
const MUTATIONS: Record<'device' | 'proxy' | 'exit', Record<RunAction, string>> = {
  device: {
    DRAIN: 'drainDevice',
    UNDRAIN: 'undrainDevice',
    RETIRE: 'retireDevice',
    REMOVE: 'removeDeviceRuns',
  },
  proxy: {
    DRAIN: 'drainProxyDevice',
    UNDRAIN: 'undrainProxyDevice',
    RETIRE: 'retireProxyDevice',
    REMOVE: 'removeProxyDevice',
  },
  exit: {
    DRAIN: 'drainExitDevice',
    UNDRAIN: 'undrainExitDevice',
    RETIRE: 'retireExitDevice',
    REMOVE: 'removeExitDevice',
  },
}

// An action on every proxy and exit a device runs (refused whole where refused for any), or on one of them alone.
export function graphQLRunAction(
  scope: 'device' | 'proxy' | 'exit',
  deviceId: string,
  action: RunAction,
  { maxWaitMinutes, force }: RunActionOptions = {}
): Promise<RunsChange> {
  const field = MUTATIONS[scope][action]
  if (action === 'DRAIN')
    return change(
      field,
      ` mutation ${field}($deviceId: String!, $maxWaitMinutes: Int) {
        ${field}(deviceId: $deviceId, maxWaitMinutes: $maxWaitMinutes) { ${RUNS_FIELDS} }
      }`,
      { deviceId, maxWaitMinutes }
    )
  if (action === 'RETIRE')
    return change(
      field,
      ` mutation ${field}($deviceId: String!, $force: Boolean) {
        ${field}(deviceId: $deviceId, force: $force) { ${RUNS_FIELDS} }
      }`,
      { deviceId, force: !!force }
    )
  return change(
    field,
    ` mutation ${field}($deviceId: String!) { ${field}(deviceId: $deviceId) { ${RUNS_FIELDS} } }`,
    { deviceId }
  )
}

// A device added to a proxy: it joins out of service and goes into service as the proxy's activation says. One of
// remote.it's devices takes e<number>-r3 as its own name, the next free one when none is given.
export const graphQLAddProxyDevice = (proxy: string, deviceId: string, number?: number) =>
  change(
    'addProxyDevice',
    ` mutation AddProxyDevice($proxy: String!, $deviceId: String!, $number: Int) {
      addProxyDevice(proxy: $proxy, deviceId: $deviceId, number: $number) { ${RUNS_FIELDS} }
    }`,
    { proxy, deviceId, number }
  )

// A device added to an exit: it joins out of service and goes into service as the exit's activation says.
export const graphQLAddExitDevice = (exit: string, deviceId: string) =>
  change(
    'addExitDevice',
    ` mutation AddExitDevice($exit: String!, $deviceId: String!) {
      addExitDevice(exit: $exit, deviceId: $deviceId) { ${RUNS_FIELDS} }
    }`,
    { exit, deviceId }
  )
