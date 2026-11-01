/* The fleet view's vocabulary (graphql's fleet-versions resolver): its dimensions, what a version can be of, and the
   shapes it answers in — apart from the calls (graphQLFleetVersions.ts), so the page's helpers need no API client. */

export const FLEET_DIMENSIONS = [
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

/* What a device is (graphql docs/DEVICE-TAXONOMY.md): which daemon, whether it has a Control Link, who shipped it in
   what format, what upgrades it, and what it supports. Each grouping is offered once the API serves its per-device
   field on FleetDevice (`field`), so a portal ahead of graphql offers only today's. Format rides with distribution:
   the format was always reported, and graphql groups by it from the same release. `feature` stands for
   `feature:<name>`, one grouping per feature. */
export const TAXONOMY_DIMENSIONS = [
  { key: 'implementation', label: 'Daemon', field: 'implementation' },
  { key: 'controlLink', label: 'Control Link', field: 'controlLink' },
  { key: 'distribution', label: 'Distribution', field: 'distribution' },
  { key: 'format', label: 'Package format', field: 'distribution' },
  { key: 'updatedBy', label: 'Updated by', field: 'updatedBy' },
  { key: 'feature', label: 'Feature', field: 'features' },
] as const

// The starting feature names (the build contract); a device may report others, which the picker offers too.
export const FEATURES = ['remote-upgrade', 'upgrade-window', 'transient-report', 'disable', 'decommission', 'exec', 'subnet']
export const FEATURE_PREFIX = 'feature:'

export type BaseDimension = (typeof FLEET_DIMENSIONS)[number]['key']
export type TaxonomyDimension = (typeof TAXONOMY_DIMENSIONS)[number]['key']
export type FleetDimension = BaseDimension | Exclude<TaxonomyDimension, 'feature'> | `feature:${string}`
// A grouping as the menus offer it: every feature is the one entry, `feature`.
export type DimensionChoice = { key: BaseDimension | TaxonomyDimension; label: string }

export const isFeature = (key?: string | null): key is `feature:${string}` => !!key?.startsWith(FEATURE_PREFIX)
export const featureOf = (key: string) => key.slice(FEATURE_PREFIX.length)

// The groupings this API serves: what a device is, by the FleetDevice fields it has, then the rest.
export function fleetDimensions(fields: ReadonlySet<string> = new Set()): DimensionChoice[] {
  const taxonomy = TAXONOMY_DIMENSIONS.filter(d => fields.has(d.field))
  return [...taxonomy.map(({ key, label }) => ({ key, label })), ...FLEET_DIMENSIONS]
}

// A grouping's heading: a feature's names the feature.
export const dimensionLabel = (key: string, dimensions: DimensionChoice[] = fleetDimensions()) =>
  isFeature(key)
    ? `Feature: ${featureOf(key)}`
    : dimensions.find(d => d.key === key)?.label ||
      [...TAXONOMY_DIMENSIONS, ...FLEET_DIMENSIONS].find(d => d.key === key)?.label ||
      key

export const VERSION_OF = [
  { key: 'connectd', label: 'connectd', help: 'What the daemon reports, else what its device type carries: every device has one' },
  { key: 'package', label: 'Package', help: 'The package it came in: none on a Classic device' },
  { key: 'desktop', label: 'Desktop app', help: 'Not recorded: the desktop app reports its version to nothing graphql keeps', disabled: true },
] as const

export type VersionOf = 'connectd' | 'package'

export const NONE = 'none'
export const OTHER = '~other'

export type FleetCount = { version: string; devices: number; online: number }
// implementation, majorMinor: where the API says them — a version's daemon (versions compare within one alone), and a
// classic C device's version being its device type's major.minor rather than a full version.
export type FleetColumn = FleetCount & {
  label?: string | null
  behind?: number | null
  implementation?: string | null
  majorMinor?: boolean | null
}
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
  package?: string | null
  connectd?: string | null
  os?: string | null
  arch?: string | null
  platform?: number | null
  accountId?: string | null
  account?: string | null
  release: string
  managed: string
  // What the device is, where the API serves it (graphql docs/DEVICE-TAXONOMY.md, the build contract).
  implementation?: string | null // go | c
  implementationSource?: string | null // report | controlLink | classic
  controlLink?: boolean | null
  features?: string[] | null
  featuresSource?: string | null // report | table
  distribution?: string | null
  format?: string | null
  updatedBy?: string | null
  updateState?: string | null // held: a package hold or lock its admin set
  connectdMajorMinor?: boolean | null // its connectd is a classic C device-type major.minor
}
export type FleetDevices = { checked: string; total: number; devices: FleetDevice[] }

