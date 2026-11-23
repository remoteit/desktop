import type { TFunction } from 'i18next'
import type {
  DeviceActionEffect,
  ExitDevice,
  ProxyDevice,
  RunAction,
  RunCandidate,
} from '../services/graphQLDeviceRuns'
import type { Exit } from '../services/graphQLExits'
import type { ListedProxy } from '../services/graphQLProxy'
import { failing, outOfService } from './runsHelper'

type Run = Pick<ExitDevice | ProxyDevice, 'state' | 'joining' | 'disabled' | 'checks'> & {
  reachable?: boolean | null
  offering?: boolean
}

export type PlainAction = 'PAUSE' | 'RESUME' | 'APPROVE' | 'STOP' | 'REMOVE'

// Pause lets open connections finish (drain); Stop now ends them (retire); Resume and Approve put the device back in
// service (undrain); Remove takes it out of the exit or proxy server.
export const RUN_ACTION: Record<PlainAction, RunAction> = {
  PAUSE: 'DRAIN',
  RESUME: 'UNDRAIN',
  APPROVE: 'UNDRAIN',
  STOP: 'RETIRE',
  REMOVE: 'REMOVE',
}

export function plainActionsFor(run: Pick<Run, 'state' | 'joining'>, activation?: string): PlainAction[] {
  if (run.joining) return activation === 'admin' ? ['APPROVE', 'REMOVE'] : ['REMOVE']
  if (run.state === 'ACTIVE') return ['PAUSE', 'REMOVE']
  if (run.state === 'DRAINING') return ['RESUME', 'STOP', 'REMOVE']
  return ['RESUME', 'REMOVE']
}

export function plainActionLabel(t: TFunction, action: PlainAction): string {
  return {
    PAUSE: t('carry.pause', 'Pause'),
    RESUME: t('carry.resume', 'Resume'),
    APPROVE: t('carry.approve', 'Approve'),
    STOP: t('carry.stop', 'Stop now'),
    REMOVE: t('carry.remove', 'Remove'),
  }[action]
}

export const plainActionOf = (action: RunAction): PlainAction =>
  action === 'DRAIN' ? 'PAUSE' : action === 'UNDRAIN' ? 'RESUME' : action === 'RETIRE' ? 'STOP' : 'REMOVE'

// A device carrying traffic now: in service, not joining or disabled, passing its checks, and offering itself.
export const carrying = (run: Run) =>
  run.state === 'ACTIVE' && !run.joining && !run.disabled && !outOfService(run) && run.offering !== false

export function carrierState(t: TFunction, run: Run): string {
  if (run.disabled) return t('carry.disabled', 'Disabled')
  if (run.joining)
    return failing(run.checks).length ? t('carry.notReady', 'Not ready') : t('carry.starting', 'Starting')
  if (run.state === 'DRAINING') return t('carry.pausing', 'Pausing')
  if (run.state === 'RETIRED') return t('carry.paused', 'Paused')
  return carrying(run) ? t('carry.on', 'On') : t('carry.notWorking', 'Not working')
}

export function carrierColor(run: Run): Color {
  if (run.disabled || run.state === 'RETIRED') return 'gray'
  if (run.joining) return failing(run.checks).length ? 'warning' : 'primary'
  if (run.state === 'DRAINING') return 'warning'
  return carrying(run) ? 'success' : 'warning'
}

const nameOf = (device: { id: string; name: string | null }) => device.name || device.id

// What a person needs to know of an exit at a glance: whether it is ready, and which devices carry it.
export function exitSummary(t: TFunction, exit: Pick<Exit, 'devices' | 'offered'>): string {
  const devices = exit.devices
  if (!devices) return exit.offered ? t('carry.ready', 'Ready') : t('carry.notReadyShort', 'Not ready')
  if (!devices.length) return t('carry.noDevice', 'No device yet')
  const carriers = devices.filter(carrying)
  if (carriers.length || exit.offered) {
    const shown = carriers.length ? carriers : devices
    return t('carry.readyExitDevices', {
      count: shown.length,
      names: shown.map(nameOf).join(', '),
      defaultValue_one: 'Ready · exit device: {{names}}',
      defaultValue_other: 'Ready · exit devices: {{names}}',
    })
  }
  const names = devices.map(nameOf).join(', ')
  if (devices.some(device => device.joining)) return t('carry.startingOn', 'Starting · {{names}}', { names })
  if (devices.every(device => device.state !== 'ACTIVE')) return t('carry.pausedOn', 'Paused · {{names}}', { names })
  return t('carry.notReadyOn', 'Not ready · {{names}}', { names })
}

export function routedLine(t: TFunction, users: number | null): string {
  if (!users) return ''
  return t('carry.routed', {
    count: users,
    defaultValue_one: '{{count}} device routes through it',
    defaultValue_other: '{{count}} devices route through it',
  })
}

