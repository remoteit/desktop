import type { TFunction } from 'i18next'
import type {
  DeviceActionEffect,
  DeviceRuns,
  ExitDevice,
  ProxyDevice,
  RunCheck,
} from '../services/graphQLDeviceRuns'
import type { Exit } from '../services/graphQLExits'
import type { Proxy } from '../services/graphQLProxy'

/* Proxies and exits, and the devices that run them, as the portal says them (graphql-api docs/PROXY-GROUPS.md §13): a
   device's state in each — in service, draining, retired, joining while it waits for its checks or an admin, or
   disabled —, what an action on a device does to each proxy and exit it runs before it is taken, what the device still
   runs after, what deleting a proxy or an exit takes away, and an exit's devices' local networks — the exit's to open,
   each machine's administrator keeping the last word. An own exit none of whose devices carries its flows — serving,
   not disabled, and offering itself — has no device available: those using it go their usual way until one does. An
   own proxy is Internet or Local network (§14): a device in service in one is out of service while it fails a check —
   a local proxy's device on another network than its proxy's — or, an Internet proxy's, while the outside test cannot
   reach it. */

type Run = Pick<ExitDevice | ProxyDevice, 'state' | 'joining' | 'checks'> & {
  disabled?: boolean
  reachable?: boolean | null
}

// The checks failed — something to put right —, and those pending, waiting on what comes by itself.
export const failing = (checks: RunCheck[]) => checks.filter(check => !check.passed && !check.pending)
export const pending = (checks: RunCheck[]) => checks.filter(check => !check.passed && check.pending)

// A device in service that is out of it now: failing a check, or not reachable from the internet.
export const outOfService = (run: Pick<Run, 'state' | 'joining' | 'reachable'> & { checks?: RunCheck[] }) =>
  run.state === 'ACTIVE' && !run.joining && (run.reachable === false || failing(run.checks ?? []).length > 0)

// A device's state in a proxy or an exit, in a word or two: disabled, whatever its state there, before anything else.
export function runStateLabel(
  t: TFunction,
  run: Pick<Run, 'state' | 'joining' | 'disabled' | 'reachable'> & { checks?: RunCheck[] }
): string {
  if (run.disabled) return t('runs.disabledLabel', 'Disabled')
  if (run.joining) return t('runs.joining', 'Joining')
  if (run.state === 'ACTIVE')
    return outOfService(run) ? t('runs.outOfService', 'Out of service') : t('runs.active', 'In service')
  if (run.state === 'DRAINING') return t('runs.draining', 'Draining')
  return t('runs.retired', 'Retired')
}

// What its state means now: a disabled device serves nothing; what a joining one waits for — its checks, failed or
// pending, or an admin —, the checks a device in service fails, what a draining or retired one does, and why a device
// in an exit takes no flows.
export function runDetail(t: TFunction, run: Run & { refusal?: string | null }, activation?: string): string {
  if (run.disabled) return t('runs.disabled', 'Its device is disabled: it serves nothing until it is restored')
  const failed = failing(run.checks)
  const checksFail = () =>
    t('runs.checksFail', 'Its checks fail: {{reasons}}', { reasons: failed.map(check => check.reason).join('; ') })
  if (run.joining) {
    const waits = pending(run.checks)
    if (failed.length || waits.length)
      return [
        failed.length ? checksFail() : '',
        waits.length
          ? t('runs.waitsOn', 'Waiting: {{reasons}}', { reasons: waits.map(check => check.reason).join('; ') })
          : '',
      ]
        .filter(Boolean)
        .join(' · ')
    return activation === 'admin'
      ? t('runs.waitsForAdmin', 'Its checks pass: it waits for an admin to put it in service')
      : t('runs.goesIntoService', 'Its checks pass: it goes into service by itself')
  }
  if (run.state === 'ACTIVE' && failed.length) return checksFail()
  if (run.state === 'DRAINING') return t('runs.drainingHint', 'Takes nothing new, and serves what it has')
  if (run.state === 'RETIRED') return t('runs.retiredHint', 'Serves nothing')
  if (run.refusal) return t('runs.refusal', 'Takes no traffic now: {{refusal}}', { refusal: run.refusal })
  return ''
}

// The devices an exit or a proxy runs on, by name.
export function runsOnLine(t: TFunction, devices: { id: string; name: string | null }[] | null): string {
  if (!devices) return ''
  if (!devices.length) return t('runs.onNone', 'Runs on no device')
  return t('runs.on', 'Runs on {{names}}', { names: devices.map(device => device.name || device.id).join(', ') })
}

// The devices using an exit as theirs.
export function usersLine(t: TFunction, users: number | null): string {
  if (users === null) return ''
  return users
    ? t('exits.users', {
        count: users,
        defaultValue_one: '{{count}} device uses it as its exit',
        defaultValue_other: '{{count}} devices use it as their exit',
      })
    : t('exits.usersNone', 'No device uses it as its exit')
}

