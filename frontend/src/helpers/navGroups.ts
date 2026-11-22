import type { TFunction } from 'i18next'

export type NavItemId =
  | 'thisDevice'
  | 'connections'
  | 'devices'
  | 'networks'
  | 'services'
  | 'exits'
  | 'proxies'
  | 'scripting'
  | 'apps'
  | 'products'
  | 'organization'
  | 'partnerStats'
  | 'logs'

export type NavGroupId = 'thisDevice' | 'devices' | 'network' | 'fleet' | 'team'

export type NavGates = {
  thisDevice: boolean
  mobile: boolean
  services: boolean
  deviceSessions: boolean
  partner: boolean
}

/* What the account has, from the store. undefined: not read yet. */
export type NavSignals = {
  networks?: number
  deviceSessions: boolean
  products?: number
  scripts?: number
  devices?: number
  organization?: boolean
}

export type NavGroup = {
  id: NavGroupId
  label: (t: TFunction) => string
  items: NavItemId[]
  header: boolean
  defaultOpen: (signals: NavSignals) => boolean
}

const has = (count?: number) => count === undefined || count > 0

/* label is a function so the i18n extractor sees each key with its English default. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'thisDevice',
    label: t => t('navGroup.thisDevice', 'This device'),
    items: ['thisDevice'],
    header: false,
    defaultOpen: () => true,
  },
  {
    id: 'devices',
    label: t => t('navGroup.devices', 'Devices'),
    items: ['devices', 'connections', 'services'],
    header: true,
    defaultOpen: () => true,
  },
  {
    id: 'network',
    label: t => t('navGroup.network', 'Network'),
    items: ['networks', 'exits', 'proxies'],
    header: true,
    // Exits and proxies are counted only by their own pages' queries, so with them shown the group opens.
    defaultOpen: s => has(s.networks) || s.deviceSessions,
  },
  {
    id: 'fleet',
    label: t => t('navGroup.fleet', 'Fleet'),
    items: ['products', 'scripting', 'apps'],
    header: true,
    defaultOpen: s => has(s.products) || has(s.scripts) || (s.devices ?? 0) > 10,
  },
  {
    id: 'team',
    label: t => t('navGroup.team', 'Team'),
    items: ['organization', 'logs', 'partnerStats'],
    header: true,
    defaultOpen: s => s.organization !== false,
  },
]

export const NAV_MATCH: Record<NavItemId, { match: string[]; exact?: boolean }> = {
  thisDevice: { match: ['/this-device'] },
  connections: { match: ['/connections'] },
  devices: { match: ['/devices'] },
  networks: { match: ['/networks'] },
  services: { match: ['/services'] },
  exits: { match: ['/exits'] },
  proxies: { match: ['/proxies'] },
  scripting: { match: ['/script', '/scripts', '/runs'] },
  apps: { match: ['/apps'] },
  products: { match: ['/products'] },
  organization: { match: ['/organization'] },
  partnerStats: { match: ['/partner-stats'] },
  logs: { match: ['/logs'], exact: true },
}

/* The items the classic sidebar (components/SidebarNav) shows, by the same gates, outside Remote UI. */
export function classicNavItems(g: NavGates): NavItemId[] {
  const items: NavItemId[] = []
  if (g.thisDevice) items.push('thisDevice')
  if (!g.mobile) items.push('connections', 'devices', 'networks')
  if (g.services) items.push('services')
  if (g.deviceSessions) items.push('exits', 'proxies')
  items.push('scripting', 'apps', 'products', 'organization')
  if (g.partner) items.push('partnerStats')
  items.push('logs')
  return items
}

export function navGroups(visible: NavItemId[]): NavGroup[] {
  return NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => visible.includes(item)) })).filter(
    group => group.items.length
  )
}

export function itemMatches(item: NavItemId, pathname: string): boolean {
  const { match, exact } = NAV_MATCH[item]
  return match.some(m => (exact ? pathname === m : pathname.startsWith(m)))
}

export function activeNavGroup(groups: NavGroup[], pathname: string): NavGroupId | undefined {
  return groups.find(group => group.items.some(item => itemMatches(item, pathname)))?.id
}

export const navGroupKey = (id: NavGroupId) => `navGroup-${id}`

export function navGroupOpen(
  group: NavGroup,
  signals: NavSignals,
  saved: ILookup<boolean>,
  active: boolean,
  collapsedHere: boolean
): boolean {
  if (!group.header) return true
  if (active) return !collapsedHere
  return saved[navGroupKey(group.id)] ?? group.defaultOpen(signals)
}