export function proxySummary(t: TFunction, proxy: Pick<ListedProxy, 'devices' | 'endpointCount'>): string {
  const devices = proxy.devices ?? []
  const addresses = addressCount(t, proxy.endpointCount)
  if (!devices.length) return [t('carry.noDevice', 'No device yet'), addresses].filter(Boolean).join(' · ')
  const carriers = devices.filter(carrying)
  const names = (carriers.length ? carriers : devices).map(nameOf).join(', ')
  const state = carriers.length
    ? t('carry.readyOn', 'Ready · on {{names}}', { names })
    : devices.some(device => device.joining)
    ? t('carry.startingOn', 'Starting · {{names}}', { names })
    : devices.every(device => device.state !== 'ACTIVE')
    ? t('carry.pausedOn', 'Paused · {{names}}', { names })
    : t('carry.notReadyOn', 'Not ready · {{names}}', { names })
  return [state, addresses].filter(Boolean).join(' · ')
}

export function addressCount(t: TFunction, count: number | null | undefined): string {
  if (!count) return ''
  return t('carry.addresses', {
    count,
    defaultValue_one: '{{count}} public address',
    defaultValue_other: '{{count}} public addresses',
  })
}

// Client-only entries (a phone, a browser) can never carry an exit or run a proxy server: they are not offered at all.
export const clientOnly = (candidate: Pick<RunCandidate, 'fit' | 'refusal'>) =>
  !candidate.fit && /client only/i.test(candidate.refusal ?? '')

const runsTarget = (candidate: RunCandidate, kind: 'proxy' | 'exit', target?: string) =>
  !!target && (kind === 'proxy' ? candidate.runs.proxy?.proxy?.id === target : candidate.runs.exit?.exit?.id === target)

// The devices to offer: never a client-only one or one already in it; those that fit first, then by name.
export function candidatesShown(kind: 'proxy' | 'exit', candidates: RunCandidate[], target?: string): RunCandidate[] {
  return candidates
    .filter(candidate => !clientOnly(candidate) && !runsTarget(candidate, kind, target))
    .sort((a, b) => Number(b.fit) - Number(a.fit) || nameOf(a).localeCompare(nameOf(b)))
}

export type CandidateWhy = { reason: string; howTo?: string[] }

// Why a device cannot be added, in words a person can act on, with how to allow it where the cause is known.
export function candidateWhy(t: TFunction, kind: 'proxy' | 'exit', candidate: RunCandidate): CandidateWhy {
  const other = kind === 'proxy' ? candidate.runs.proxy?.proxy?.name : candidate.runs.exit?.exit?.name
  return refusalWhy(t, kind, candidate.refusal ?? '', other)
}

// graphql's refusal for a device in an exit or proxy server, in a person's words.
export function refusalWhy(t: TFunction, kind: 'proxy' | 'exit', refusal: string, other?: string): CandidateWhy {
  if (kind === 'exit' && /forbids exits|exit node (is )?off/i.test(refusal))
    return {
      reason: t('carry.exitsOff', 'Exits are turned off on this device.'),
      howTo: [
        t('carry.exitsOffDocker', 'In Docker, start the container with --cap-add NET_ADMIN --device /dev/net/tun.'),
        t(
          'carry.exitsOffMachine',
          'Elsewhere, run this on the device as an administrator: remoteit-device policy exit_node_control cloud+local'
        ),
      ],
    }
  if (kind === 'proxy' && /forbids the proxy role/i.test(refusal))
    return {
      reason: t('carry.proxyOff', 'Proxy servers are turned off on this device.'),
      howTo: [
        t(
          'carry.proxyOffMachine',
          'Run this on the device as an administrator: remoteit-device policy proxy_control cloud+local'
        ),
      ],
    }
  if (/not online/i.test(refusal))
    return { reason: t('carry.offline', 'This device is offline. Bring it online to add it.') }
  if (/cannot be a proxy/i.test(refusal))
    return { reason: t('carry.agentOld', 'This device’s agent can’t run a proxy server. Update the agent first.') }
  if (/different accounts/i.test(refusal))
    return { reason: t('carry.otherAccount', 'This device belongs to another account.') }
  const uses = refusal.match(/^it uses (.+) as its own exit/i)
  if (uses)
    return {
      reason: t('carry.routesThrough', 'This device routes through {{exit}}. Choose another exit for it first.', {
        exit: uses[1],
      }),
    }
  if (/drain it there first/i.test(refusal) && other)
    return {
      reason:
        kind === 'proxy'
          ? t('carry.busyProxy', 'This device runs {{name}} for others. Pause it there first.', { name: other })
          : t('carry.busyExit', 'This device is an exit device for {{name}}. Pause it there first.', { name: other }),
    }
  return {
    reason: refusal
      ? t('carry.cannot', 'Can’t use this device: {{reason}}', { reason: refusal })
      : t('carry.cannotPlain', 'Can’t use this device.'),
  }
}

