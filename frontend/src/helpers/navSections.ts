import type { TFunction } from 'i18next'
import { matchPath } from 'react-router-dom'

export type NavPageId =
  | 'thisDevice'
  | 'devices'
  | 'connections'
  | 'services'
  | 'networks'
  | 'exits'
  | 'publicAddresses'
  | 'proxies'
  | 'products'
  | 'scripting'
  | 'apps'
  | 'organization'
  | 'logs'
  | 'partnerStats'
  | 'connectAi'
  | 'agent'

export type NavSectionId = 'thisDevice' | 'devices' | 'network' | 'fleet' | 'team' | 'ai'

/* Each gate hides the pages that name it, as the sidebar always has. */
export type NavGates = {
  thisDevice: boolean
  services: boolean
  deviceSessions: boolean
  publicAddresses: boolean
  partner: boolean
  connectAi: boolean
  agent: boolean
}

export type NavSignals = { products?: number }

export type NavPage = {
  label: (t: TFunction) => string
  /* Where the sub-link goes; none for the agent, which opens the chat instead. */
  to?: string
  /* The first path segments that belong to this page. */
  segments: string[]
  /* Paths where this page's own list is all a single panel shows: the sub-links sit above it. */
  roots: string[]
  /* With two panels the left one is normally this list; on these paths it is an item's own page instead. */
  detail?: RegExp
  gate?: keyof NavGates
  /* The sub-link returns to the item last opened there. */
  remember?: boolean
}

/* label is a function so the i18n extractor sees each key with its English default. */
export const NAV_PAGES: Record<NavPageId, NavPage> = {
  thisDevice: {
    label: t => t('navSection.thisDevice', 'This device'),
    to: '/this-device',
    segments: ['this-device'],
    roots: [],
    gate: 'thisDevice',
  },
  devices: {
    label: t => t('nav.devices', 'Devices'),
    to: '/devices',
    segments: ['devices', 'add'],
    roots: ['/devices', '/devices/select'],
    detail: /^\/devices\/(?!transfer(\/|$))[^/]+/,
  },
  connections: {
    label: t => t('nav.connections', 'Connections'),
    to: '/connections',
    segments: ['connections'],
    roots: ['/connections'],
    remember: true,
  },
  services: {
    label: t => t('nav.services', 'Services'),
    to: '/services',
    segments: ['services'],
    roots: ['/services'],
    gate: 'services',
  },
  networks: {
    label: t => t('nav.networks', 'Networks'),
    to: '/networks',
    segments: ['networks'],
    roots: ['/networks'],
    remember: true,
  },
  exits: {
    label: t => t('nav.exits', 'Exits'),
    to: '/exits',
    segments: ['exits'],
    roots: ['/exits'],
    gate: 'deviceSessions',
  },
  publicAddresses: {
    label: t => t('navPage.publicAddresses', 'Public addresses'),
    to: '/public-addresses',
    segments: ['public-addresses'],
    roots: ['/public-addresses'],
    gate: 'publicAddresses',
  },
  proxies: {
    label: t => t('navPage.proxyServers', 'Proxy servers'),
    to: '/proxies',
    segments: ['proxies'],
    roots: ['/proxies'],
    gate: 'deviceSessions',
  },
  products: {
    label: t => t('nav.products', 'Products'),
    to: '/products',
    segments: ['products'],
    roots: ['/products', '/products/select'],
    detail: /^\/products\/(?!add(\/|$))[^/]+/,
  },
  scripting: {
    label: t => t('navPage.scripts', 'Scripts'),
    to: '/scripts',
    segments: ['scripts', 'script', 'runs', 'run', 'files', 'file'],
    roots: ['/scripts', '/files', '/runs', '/runs/:fileID'],
    detail: /^\/script\/[^/]+/,
    remember: true,
  },
  apps: {
    label: t => t('nav.apps', 'Apps'),
    to: '/apps',
    segments: ['apps'],
    roots: ['/apps'],
  },
  organization: {
    label: t => t('nav.organization', 'Organization'),
    to: '/organization',
    segments: ['organization', 'organization-empty'],
    roots: ['/organization', '/organization-empty'],
  },
  logs: {
    label: t => t('nav.logs', 'Logs'),
    to: '/logs',
    segments: ['logs'],
    roots: ['/logs'],
  },
  partnerStats: {
    label: t => t('navPage.partnerStats', 'Partner stats'),
    to: '/partner-stats',
    segments: ['partner-stats'],
    roots: ['/partner-stats'],
    gate: 'partner',
  },
  connectAi: {
    label: t => t('nav.connectAi', 'Connect AI'),
    to: '/connect-ai',
    segments: ['connect-ai'],
    roots: ['/connect-ai'],
    gate: 'connectAi',
  },
  agent: {
    label: t => t('nav.agent', 'Agent'),
    segments: [],
    roots: [],
    gate: 'agent',
  },
}

