import {
  DimensionChoice,
  FEATURES,
  FEATURE_PREFIX,
  FleetColumn,
  FleetCount,
  FleetDimension,
  FleetRow,
  IMPLEMENTATION_NAMES,
  NONE,
  SeenChoice,
  VersionOf,
  featureOf,
  fleetDimensions,
  isFeature,
  shownVersion,
} from '../../services/fleetVersionsModel'

// The Fleet tab's view, as the URL holds it, so a view can be shared: ?view=fleet&group=…&then=…&of=…&online=0&pct=1&q=…
// Online only unless the URL says otherwise: seen=7 or seen=30 (where the API counts by days since seen; otherwise
// online), or all (online=0, online=all, or seen=all). A link from before that said online=1 still reads so.
export const FLEET_VIEW = 'fleet'

export type FleetChoices = {
  group: FleetDimension
  then?: FleetDimension
  of: VersionOf
  show: SeenChoice
  percent: boolean
  search: string
  older: boolean // the older versions shown one by one
}

export const DEFAULT_CHOICES: FleetChoices = {
  group: 'implementation',
  then: 'controlLink',
  of: 'connectd',
  show: 'online',
  percent: false,
  search: '',
  older: false,
}

// Which devices the URL says to count; 7 and 30 days only where the API counts by them.
function readSeen(params: URLSearchParams, seenServed: boolean): SeenChoice {
  const seen = (params.get('seen') || '').toLowerCase()
  if (seen === 'all' || ['0', 'all', 'false'].includes((params.get('online') || '').toLowerCase())) return 'all'
  if ((seen === '7' || seen === '30') && seenServed) return seen
  return 'online'
}

// What a view is grouped by unless the URL says (an old link's package type included): by daemon, then by Control
// Link. An API without them — from before graphql served what a device is — by OS.
export const FALLBACK_GROUP: FleetDimension = 'os'
export function defaultGrouping(dimensions: DimensionChoice[] = fleetDimensions()): Pick<FleetChoices, 'group' | 'then'> {
  const has = (key: string) => dimensions.some(d => d.key === key)
  if (has('implementation')) return { group: 'implementation', then: has('controlLink') ? 'controlLink' : undefined }
  return { group: FALLBACK_GROUP, then: undefined }
}

export const DEFAULT_FEATURE = FEATURES[0]
const FEATURE_NAME = /^[a-z0-9][a-z0-9._-]{0,47}$/i

// A grouping the URL names, if this API serves it: a feature's by its name.
const dimension = (value: string | null, dimensions: DimensionChoice[]): FleetDimension | undefined => {
  if (isFeature(value))
    return dimensions.some(d => d.key === 'feature') && FEATURE_NAME.test(featureOf(value)) ? value : undefined
  return dimensions.find(d => d.key === value && d.key !== 'feature')?.key as FleetDimension | undefined
}

// The menu entry a grouping is under: every feature's is Feature.
export const choiceOf = (key?: FleetDimension) => (isFeature(key) ? 'feature' : key || '')
export const featureDimension = (name = DEFAULT_FEATURE): FleetDimension => `${FEATURE_PREFIX}${name}`

export const isFleetView = (search: string) => new URLSearchParams(search).get('view') === FLEET_VIEW

export function readChoices(
  search: string,
  dimensions: DimensionChoice[] = fleetDimensions(),
  seenServed = false
): FleetChoices {
  const params = new URLSearchParams(search)
  const named = dimension(params.get('group'), dimensions)
  const fallback = defaultGrouping(dimensions)
  const group = named || fallback.group
  const then = named ? dimension(params.get('then'), dimensions) : fallback.then
  return {
    group,
    then: then && then !== group ? then : undefined,
    of: params.get('of') === 'package' ? 'package' : 'connectd',
    show: readSeen(params, seenServed),
    percent: params.get('pct') === '1',
    search: params.get('q') || '',
    older: params.get('older') === '1',
  }
}

export function writeChoices(choices: FleetChoices): string {
  const params = new URLSearchParams({ view: FLEET_VIEW, group: choices.group })
  if (choices.then) params.set('then', choices.then)
  if (choices.of !== DEFAULT_CHOICES.of) params.set('of', choices.of)
  if (choices.show === 'all') params.set('online', '0')
  if (choices.show === '7' || choices.show === '30') params.set('seen', choices.show)
  if (choices.percent) params.set('pct', '1')
  if (choices.search.trim()) params.set('q', choices.search.trim())
  if (choices.older) params.set('older', '1')
  return `?${params.toString()}`
}

export const groupByOf = (choices: FleetChoices): FleetDimension[] =>
  choices.then ? [choices.group, choices.then] : [choices.group]

