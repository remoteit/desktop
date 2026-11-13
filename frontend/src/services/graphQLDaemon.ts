import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'

/* The device agent's upgrades (graphql's daemon-release resolver). These calls exist only where the API serves device
   sessions (DEVICE_SESSION_API: local, dev) — so a read is silent, and an API without them answers UNSUPPORTED for the
   caller to hide itself, rather than raising the app's error banner. */

export const UNSUPPORTED = 'UNSUPPORTED'
export const DAEMON_CHANNELS = ['stable', 'beta']

export type DaemonUpdateState =
  | 'pending'
  | 'started'
  | 'downloading'
  | 'installing'
  | 'installed'
  | 'failed'
  | 'refused'
  | 'held' // a package hold or lock its admin set (apt-mark hold, versionlock, …), or managed elsewhere: the detail says which

// How a device is brought up to date (graphql's DeviceHowToUpdate), by what upgrades it.
export type HowToUpdate =
  | 'ROLLOUT' // our rollouts: nothing to do
  | 'RELOAD' // the browser's client: loads from the portal
  | 'IMAGE'
  | 'HOME_ASSISTANT'
  | 'APP_STORE'
  | 'PACKAGE_MANAGER'
  | 'CLI'
  | 'DESKTOP'
  | 'POLICY' // updates turned off on the device

// What a device says of who upgrades it, where the API serves it.
export type Upkeep = {
  updatedBy?: string | null // what upgrades it (remoteit, image, home-assistant, app-store, policy, …)
  howToUpdate?: HowToUpdate | null
  available?: string | null // its channel's current, when newer than what it runs
  package?: { version: string; format?: string | null } | null
  update?: { state: string; detail?: string | null } | null
}

export type DeviceDaemon = Upkeep & {
  deviceId: string
  running: string | null // what the device reports it runs; none when no device-session daemon reports
  package?: { version: string; format?: string | null } | null // the package it came in: what releases name
  target: { version: string; rollback: boolean } | null // what it should run; none leaves it on what it runs
  update: { version: string; state: DaemonUpdateState; detail?: string | null } | null
  channel: string
  hold: boolean
  pinned?: { version: string } | null // rolled back: pinned to this release until released
  rollbackTo?: { version: string } | null // where a rollback would take it
  updateState?: string | null // held where graphql finds a hold, from an older daemon's refusal too; where it serves it
  // Who shipped it: 'none' for a daemon with no package — the browser's client, a phone's app; where the API serves it.
  distribution?: string | null
}

// A release held because the device takes no updates at all (connectd's updater): managed elsewhere, not a pin.
const TAKES_NO_UPDATES = /^(this device does not take updates|this install cannot upgrade itself)/
const takesNoUpdates = (update?: { state: string; detail?: string | null } | null) =>
  update?.state === 'held' && TAKES_NO_UPDATES.test(update.detail ?? '')

// Held by the device's admin: a package hold or lock (managed, but blocked), as the device reports it or graphql reads it.
export const held = (
  daemon?: { update?: { state: string; detail?: string | null } | null; updateState?: string | null } | null
) => !takesNoUpdates(daemon?.update) && (daemon?.update?.state === 'held' || daemon?.updateState === 'held')

// An API before howToUpdate: by updatedBy, and a browser client by its format.
const HOW_BY_UPDATED_BY: ILookup<HowToUpdate> = {
  image: 'IMAGE',
  'home-assistant': 'HOME_ASSISTANT',
  'app-store': 'APP_STORE',
  'package-manager': 'PACKAGE_MANAGER',
  cli: 'CLI',
  desktop: 'DESKTOP',
  policy: 'POLICY',
}

// How a device that something other than our rollouts upgrades is updated — its image, Home Assistant, its store, the
// portal that loads it, … — or null for one our rollouts upgrade, or when that is not known. A refusal is then not a
// failure: it is said who upgrades it, never in red.
export function managedElsewhere(device?: Upkeep | null): HowToUpdate | null {
  if (!device) return null
  if (device.howToUpdate) return device.howToUpdate === 'ROLLOUT' ? null : device.howToUpdate
  if (device.package?.format === 'web') return 'RELOAD'
  return HOW_BY_UPDATED_BY[device.updatedBy ?? ''] ?? (takesNoUpdates(device.update) ? 'POLICY' : null)
}

export type DaemonSettings = { autoUpdate: boolean; channel: string }

