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

export type DeviceDaemon = {
  deviceId: string
  running: string | null // what the device reports it runs; none when no device-session daemon reports
  target: { version: string; rollback: boolean } | null // what it should run; none leaves it on what it runs
  update: { version: string; state: DaemonUpdateState; detail?: string | null } | null
  channel: string
  hold: boolean
  pinned?: { version: string } | null // rolled back: pinned to this release until released
  rollbackTo?: { version: string } | null // where a rollback would take it
}

export type DaemonSettings = { autoUpdate: boolean; channel: string }

// The version a device reports it runs, without the daemon's name ("connectd-go 5.6.1.20261001" → "5.6.1.20261001").
export const runningVersion = (daemon?: { running?: string | null } | null) =>
  daemon?.running?.replace(/^connectd-go\s+/, '') || null

// An upgrade under way: worth watching until it settles.
export const updating = (daemon?: { update?: { state: string } | null } | null) =>
  !!daemon?.update && ['pending', 'started', 'downloading', 'installing'].includes(daemon.update.state)

// The schema's own refusal of a field or type it does not have.
const unsupported = (errors?: { message?: string }[]) =>
  !!errors?.some(error => /Cannot query field|Unknown (argument|type)/.test(error.message || ''))

async function read<T>(
  query: string,
  variables: ILookup<any>,
  field: string
): Promise<T | null | 'ERROR' | typeof UNSUPPORTED> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (unsupported(errors)) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.[field] ?? null
}

export const graphQLDeviceDaemon = (deviceId: string) =>
  read<DeviceDaemon>(
    `query DeviceDaemon($deviceId: String!) {
      deviceDaemon(deviceId: $deviceId) {
        deviceId
        running
        target { version rollback }
        update { version state detail }
        channel
        hold
        pinned { version }
        rollbackTo { version }
      }
    }`,
    { deviceId },
    'deviceDaemon'
  )

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