// The newest few versions get columns of their own; the rest fold into one "older" column. `none` stays apart, last.
// Versions compare only within one daemon (DEVICE-TAXONOMY §1): where the API names each version's daemon, each has
// its own newest columns and its own fold, in the order the API gives them (Go's, then C's). Each daemon's `unknown`
// is a column of its own, never folded, last of its daemon's.
export const OWN_COLUMNS = 6

type Implementation = 'go' | 'c' | undefined

export type MatrixColumn =
  | { kind: 'version'; key: string; column: FleetColumn; implementation?: Implementation }
  | {
      kind: 'older'
      key: string
      versions: string[]
      devices: number
      online: number
      behind: number | null
      implementation?: Implementation
    }
  | { kind: 'unknown'; key: string; column: FleetColumn; implementation?: Implementation }
  | { kind: 'none'; key: typeof NONE; column: FleetColumn }

const shownOf = (column: FleetColumn) => shownVersion(column.version, column.implementation, column.majorMinor)

export function matrixColumns(columns: FleetColumn[], expandOlder: boolean): MatrixColumn[] {
  const none = columns.find(c => c.version === NONE)
  const byDaemon = new Map<Implementation, FleetColumn[]>()
  for (const column of columns.filter(c => c.version !== NONE)) {
    const implementation = shownOf(column).implementation
    byDaemon.set(implementation, [...(byDaemon.get(implementation) || []), column])
  }
  const out: MatrixColumn[] = []
  for (const [implementation, own] of byDaemon) {
    out.push(...daemonColumns(own.filter(c => !shownOf(c).unknown), expandOlder, implementation))
    for (const column of own.filter(c => shownOf(c).unknown))
      out.push({ kind: 'unknown', key: column.version, column, implementation })
  }
  if (none) out.push({ kind: 'none', key: NONE, column: none })
  return out
}

function daemonColumns(versions: FleetColumn[], expandOlder: boolean, implementation: Implementation): MatrixColumn[] {
  const own = expandOlder || versions.length <= OWN_COLUMNS + 1 ? versions : versions.slice(0, OWN_COLUMNS)
  const folded = versions.slice(own.length)
  const out: MatrixColumn[] = own.map(column => ({ kind: 'version', key: column.version, column, implementation }))
  if (folded.length) {
    const behinds = folded.map(c => c.behind).filter((b): b is number => typeof b === 'number')
    out.push({
      kind: 'older',
      key: implementation ? `older:${implementation}` : 'older',
      versions: folded.map(c => c.version),
      devices: folded.reduce((sum, c) => sum + c.devices, 0),
      online: folded.reduce((sum, c) => sum + c.online, 0),
      // As far behind as its newest: the fold is at least that old.
      behind: behinds.length ? Math.min(...behinds) : null,
      implementation,
    })
  }
  return out
}

// A column's heading: the version beside its daemon, the fold with its count.
export function columnHeading(column: MatrixColumn): { text: string; majorMinor: boolean } {
  if (column.kind === 'none') return { text: 'none', majorMinor: false }
  if (column.kind === 'older') {
    const daemon = column.implementation ? `${IMPLEMENTATION_NAMES[column.implementation]} ` : ''
    return { text: `${daemon}older (${column.versions.length})`, majorMinor: false }
  }
  const shown = shownOf(column.column)
  return { text: shown.text, majorMinor: shown.majorMinor }
}

// A row's count under a column: a version's, the fold's sum, none's.
export function cellOf(row: Pick<FleetRow, 'cells'>, column: MatrixColumn): FleetCount {
  const versions = column.kind === 'older' ? column.versions : [column.key]
  const cells = row.cells.filter(c => versions.includes(c.version))
  return {
    version: column.key,
    devices: cells.reduce((sum, c) => sum + c.devices, 0),
    online: cells.reduce((sum, c) => sum + c.online, 0),
  }
}

export const versionsOf = (column: MatrixColumn) => (column.kind === 'older' ? column.versions : [column.key])

// Amber, darker the further a version is behind the current release: none for current and newer.
export function behindShade(behind?: number | null): string | undefined {
  if (!behind || behind < 1) return undefined
  const alpha = Math.min(0.12 + (behind - 1) * 0.1, 0.62)
  return `rgba(237,153,18,${alpha.toFixed(2)})`
}

export const shownCount = (count: number, total: number, percent: boolean) =>
  percent ? (total ? `${(Math.round((count / total) * 1000) / 10).toLocaleString()}%` : '—') : count.toLocaleString()

export const onlineTitle = (count: { devices: number; online: number }) =>
  `${count.online.toLocaleString()} online · ${(count.devices - count.online).toLocaleString()} offline`