export type NavSection = {
  id: NavSectionId
  label: (t: TFunction) => string
  icon: string
  pages: NavPageId[]
  landing?: (pages: NavPageId[], signals: NavSignals) => NavPageId
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'thisDevice', label: t => t('navSection.thisDevice', 'This device'), icon: 'laptop', pages: ['thisDevice'] },
  {
    id: 'devices',
    label: t => t('navSection.devices', 'Devices'),
    icon: 'router',
    pages: ['devices', 'connections', 'services'],
  },
  {
    id: 'network',
    label: t => t('navSection.network', 'Network'),
    icon: 'chart-network',
    pages: ['networks', 'exits', 'publicAddresses', 'proxies'],
  },
  {
    id: 'fleet',
    label: t => t('navSection.fleet', 'Fleet'),
    icon: 'conveyor-belt-boxes',
    pages: ['products', 'scripting', 'apps'],
    landing: (pages, signals) => (signals.products || !pages.includes('scripting') ? pages[0] : 'scripting'),
  },
  {
    id: 'team',
    label: t => t('navSection.team', 'Team'),
    icon: 'industry-alt',
    pages: ['organization', 'logs', 'partnerStats'],
  },
  { id: 'ai', label: t => t('navSection.ai', 'AI'), icon: 'remote-ai', pages: ['connectAi', 'agent'] },
]

export type VisibleSection = NavSection & { pages: NavPageId[] }

export function navSections(gates: NavGates): VisibleSection[] {
  return NAV_SECTIONS.map(section => ({
    ...section,
    pages: section.pages.filter(id => {
      const gate = NAV_PAGES[id].gate
      return !gate || gates[gate]
    }),
  })).filter(section => section.pages.length)
}

export function sectionLanding(section: VisibleSection, signals: NavSignals, last?: NavPageId): NavPageId {
  if (last && section.pages.includes(last) && NAV_PAGES[last].to) return last
  return section.landing ? section.landing(section.pages, signals) : section.pages[0]
}

const firstSegment = (pathname: string) => pathname.split('/')[1] || ''

export function navPageAt(sections: VisibleSection[], pathname: string): NavPageId | undefined {
  const segment = firstSegment(pathname)
  for (const section of sections)
    for (const page of section.pages) if (NAV_PAGES[page].segments.includes(segment)) return page
}

export function navSectionAt(sections: VisibleSection[], pathname: string): VisibleSection | undefined {
  const page = navPageAt(sections, pathname)
  return page && sections.find(section => section.pages.includes(page))
}

/* The route patterns that select a section in the sidebar. */
export const sectionMatch = (section: VisibleSection): string[] =>
  section.pages.flatMap(page => NAV_PAGES[page].segments.map(segment => `/${segment}`))

/* Whether the left panel shows the page's own list, which the sub-links head. panels: as the layout renders them. */
export function subNavShown(page: NavPageId, pathname: string, panels: number): boolean {
  const { roots, detail } = NAV_PAGES[page]
  if (panels === 1) return roots.some(path => !!matchPath(pathname, { path, exact: true }))
  if (panels === 2) return !detail?.test(pathname)
  return true
}