// Whether a device may choose an exit now, in a word or two: none where it may.
export function availabilityLabel(t: TFunction, exit: Pick<Exit, 'offered' | 'dormant'>): string {
  if (exit.dormant) return t('exits.noDevice', 'No device available')
  if (!exit.offered) return t('exits.notTakingTraffic', 'Not taking traffic now')
  return ''
}

// Whether a device may choose an exit now: none of its devices carrying its traffic is no device available.
export function availabilityLine(t: TFunction, exit: Pick<Exit, 'offered' | 'dormant'>): string {
  if (exit.dormant)
    return t(
      'exits.noDeviceAvailable',
      'No device available: none of its devices carries its traffic, so the devices using it go their usual way until one does.'
    )
  if (!exit.offered) return t('exits.notOffered', 'None of its devices takes traffic now.')
  return ''
}

// An exit whose users reach its devices' local networks, in a few words: none for one whose users do not.
export const lanLabel = (t: TFunction, exit: Pick<Exit, 'lan'>): string =>
  exit.lan ? t('exits.lan', 'Its users reach its devices’ local networks') : ''

/* An exit's device's local network as its machine has it — open to the exit's users or closed — and why, where it is
   not as its exit says or not the cloud's to set: its administrator keeps its exit node local, forbids exits, or its
   machine closed it. remote.it's exits reach no network of their machines, so `always` false says one only where it is
   open or has a reason: closed goes without saying there. */
export function lanLine(t: TFunction, run: Pick<ExitDevice, 'lan' | 'lanReason'>, always = true): string {
  const reason = run.lanReason
  if (!always && !run.lan && !reason) return ''
  if (run.lan)
    return reason
      ? t('runs.lanOpenBecause', 'Its local network: open to the exit’s users — {{reason}}', { reason })
      : t('runs.lanOpen', 'Its local network: open to the exit’s users')
  return reason
    ? t('runs.lanClosedBecause', 'Its local network: closed to the exit’s users — {{reason}}', { reason })
    : t('runs.lanClosed', 'Its local network: closed to the exit’s users')
}

// Said before devices are added to an exit whose users reach its devices' local networks: each added opens its own to
// them. The devices chosen by name, or any device where none is chosen yet.
export function lanAddWarning(t: TFunction, devices: string[]): string {
  if (!devices.length)
    return t(
      'runs.lanAddAny',
      'This exit lets its users reach its devices’ local networks: each device added opens its network to them.'
    )
  return t('runs.lanAdd', {
    count: devices.length,
    devices: devices.join(', '),
    defaultValue_one:
      'This exit lets its users reach its devices’ local networks: adding {{devices}} opens its network to them.',
    defaultValue_other:
      'This exit lets its users reach its devices’ local networks: adding {{devices}} opens their networks to them.',
  })
}

// An own proxy's kind, in a few words: Local network only, on its network once it has one, or Internet.
export function proxyKindLabel(t: TFunction, proxy: Pick<Proxy, 'local' | 'localNetwork'>): string {
  if (!proxy.local) return t('proxies.internet', 'Internet')
  return proxy.localNetwork
    ? t('proxies.localOnly', 'Local network only: {{network}}', { network: proxy.localNetwork })
    : t('proxies.localOnlyNone', 'Local network only')
}

// A proxy's endpoints.
export function endpointsLine(t: TFunction, endpoints: number | null | undefined): string {
  if (endpoints == null) return ''
  return endpoints
    ? t('proxies.endpoints', {
        count: endpoints,
        defaultValue_one: '{{count}} endpoint',
        defaultValue_other: '{{count}} endpoints',
      })
    : t('proxies.endpointsNone', 'No endpoints')
}

