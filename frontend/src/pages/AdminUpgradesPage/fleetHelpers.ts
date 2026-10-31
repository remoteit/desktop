import {
  FLEET_DIMENSIONS,
  FleetColumn,
  FleetCount,
  FleetDimension,
  FleetRow,
  NONE,
  VersionOf,
} from '../../services/fleetVersionsModel'

// The Fleet tab's view, as the URL holds it, so a view can be shared: ?view=fleet&group=…&then=…&of=…&online=1&pct=1&q=…
export const FLEET_VIEW = 'fleet'

export type FleetChoices = {
  group: FleetDimension
  then?: FleetDimension
  of: VersionOf
  online: boolean
  percent: boolean
  search: string
  older: boolean // the older versions shown one by one
}

export const DEFAULT_CHOICES: FleetChoices = {
  group: 'packageType',
  of: 'connectd',
  online: false,
  percent: false,
  search: '',
  older: false,
}

const dimension = (value: string | null): FleetDimension | undefined =>
  FLEET_DIMENSIONS.find(d => d.key === value)?.key

export const isFleetView = (search: string) => new URLSearchParams(search).get('view') === FLEET_VIEW

export function readChoices(search: string): FleetChoices {
  const params = new URLSearchParams(search)
  const group = dimension(params.get('group')) || DEFAULT_CHOICES.group
  const then = dimension(params.get('then'))
  return {
    group,
    then: then && then !== group ? then : undefined,
    of: params.get('of') === 'package' ? 'package' : 'connectd',
    online: params.get('online') === '1',
    percent: params.get('pct') === '1',
    search: params.get('q') || '',
    older: params.get('older') === '1',
  }
}

export function writeChoices(choices: FleetChoices): string {
  const params = new URLSearchParams({ view: FLEET_VIEW, group: choices.group })
  if (choices.then) params.set('then', choices.then)
  if (choices.of !== DEFAULT_CHOICES.of) params.set('of', choices.of)
  if (choices.online) params.set('online', '1')
  if (choices.percent) params.set('pct', '1')
  if (choices.search.trim()) params.set('q', choices.search.trim())
  if (choices.older) params.set('older', '1')
  return `?${params.toString()}`
}

export const groupByOf = (choices: FleetChoices): FleetDimension[] =>
  choices.then ? [choices.group, choices.then] : [choices.group]

// The newest few versions get columns of their own; the rest fold into one "older" column. `none` stays apart, last.
export const OWN_COLUMNS = 6

export type MatrixColumn =
  | { kind: 'version'; key: string; column: FleetColumn }
  | { kind: 'older'; key: 'older'; versions: string[]; devices: number; online: number; behind: number | null }
  | { kind: 'none'; key: typeof NONE; column: FleetColumn }

export function matrixColumns(columns: FleetColumn[], expandOlder: boolean): MatrixColumn[] {
  const versions = columns.filter(c => c.version !== NONE)
  const none = columns.find(c => c.version === NONE)
  const own = expandOlder || versions.length <= OWN_COLUMNS + 1 ? versions : versions.slice(0, OWN_COLUMNS)
  const folded = versions.slice(own.length)
  const out: MatrixColumn[] = own.map(column => ({ kind: 'version', key: column.version, column }))
  if (folded.length) {
    const behinds = folded.map(c => c.behind).filter((b): b is number => typeof b === 'number')
    out.push({
      kind: 'older',
      key: 'older',
      versions: folded.map(c => c.version),
      devices: folded.reduce((sum, c) => sum + c.devices, 0),
      online: folded.reduce((sum, c) => sum + c.online, 0),
      // As far behind as its newest: the fold is at least that old.
      behind: behinds.length ? Math.min(...behinds) : null,
    })
  }
  if (none) out.push({ kind: 'none', key: NONE, column: none })
  return out
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