/* Which devices a view counts by when they were last seen: online now, seen within 1, 7 or 30 days, or all. The Fleet
   tab and the Upgrades page share the choice; the days need the API to say (seenWithinDays on the fleet,
   offline age bands on the rollout counts), and are offered only where it does. */
export const SEEN_CHOICES = [
  { key: 'online', label: 'Online' },
  { key: '1', label: '1 day' },
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: 'all', label: 'All' },
] as const
export type SeenChoice = (typeof SEEN_CHOICES)[number]['key']
export const SEEN_DAYS = ['1', '7', '30'] as const
export const isSeenDays = (value: string): value is (typeof SEEN_DAYS)[number] => (SEEN_DAYS as readonly string[]).includes(value)
export const seenDays = (seen: SeenChoice) => (isSeenDays(seen) ? Number(seen) : undefined)
// "1 day", "7 days".
export const daysText = (days: string | number) => `${days} ${Number(days) === 1 ? 'day' : 'days'}`

export type FleetQuery = {
  groupBy: FleetDimension[]
  versionOf: VersionOf
  onlineOnly?: boolean
  seenWithinDays?: number // seen within the last N days: only where the API serves it
  accountSearch?: string
  accountLimit?: number
}

/* The names a customer and an admin see for what a device is (graphql docs/DEVICE-TAXONOMY.md, "UI names"). Values
   not listed show as the API gives them. "CloudShift" is the name of a repository, never of anything on screen. */
export const IMPLEMENTATION_NAMES: Record<string, string> = { go: 'Go', c: 'C' }
export const CONTROL_LINK = 'Control Link'
export const CLASSIC = 'Classic'
export const DISTRIBUTION_NAMES: Record<string, string> = {
  'remoteit-device': 'remote.it package',
  remoteit: 'remote.it package (classic)',
  'remoteit-cli': 'remote.it CLI',
  desktop: 'remote.it Desktop',
  none: 'no package',
  unknown: 'unknown',
}
export const FORMAT_NAMES: Record<string, string> = {
  tar: 'Linux tarball',
  deb: 'Debian package (.deb)',
  rpm: 'RPM package',
  apk: 'Alpine package (.apk)',
  ipk: 'OpenWrt package (.ipk)',
  pkg: 'macOS installer (.pkg)',
  msi: 'Windows installer (.msi)',
  zip: 'Windows (zip)',
  container: 'container image',
  none: 'no package (binary only)',
}
export const UPDATED_BY_NAMES: Record<string, string> = {
  remoteit: 'remote.it rollouts',
  'package-manager': 'package manager',
  image: 'container image',
  cli: 'remote.it CLI',
  desktop: 'remote.it Desktop',
  none: 'none',
  unknown: 'unknown',
}
export const HELD = "held by the device's admin"

const named = (names: Record<string, string>, value?: string | null) =>
  value == null ? undefined : names[value.trim().toLowerCase()]

export const implementationName = (value?: string | null) => named(IMPLEMENTATION_NAMES, value)
export const distributionName = (value?: string | null) => named(DISTRIBUTION_NAMES, value)
export const formatName = (value?: string | null) => named(FORMAT_NAMES, value)
export const updatedByName = (value?: string | null) => named(UPDATED_BY_NAMES, value)