// What an action does to one proxy or exit a device runs: its state before and after — a deleted device keeps its
// place, serving nothing while it is disabled —, the connections it ends or keeps, a proxy's endpoints and an exit's
// users, whether an exit is left with no device available, and a refusal.
export function effectLines(t: TFunction, effect: DeviceActionEffect): string[] {
  const kind = effect.kind === 'proxy' ? t('runs.proxy', 'Proxy') : t('runs.exit', 'Exit')
  const from = runStateLabel(t, { state: effect.state, joining: false }).toLowerCase()
  const after = effect.after.toUpperCase()
  const to =
    after === 'DISABLED'
      ? t('runEffect.disabled', 'serving nothing while it is disabled')
      : after === 'GONE'
      ? t('runEffect.gone', 'taken out of it')
      : after === effect.state
      ? t('runEffect.unchanged', 'unchanged')
      : runStateLabel(t, { state: after as DeviceActionEffect['state'], joining: false }).toLowerCase()
  const lines = [t('runEffect.state', '{{kind}} {{name}}: {{from}} → {{to}}', { kind, name: effect.name, from, to })]
  if (effect.sessions === null) lines.push(t('runEffect.sessionsUnknown', 'Its daemon does not say what is open through it.'))
  else if (effect.sessions && effect.ends)
    lines.push(
      t('runEffect.sessionsEnd', {
        count: effect.sessions,
        defaultValue_one: 'The {{count}} connection open through it ends.',
        defaultValue_other: 'The {{count}} connections open through it end.',
      })
    )
  else if (effect.sessions)
    lines.push(
      t('runEffect.sessionsKept', {
        count: effect.sessions,
        defaultValue_one: 'The {{count}} connection open through it is kept until it closes.',
        defaultValue_other: 'The {{count}} connections open through it are kept until they close.',
      })
    )
  const leaves = after !== 'ACTIVE'
  if (effect.kind === 'proxy' && effect.endpoints && leaves)
    lines.push(
      effect.inService
        ? t('runEffect.endpointsServed', {
            count: effect.endpoints,
            defaultValue_one: 'Its endpoint stays on the proxy, served by its other devices in service.',
            defaultValue_other: 'Its {{count}} endpoints stay on the proxy, served by its other devices in service.',
          })
        : t('runEffect.endpointsUnserved', {
            count: effect.endpoints,
            defaultValue_one: 'Its endpoint stays on the proxy, served by no device until one is in service.',
            defaultValue_other: 'Its {{count}} endpoints stay on the proxy, served by no device until one is in service.',
          })
    )
  if (effect.kind === 'exit' && effect.moved)
    lines.push(
      effect.inService
        ? t('runEffect.usersMove', {
            count: effect.moved,
            defaultValue_one: '{{count}} device going out through it now moves to another of its devices.',
            defaultValue_other: '{{count}} devices going out through it now move to another of its devices.',
          })
        : t('runEffect.usersWait', {
            count: effect.moved,
            defaultValue_one: '{{count}} device going out through it now waits for another of its devices.',
            defaultValue_other: '{{count}} devices going out through it now wait for another of its devices.',
          })
    )
  if (effect.dormant)
    lines.push(
      effect.users
        ? t('runEffect.dormantUsers', {
            count: effect.users,
            defaultValue_one:
              'No device available after: the {{count}} device using it goes its usual way until one of its devices carries traffic again.',
            defaultValue_other:
              'No device available after: the {{count}} devices using it go their usual way until one of its devices carries traffic again.',
          })
        : t('runEffect.dormant', 'No device available after, until one of its devices carries traffic again.')
    )
  if (effect.refusal) lines.push(t('runEffect.refused', 'Refused: {{refusal}}.', { refusal: effect.refusal }))
  return lines
}

// What a device runs after an action on one proxy or exit of it, or on all of them: each with its state, or nothing.
export function stillRunsLine(t: TFunction, device: string, runs: DeviceRuns): string {
  const proxy = runs.proxy?.proxy?.name
  const exit = runs.exit?.exit?.name
  const proxyState = runs.proxy ? runStateLabel(t, runs.proxy).toLowerCase() : ''
  const exitState = runs.exit ? runStateLabel(t, runs.exit).toLowerCase() : ''
  if (proxy && exit)
    return t('runs.stillBoth', '{{device}} runs the proxy {{proxy}} ({{proxyState}}) and the exit {{exit}} ({{exitState}}).', {
      device,
      proxy,
      proxyState,
      exit,
      exitState,
    })
  if (proxy) return t('runs.stillProxy', '{{device}} runs the proxy {{proxy}} ({{proxyState}}).', { device, proxy, proxyState })
  if (exit) return t('runs.stillExit', '{{device}} runs the exit {{exit}} ({{exitState}}).', { device, exit, exitState })
  return t('runs.stillNothing', '{{device}} runs no proxy or exit now.', { device })
}

// What deleting an own exit takes away: the exit of the devices using it, its shares, its offers on networks.
export function deleteExitLines(t: TFunction, exit: Pick<Exit, 'users' | 'access' | 'networks'>): string[] {
  const lines: string[] = []
  if (exit.users)
    lines.push(
      t('exits.deleteUsers', {
        count: exit.users,
        defaultValue_one: 'The {{count}} device using it as its exit loses it, and goes its usual way.',
        defaultValue_other: 'The {{count}} devices using it as their exit lose it, and go their usual way.',
      })
    )
  if (exit.access.length)
    lines.push(
      t('exits.deleteShares', 'Its shares with {{emails}} end.', {
        emails: exit.access.map(share => share.user.email || share.user.id).join(', '),
      })
    )
  if (exit.networks?.length)
    lines.push(
      t('exits.deleteNetworks', 'It is no longer offered on {{networks}}.', {
        networks: exit.networks.map(network => network.name).join(', '),
      })
    )
  if (!lines.length) lines.push(t('exits.deleteNothing', 'Nothing else changes: nothing uses it.'))
  return lines
}

// What deleting an own proxy takes away: its endpoints, for everyone using one.
export const deleteProxyLine = (t: TFunction, endpoints: number | null) =>
  endpoints
    ? t('proxies.deleteEndpoints', {
        count: endpoints,
        defaultValue_one: 'Its endpoint is removed, for everyone using it.',
        defaultValue_other: 'Its {{count}} endpoints are removed, for everyone using one.',
      })
    : t('proxies.deleteNothing', 'It has no endpoints: nothing else changes.')