// The version a device runs, as releases name it: its package's ("1.1.0.20261022…"), which a target is compared with —
// else, for a daemon from before packages were versioned on their own, the daemon's.
export const runningVersion = (daemon?: { running?: string | null; package?: { version: string } | null } | null) =>
  daemon?.package?.version || daemonVersion(daemon)

// The daemon's own version, without its name ("connectd-go 5.6.1.20261001" → "5.6.1.20261001").
export const daemonVersion = (daemon?: { running?: string | null } | null) =>
  daemon?.running?.replace(/^connectd-go\s+/, '') || null

// An upgrade under way: worth watching until it settles.
export const updating = (daemon?: { update?: { state: string } | null } | null) =>
  !!daemon?.update && ['pending', 'started', 'downloading', 'installing'].includes(daemon.update.state)

// Whether the API lacks the device-session API as a whole: it refuses a marker field that only that API has. Any other
// refused field is this build and the API disagreeing — an error to report, not a feature to hide.
export const withoutDeviceSessions = (errors: { message?: string }[] | undefined, marker: string) =>
  !!errors?.some(error => (error.message || '').startsWith(`Cannot query field "${marker}"`))

async function read<T>(
  query: string,
  variables: ILookup<any>,
  field: string
): Promise<T | null | 'ERROR' | typeof UNSUPPORTED> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, field)) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.[field] ?? null
}

// updateState and distribution only where the API has them: one without answers without them, and is not asked again.
let withUpdateState = true
let withDistribution = true
let withUpkeep = true

export async function graphQLDeviceDaemon(deviceId: string): Promise<DeviceDaemon | null | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query DeviceDaemon($deviceId: String!) {
      deviceDaemon(deviceId: $deviceId) {
        deviceId
        running
        package { version format }
        target { version rollback }
        update { version state detail }
        channel
        hold
        pinned { version }
        rollbackTo { version }${withUpdateState ? '\n        updateState' : ''}${withDistribution ? '\n        distribution' : ''}${
    withUpkeep ? '\n        updatedBy\n        howToUpdate\n        available' : ''
  }
      }
    }`
  const variables = { deviceId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = response.data?.errors
  if (withUpdateState && withoutDeviceSessions(errors, 'updateState')) {
    withUpdateState = false
    return graphQLDeviceDaemon(deviceId)
  }
  if (withDistribution && withoutDeviceSessions(errors, 'distribution')) {
    withDistribution = false
    return graphQLDeviceDaemon(deviceId)
  }
  if (withUpkeep && withoutDeviceSessions(errors, 'howToUpdate')) {
    withUpkeep = false
    return graphQLDeviceDaemon(deviceId)
  }
  const reported = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(reported, 'deviceDaemon')) return UNSUPPORTED
  if (reported) return 'ERROR'
  return response.data?.data?.deviceDaemon ?? null
}

// For tests, and for a change of API.
export const resetDeviceDaemonFields = () => {
  withUpdateState = true
  withDistribution = true
  withUpkeep = true
}

export const graphQLDaemonSettings = (accountId?: string) =>
  read<DaemonSettings>(
    `query DaemonSettings($accountId: String) {
      daemonSettings(accountId: $accountId) { autoUpdate channel }
    }`,
    { accountId },
    'daemonSettings'
  )

// A channel of the device's own, '' to follow its account's; held at what it runs; or rolled back to the release before
// the one its channel gives it (false releases it).
export const graphQLSetDeviceDaemon = (
  deviceId: string,
  set: { channel?: string; hold?: boolean; rollback?: boolean }
) =>
  graphQLBasicRequest(
    `mutation SetDeviceDaemon($deviceId: String!, $channel: String, $hold: Boolean, $rollback: Boolean) {
      setDeviceDaemon(deviceId: $deviceId, channel: $channel, hold: $hold, rollback: $rollback)
    }`,
    { deviceId, ...set }
  )

export const graphQLSetDaemonSettings = (
  accountId: string | undefined,
  set: { autoUpdate?: boolean; channel?: string }
) =>
  graphQLBasicRequest(
    `mutation SetDaemonSettings($accountId: String, $autoUpdate: Boolean, $channel: String) {
      setDaemonSettings(accountId: $accountId, autoUpdate: $autoUpdate, channel: $channel) { autoUpdate channel }
    }`,
    { accountId, ...set }
  )