// Beside a device that fits: what adding it changes, if anything.
export function candidateFitLine(t: TFunction, kind: 'proxy' | 'exit', candidate: RunCandidate): string {
  const other = kind === 'proxy' ? candidate.runs.proxy?.proxy?.name : candidate.runs.exit?.exit?.name
  if (!other) return ''
  return kind === 'proxy'
    ? t('carry.leavesProxy', 'Leaves {{name}} when added', { name: other })
    : t('carry.leavesExit', 'Stops being an exit device for {{name}} when added', { name: other })
}

// What an action on one device of an exit or proxy server changes, in a person's words.
export function plainEffectLines(t: TFunction, effect: DeviceActionEffect): string[] {
  const lines: string[] = []
  if (effect.refusal) lines.push(t('carry.refused', 'Can’t do this now: {{reason}}', { reason: effect.refusal }))
  if (effect.sessions && effect.ends)
    lines.push(
      t('carry.sessionsEnd', {
        count: effect.sessions,
        defaultValue_one: '{{count}} open connection ends.',
        defaultValue_other: '{{count}} open connections end.',
      })
    )
  else if (effect.sessions)
    lines.push(
      t('carry.sessionsKept', {
        count: effect.sessions,
        defaultValue_one: '{{count}} open connection finishes first.',
        defaultValue_other: '{{count}} open connections finish first.',
      })
    )
  if (effect.kind === 'exit' && effect.moved)
    lines.push(
      effect.inService
        ? t('carry.usersMove', {
            count: effect.moved,
            defaultValue_one: '{{count}} device routing through it moves to another exit device.',
            defaultValue_other: '{{count}} devices routing through it move to another exit device.',
          })
        : t('carry.usersWait', {
            count: effect.moved,
            defaultValue_one: '{{count}} device routing through it waits for another exit device.',
            defaultValue_other: '{{count}} devices routing through it wait for another exit device.',
          })
    )
  if (effect.kind === 'proxy' && effect.endpoints && effect.after.toUpperCase() !== 'ACTIVE')
    lines.push(
      effect.inService
        ? t('carry.addressesServed', 'Its public addresses keep working on the other devices.')
        : t('carry.addressesStop', 'Its public addresses stop working until another device is on.')
    )
  if (effect.dormant)
    lines.push(
      t('carry.noneLeft', '{{name}} has no other device ready. Devices routing through it go direct until one is.', {
        name: effect.name,
      })
    )
  if (effect.kind === 'exit' && effect.lanCloses)
    lines.push(t('carry.lanCloses', 'People using the exit can no longer reach this device’s local network.'))
  if (!lines.length) lines.push(t('carry.nothingElse', 'Nothing else changes.'))
  return lines
}

// Said after an action on one device of an exit or proxy server: where the device stands in it now.
export function afterActionLine(
  t: TFunction,
  kind: 'proxy' | 'exit',
  target: { id: string; name: string },
  device: string,
  runs: { proxy: ProxyDevice | null; exit: ExitDevice | null }
): string {
  const run = kind === 'exit' ? runs.exit : runs.proxy
  const of = kind === 'exit' ? runs.exit?.exit?.id : runs.proxy?.proxy?.id
  if (!run || (of && of !== target.id))
    return t('carry.removedLine', '{{device}} was removed from {{name}}.', { device, name: target.name })
  return t('carry.nowLine', '{{device}} is now {{state}}.', { device, state: carrierState(t, run).toLowerCase() })
}

export function deleteExitWords(t: TFunction, exit: Pick<Exit, 'users' | 'access' | 'networks'>): string[] {
  const lines: string[] = []
  if (exit.users)
    lines.push(
      t('carry.deleteUsers', {
        count: exit.users,
        defaultValue_one: '{{count}} device routing through it will go direct.',
        defaultValue_other: '{{count}} devices routing through it will go direct.',
      })
    )
  if (exit.access.length)
    lines.push(
      t('carry.deleteShares', 'It stops being shared with {{emails}}.', {
        emails: exit.access.map(share => share.user.email || share.user.id).join(', '),
      })
    )
  if (exit.networks?.length)
    lines.push(
      t('carry.deleteNetworks', 'It is removed from {{networks}}.', {
        networks: exit.networks.map(network => network.name).join(', '),
      })
    )
  if (!lines.length) lines.push(t('carry.nothingElse', 'Nothing else changes.'))
  return lines
}

export const deleteProxyWords = (t: TFunction, endpoints: number | null) =>
  endpoints
    ? t('carry.deleteAddresses', {
        count: endpoints,
        defaultValue_one: 'Its public address stops working for everyone.',
        defaultValue_other: 'Its {{count}} public addresses stop working for everyone.',
      })
    : t('carry.nothingElse', 'Nothing else changes.')