const YES = ['true', 'yes', '1', 'supported', 'control link', 'controllink']
const NO = ['false', 'no', '0', 'unsupported', 'classic']
export const controlLinkName = (value?: string | boolean | null) => {
  const text = String(value ?? '').toLowerCase()
  return YES.includes(text) ? CONTROL_LINK : NO.includes(text) ? CLASSIC : undefined
}

// Text the API wrote for people, in today's words: "device session" leaves what anyone reads (DEVICE-TAXONOMY §6,
// stage 1), and "CloudShift" never reaches it.
export const userText = (text?: string | null) =>
  (text ?? '')
    .replace(/\bno device[ -]sessions?\b/gi, CLASSIC)
    .replace(/\bwithout a device[ -]session\b/gi, `on a ${CLASSIC} device`)
    .replace(/\bdevice[ -]sessions?\b/gi, CONTROL_LINK)
    .replace(/\bcloud ?shift( package)?/gi, DISTRIBUTION_NAMES.remoteit)

// Whether a device is moved by our rollouts, as graphql says it (`managed`, `managed: held`, `unmanaged: no package`,
// `unmanaged: updated by <x>`, `unmanaged: refused: …`, `unmanaged: classic`, `unknown: not reported yet`), in the
// names people see: what upgrades it by its UI name, a hold as the device's admin's, Classic as such.
export function managedText(value?: string | null): string {
  const text = (value ?? '').trim()
  if (/^managed:\s*held$/i.test(text)) return `managed: ${HELD}`
  const by = /^((?:unmanaged:\s*)?)updated by (.+)$/i.exec(text)
  if (by) return `${by[1]}updated by ${updatedByName(by[2]) ?? by[2]}`
  return userText(text.replace(/^unmanaged:\s*classic$/i, `unmanaged: ${CLASSIC}`))
}

// A row's own name: its value in the contract's words where the dimension is one of the taxonomy's, else the API's
// label in today's words.
export function rowName(row: { dimension: string; values: string[]; label: string }): string {
  const value = row.values[row.values.length - 1]
  if (value === OTHER) return userText(row.label)
  const lower = (value ?? '').toLowerCase()
  let name: string | undefined
  if (row.dimension === 'implementation') name = implementationName(value)
  else if (row.dimension === 'controlLink') name = controlLinkName(value)
  else if (row.dimension === 'distribution') name = distributionName(value)
  else if (row.dimension === 'format') name = formatName(value)
  else if (row.dimension === 'updatedBy') name = updatedByName(value)
  else if (isFeature(row.dimension)) {
    const feature = featureOf(row.dimension)
    name = YES.includes(lower) ? `supports ${feature}` : NO.includes(lower) ? `does not support ${feature}` : undefined
  } else if (row.dimension === 'managed') name = managedText(value)
  return name ?? userText(row.label)
}

// A version as the columns and the drill show it: its daemon beside it ("Go 5.6.1", "C 5.6"), never inside it; a
// classic C device's device-type major.minor marked as such; `unknown` as itself. The daemon is the API's
// `implementation` where it says it, else a "go"/"c" the version is keyed with; neither, the version as it is.
export type ShownVersion = { implementation?: 'go' | 'c'; version: string; majorMinor: boolean; unknown: boolean; text: string }
export function shownVersion(
  version: string,
  implementation?: string | null,
  majorMinor?: boolean | null
): ShownVersion {
  const keyed = /^(go|c)[\s:/_-]+(.+)$/i.exec(version)
  const impl = (implementation || keyed?.[1] || '').toLowerCase()
  const known = impl === 'go' || impl === 'c' ? (impl as 'go' | 'c') : undefined
  const bare = known && keyed ? keyed[2] : version
  const unknown = /^unknown\b/i.test(bare)
  const short = majorMinor ?? (known === 'c' && /^\d+\.\d+$/.test(bare))
  const shown = unknown ? 'unknown' : bare
  return {
    implementation: known,
    version: bare,
    majorMinor: !unknown && !!short,
    unknown,
    text: known ? `${IMPLEMENTATION_NAMES[known]} ${shown}` : shown,
  }
}
