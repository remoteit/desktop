/* The fleet view's vocabulary (graphql's fleet-versions resolver): its dimensions, what a version can be of, and the
   shapes it answers in — apart from the calls (graphQLFleetVersions.ts), so the page's helpers need no API client. */

export const FLEET_DIMENSIONS = [
  { key: 'packageType', label: 'Package type' },
  { key: 'os', label: 'OS' },
  { key: 'osVersion', label: 'OS version' },
  { key: 'arch', label: 'CPU arch' },
  { key: 'platform', label: 'Platform code' },
  { key: 'channel', label: 'Release channel' },
  { key: 'release', label: 'Release (candidate, current, pinned …)' },
  { key: 'managed', label: 'Managed' },
  { key: 'account', label: 'Account' },
  { key: 'product', label: 'Product' },
  { key: 'lastSeen', label: 'Last seen' },
] as const

export type FleetDimension = (typeof FLEET_DIMENSIONS)[number]['key']

export const VERSION_OF = [
  { key: 'connectd', label: 'connectd', help: 'What the daemon reports, else what its device type carries: every device has one' },
  { key: 'package', label: 'Package', help: 'The package it came in: none without a device session' },
  { key: 'desktop', label: 'Desktop app', help: 'Not recorded: the desktop app reports its version to nothing graphql keeps', disabled: true },
] as const

export type VersionOf = 'connectd' | 'package'

export const NONE = 'none'
export const OTHER = '~other'

export type FleetCount = { version: string; devices: number; online: number }
export type FleetColumn = FleetCount & { label?: string | null; behind?: number | null }
export type FleetRow = {
  key: string
  values: string[]
  label: string
  dimension: string
  depth: number
  parentKey?: string | null
  total: number
  online: number
  cells: FleetCount[]
}
export type FleetVersions = {
  checked: string
  groupBy: string[]
  versionOf: string
  columns: FleetColumn[]
  rows: FleetRow[]
  totals: { devices: number; online: number }
}

export type FleetDevice = {
  id: string
  name?: string | null
  version: string
  online: boolean
  lastSeen: string
  packageType: string
  package?: string | null
  connectd?: string | null
  os?: string | null
  arch?: string | null
  platform?: number | null
  accountId?: string | null
  account?: string | null
  release: string
  managed: string
}
export type FleetDevices = { checked: string; total: number; devices: FleetDevice[] }

export type FleetQuery = {
  groupBy: FleetDimension[]
  versionOf: VersionOf
  onlineOnly?: boolean
  accountSearch?: string
  accountLimit?: number
}
