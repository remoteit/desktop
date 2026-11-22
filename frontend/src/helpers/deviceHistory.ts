import type { TFunction } from 'i18next'
import type { DeviceAboutChange } from '../services/graphQLDeviceAbout'

export type HistoryPhrase = {
  text: string
  detail?: string
  raw?: string // the field and its values as the device said them, shown on expand
  known: boolean
  warning?: boolean
}

const ACCOUNT_FIELD = 'accounts.'
const APP_FIELD = /^apps\.([^.]+\.[^.]+)\.(.+)$/

export function appName(t: TFunction, id: string) {
  if (id === 'remoteit.console') return t('deviceHistory.terminalApp', 'Terminal')
  const name = id.split('.').pop() || id
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const rawLine = (t: TFunction, change: DeviceAboutChange) =>
  `${change.field}: ${change.before ?? t('deviceHistory.nothing', 'nothing')} → ${
    change.after ?? t('deviceHistory.nothing', 'nothing')
  }`

export function historyPhrase(t: TFunction, change: DeviceAboutChange): HistoryPhrase {
  const known = (text: string, extra: Partial<HistoryPhrase> = {}): HistoryPhrase => ({
    text,
    known: true,
    ...extra,
  })
  const value = change.after ?? ''

  switch (change.kind) {
    case 'update':
      return known(
        change.field === 'refused'
          ? t('deviceHistory.updateRefused', 'Agent update to {{version}} refused', { version: value })
          : t('deviceHistory.updateFailed', 'Agent update to {{version}} failed', { version: value }),
        { detail: change.detail ?? undefined, warning: true }
      )
    case 'restore':
      return known(t('deviceHistory.recovered', 'Device recovered with a code'), {
        detail: [change.after, change.detail].filter(Boolean).join(', ') || undefined,
      })
    case 'boot':
      return known(t('deviceHistory.agentStarted', 'Agent started'), {
        detail:
          [
            change.before && t('deviceHistory.withKey', 'With key {{key}}', { key: change.before }),
            change.after,
            change.detail,
          ]
            .filter(Boolean)
            .join(', ') || undefined,
      })
    case 'duplicate':
      return duplicatePhrase(t, change)
  }

  const field = change.field
  const before = change.before
  const after = change.after
  const raw = rawLine(t, change)
  const withRaw = (text: string, extra: Partial<HistoryPhrase> = {}) => known(text, { raw, ...extra })

  if (field.startsWith(ACCOUNT_FIELD)) {
    const name = field.slice(ACCOUNT_FIELD.length)
    if (before == null) return withRaw(t('deviceHistory.accountAdded', 'Account {{name}} added', { name }))
    if (after == null) return withRaw(t('deviceHistory.accountRemoved', 'Account {{name}} removed', { name }))
    return withRaw(t('deviceHistory.accountChanged', 'Account {{name}} changed', { name }))
  }

  const app = APP_FIELD.exec(field)
  if (app) {
    const name = appName(t, app[1])
    switch (app[2]) {
      case 'state':
        if (after == null) return withRaw(t('deviceHistory.appRemoved', '{{app}} removed', { app: name }))
        if (after === 'running') return withRaw(t('deviceHistory.appStarted', '{{app}} started', { app: name }))
        if (after === 'starting') return withRaw(t('deviceHistory.appStarting', '{{app}} starting', { app: name }))
        if (after === 'disabled') return withRaw(t('deviceHistory.appOff', '{{app}} turned off', { app: name }))
        if (after === 'removing') return withRaw(t('deviceHistory.appRemoving', '{{app}} being removed', { app: name }))
        if (after === 'unavailable')
          return withRaw(t('deviceHistory.appStopped', '{{app}} stopped working', { app: name }), { warning: true })
        break
      case 'version':
        if (after)
          return withRaw(
            before == null
              ? t('deviceHistory.appInstalled', '{{app}} {{version}} installed', { app: name, version: after })
              : t('deviceHistory.appUpdated', '{{app}} updated to {{version}}', { app: name, version: after })
          )
        break
      case 'detail':
        return withRaw(t('deviceHistory.appStatus', '{{app}} status changed', { app: name }), {
          detail: after ?? undefined,
        })
    }
    return withRaw(t('deviceHistory.appChanged', '{{app}} changed', { app: name }))
  }

  switch (field) {
    case 'software.connectd':
      return withRaw(
        before == null
          ? t('deviceHistory.agentReported', 'Agent {{version}} reported', { version: value })
          : t('deviceHistory.agentUpdated', 'Agent updated to {{version}}', { version: value })
      )
    case 'software.package':
    case 'software.format':
      return withRaw(t('deviceHistory.agentPackage', 'Agent package changed'), { detail: after ?? undefined })
    case 'os.version':
    case 'os.build':
      return withRaw(t('deviceHistory.osUpdated', 'Operating system updated to {{version}}', { version: value }))
    case 'os.kernel':
      return withRaw(t('deviceHistory.kernelUpdated', 'Kernel updated to {{version}}', { version: value }))
    case 'os.name':
    case 'os.family':
    case 'os.id':
    case 'os.edition':
      return withRaw(t('deviceHistory.osChanged', 'Operating system changed'), { detail: after ?? undefined })
    case 'oem.firmware':
      return withRaw(t('deviceHistory.firmwareUpdated', 'Firmware updated to {{version}}', { version: value }))
    case 'ids.serial':
    case 'ids.hardware_uuid':
    case 'ids.machine_id':
      return withRaw(t('deviceHistory.hardwareId', 'Hardware ID changed'), { warning: true })
    case 'ids.macs':
    case 'ids.disk_serial':
      return withRaw(t('deviceHistory.hardwareChanged', 'Hardware changed'))
    case 'network.gatewayId':
      return withRaw(
        before == null
          ? t('deviceHistory.networkFound', 'Local network detected')
          : t('deviceHistory.networkMoved', 'Moved to another local network')
      )
    case 'network.address':
      return withRaw(t('deviceHistory.ipChanged', 'IP address changed to {{address}}', { address: value }))
    case 'network.gateway':
      return withRaw(t('deviceHistory.routerChanged', 'Router changed to {{address}}', { address: value }))
    case 'network.interface':
      return withRaw(t('deviceHistory.interfaceChanged', 'Network interface changed to {{name}}', { name: value }))
    case 'nat.mapping':
    case 'nat.filtering':
      return withRaw(t('deviceHistory.natChanged', 'Network type changed'))
    case 'ssh.accounts_problem':
      return after
        ? withRaw(t('deviceHistory.terminalProblem', 'Terminal sign-in problem'), { detail: after, warning: true })
        : withRaw(t('deviceHistory.terminalFixed', 'Terminal sign-in problem fixed'))
    case 'scripts.ticket':
      return withRaw(
        after === 'true'
          ? t('deviceHistory.scriptsReady', 'Ready to run scripts')
          : t('deviceHistory.scriptsNotReady', 'No longer ready to run scripts')
      )
    case 'printers':
      return withRaw(t('deviceHistory.printers', 'Printers changed'))
    case 'web':
      return withRaw(t('deviceHistory.web', 'Web service check changed'))
  }

  if (field.startsWith('ssh.')) return withRaw(t('deviceHistory.terminalChanged', 'Terminal access changed'))
  if (field.startsWith('scripts.')) return withRaw(t('deviceHistory.scriptsChanged', 'Script support changed'))
  if (field.startsWith('policy.'))
    return withRaw(t('deviceHistory.adminChanged', "The device's administrator changed a setting"))
  if (field.startsWith('signin')) return withRaw(t('deviceHistory.signIns', 'Sign-ins changed'))
  if (FIELD_LABELS[field])
    return withRaw(t('deviceHistory.labelChanged', '{{label}} changed', { label: FIELD_LABELS[field] }), {
      detail: after ?? undefined,
    })

  return { text: t('deviceHistory.settingChanged', 'Setting changed'), raw, known: false }
}

function duplicatePhrase(t: TFunction, change: DeviceAboutChange): HistoryPhrase {
  const device = change.after ?? ''
  const where = [change.after, change.detail].filter(Boolean).join(', ') || undefined
  const phrase = (text: string, detail = change.detail ?? undefined): HistoryPhrase => ({
    text,
    detail,
    known: true,
    warning: true,
  })
  switch (change.field) {
    case 'copy':
      return phrase(t('deviceHistory.copy', 'A copy of this device was split off as {{device}}', { device }))
    case 'copy-of':
      return phrase(t('deviceHistory.copyOf', 'Split off from {{device}}', { device }))
    case 'device-join-key':
      return phrase(t('deviceHistory.joinKeyElsewhere', 'Join key used on another machine and refused'), where)
    case 'key':
      return phrase(t('deviceHistory.keyElsewhere', "Another machine used this device's identity and was refused"), where)
    case 'kept':
      return phrase(
        change.after
          ? t('deviceHistory.keptFrom', 'Kept as a separate device, split off from {{device}}', { device })
          : t('deviceHistory.kept', 'Kept as a separate device')
      )
    case 'original':
      return phrase(t('deviceHistory.swapped', 'Machine swapped with {{device}}', { device }))
  }
  return {
    text: t('deviceHistory.duplicate', 'Duplicate device found'),
    raw: [change.field, change.after].filter(Boolean).join(', '),
    known: false,
    warning: true,
  }
}

// A field's path, as a person reads it: os.version → "OS version"; the path itself for one not named here.
export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field
const FIELD_LABELS: ILookup<string> = {
  'os.family': 'OS family',
  'os.name': 'OS',
  'os.id': 'OS id',
  'os.version': 'OS version',
  'os.build': 'OS build',
  'os.kernel': 'Kernel',
  'os.edition': 'OS edition',
  'hardware.arch': 'Architecture',
  'hardware.cpu': 'CPU',
  'hardware.cores': 'Cores',
  'hardware.memory_mb': 'Memory (MB)',
  'hardware.manufacturer': 'Manufacturer',
  'hardware.model': 'Model',
  'hardware.board': 'Board',
  'hardware.virtual': 'Virtual',
  'ids.serial': 'Serial',
  'ids.hardware_uuid': 'Hardware UUID',
  'ids.machine_id': 'Machine ID',
  'ids.macs': 'Network interfaces',
  'ids.disk_serial': 'Boot disk serial',
  'oem.product': 'Product',
  'oem.product_name': 'Product name',
  'oem.manufacturer': 'Product manufacturer',
  'oem.model': 'Product model',
  'oem.hardware_revision': 'Hardware revision',
  'oem.firmware': 'Firmware',
  'oem.serial': 'Product serial',
  'software.connectd': 'Agent',
  'software.package': 'Package',
  'software.format': 'Package format',
  'nat.mapping': 'NAT mapping',
  'nat.filtering': 'NAT filtering',
  'nat.since': 'NAT measured since',
  'nat.note': 'NAT reading assumed',
  'nat.why': 'NAT not measured',
}
