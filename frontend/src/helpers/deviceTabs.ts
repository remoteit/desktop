import type { TFunction } from 'i18next'

export type DeviceTab = 'overview' | 'services' | 'sharing' | 'settings' | 'activity' | 'exit'

export const DEVICE_TABS: DeviceTab[] = ['overview', 'services', 'sharing', 'settings', 'activity', 'exit']

export type SettingsSection = 'device' | 'access' | 'services' | 'agent' | 'advanced'
export type ActivitySection = 'log' | 'history' | 'flows'
export type ExitSection = 'runs' | 'flows'

type TabDevice = Pick<IDevice, 'virtual' | 'permissions'>

export function deviceTabs(device: TabDevice, carries?: boolean): DeviceTab[] {
  return DEVICE_TABS.filter(tab => {
    if (tab === 'sharing') return device.permissions.includes('MANAGE')
    if (tab === 'exit') return !device.virtual && !!carries
    return true
  })
}

export function tabLabel(t: TFunction, tab: DeviceTab): string {
  switch (tab) {
    case 'overview':
      return t('deviceTabs.overview', 'Overview')
    case 'services':
      return t('deviceTabs.services', 'Services')
    case 'sharing':
      return t('deviceTabs.sharing', 'Sharing')
    case 'settings':
      return t('deviceTabs.settings', 'Settings')
    case 'activity':
      return t('deviceTabs.activity', 'Activity')
    case 'exit':
      return t('deviceTabs.exit', 'Exit')
  }
}

export const LEGACY_PAGES = ['details', 'edit', 'users', 'logs', 'agent', 'runs', 'exit-flows'] as const
export type LegacyPage = (typeof LEGACY_PAGES)[number]

// Where an address from before the tabs lands: its tab, and the section on it. Runs and exit flows depend on whether
// the device carries an exit or a proxy, so they wait for that answer (undefined while it is read).
export function legacyTarget(page: LegacyPage, carries: boolean | undefined): string | undefined {
  switch (page) {
    case 'details':
      return 'overview'
    case 'edit':
      return 'settings'
    case 'users':
      return 'sharing'
    case 'logs':
      return 'activity'
    case 'agent':
      return 'settings/agent'
    case 'runs':
      return carries === undefined ? undefined : carries ? 'exit' : 'settings/advanced'
    case 'exit-flows':
      return carries === undefined ? undefined : carries ? 'exit/flows' : 'activity/flows'
  }
}
