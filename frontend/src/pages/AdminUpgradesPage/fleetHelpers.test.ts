import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CHOICES,
  behindShade,
  cellOf,
  columnHeading,
  defaultGrouping,
  isFleetView,
  matrixColumns,
  onlineTitle,
  readChoices,
  shownCount,
  writeChoices,
} from './fleetHelpers'
// What a device is (graphql docs/DEVICE-TAXONOMY.md): offered once the API serves its fields.
const TAXONOMY = new Set(['implementation', 'controlLink', 'distribution', 'updatedBy', 'features'])
import { fleetDimensions, rowName, shownVersion, userText } from '../../services/fleetVersionsModel'

// The Fleet tab's helpers: its choices in the URL, the newest versions in columns of their own and the rest folded,
// amber for the older, and a cell as a count or a share of its row.

const column = (version: string, devices: number, behind: number | null = null, label: string | null = null) => ({
  version,
  devices,
  online: Math.floor(devices / 2),
  behind,
  label,
})

describe('the choices in the URL', () => {
  it('read back as written, the defaults left out', () => {
    const choices = { ...DEFAULT_CHOICES, group: 'account' as const, then: 'os' as const, show: 'all' as const, percent: true, search: 'acme', older: true }
    const search = writeChoices(choices)
    expect(search).toBe('?view=fleet&group=account&then=os&online=0&pct=1&q=acme&older=1')
    expect(isFleetView(search)).toBe(true)
    expect(readChoices(search)).toEqual(choices)
    expect(writeChoices(DEFAULT_CHOICES)).toBe('?view=fleet&group=implementation&then=controlLink')
    expect(readChoices(writeChoices({ ...DEFAULT_CHOICES, of: 'package' })).of).toBe('package')
  })

  it('online only unless the URL says all: online=0 or online=all; online=1 as before', () => {
    expect(DEFAULT_CHOICES.show).toBe('online')
    expect(readChoices('?view=fleet').show).toBe('online')
    expect(readChoices('?view=fleet&online=1').show).toBe('online')
    expect(readChoices('?view=fleet&online=0').show).toBe('all')
    expect(readChoices('?view=fleet&online=all').show).toBe('all')
    expect(readChoices('?view=fleet&seen=all').show).toBe('all')
    expect(writeChoices(DEFAULT_CHOICES)).not.toContain('online')
  })

  it('seen=7 and seen=30 where the API counts by days since seen, else online', () => {
    const dimensions = fleetDimensions(TAXONOMY)
    expect(readChoices('?view=fleet&seen=7', dimensions, true).show).toBe('7')
    expect(readChoices('?view=fleet&seen=30', dimensions, true).show).toBe('30')
    expect(readChoices('?view=fleet&seen=30', dimensions, false).show).toBe('online')
    expect(readChoices('?view=fleet&seen=12', dimensions, true).show).toBe('online')
    const days = { ...DEFAULT_CHOICES, show: '30' as const }
    expect(writeChoices(days)).toBe('?view=fleet&group=implementation&then=controlLink&seen=30')
    expect(readChoices(writeChoices(days), dimensions, true)).toEqual(days)
  })

  it('anything unknown is the default; a second dimension like the first is none', () => {
    expect(readChoices('?view=fleet&group=color&then=os&of=desktop', fleetDimensions(TAXONOMY))).toEqual(DEFAULT_CHOICES)
    expect(isFleetView('?group=os')).toBe(false)
  })
})

describe('the columns', () => {
  const columns = [
    column('5.9', 10, null, 'candidate'),
    column('5.8', 20, null, 'current'),
    ...Array.from({ length: 7 }, (_, i) => column(`5.${7 - i}`, i + 1, i + 1)),
    column('none', 4, null, 'none'),
  ]

  it('the newest six their own, the rest folded into older, none last', () => {
    const shown = matrixColumns(columns, false)
    expect(shown.map(c => c.key)).toEqual(['5.9', '5.8', '5.7', '5.6', '5.5', '5.4', 'older', 'none'])
    const older = shown[6] as any
    expect(older.versions).toEqual(['5.3', '5.2', '5.1'])
    expect(older.devices).toBe(5 + 6 + 7)
    expect(older.behind).toBe(5)
    expect(matrixColumns(columns, true).map(c => c.key)).toHaveLength(10)
  })

  it('no fold for one version over', () => {
    expect(matrixColumns(columns.slice(0, 7), false).map(c => c.kind)).toEqual(Array(7).fill('version'))
  })

  it("a row's count under a fold is its versions' sum", () => {
    const row = { cells: [column('5.3', 2), column('5.1', 3), column('5.9', 1)] }
    const older = matrixColumns(columns, false)[6]
    expect(cellOf(row, older)).toEqual({ version: 'older', devices: 5, online: 2 })
    expect(cellOf(row, matrixColumns(columns, false)[3])).toEqual({ version: '5.6', devices: 0, online: 0 })
  })

  it('amber, darker the further behind', () => {
    expect(behindShade(null)).toBeUndefined()
    expect(behindShade(0)).toBeUndefined()
    const alpha = (behind: number) => Number(behindShade(behind)!.match(/,([\d.]+)\)$/)![1])
    expect(alpha(1)).toBeLessThan(alpha(2))
    expect(alpha(2)).toBeLessThan(alpha(4))
    expect(alpha(40)).toBe(0.62)
  })
})

describe('a cell', () => {
  it('a count, or a share of its row', () => {
    expect(shownCount(1234, 5000, false)).toBe((1234).toLocaleString())
    expect(shownCount(1, 3, true)).toBe('33.3%')
    expect(shownCount(0, 0, true)).toBe('—')
    expect(onlineTitle({ devices: 10, online: 7 })).toBe('7 online · 3 offline')
  })
})

// What a device is (graphql docs/DEVICE-TAXONOMY.md): offered once the API serves its fields, in the contract's names.

describe('the groupings this API serves', () => {
  it("today's alone until graphql serves the taxonomy, grouped by OS; no package type, ever", () => {
    const today = fleetDimensions(new Set(['id']))
    expect(today.map(d => d.key)).not.toContain('implementation')
    expect(today.map(d => d.key as string)).not.toContain('packageType')
    expect(defaultGrouping(today)).toEqual({ group: 'os', then: undefined })
    expect(readChoices('?view=fleet&group=implementation', today).group).toBe('os')
    expect(readChoices('?view=fleet&group=feature:subnet', today).group).toBe('os')
    expect(readChoices('?view=fleet&group=packageType', today).group).toBe('os')
  })

  it('then the taxonomy first, in the names the contract gives', () => {
    const dimensions = fleetDimensions(new Set([...TAXONOMY, 'packageType']))
    expect(dimensions.slice(0, 6).map(d => d.label)).toEqual([
      'Daemon',
      'Control Link',
      'Distribution',
      'Package format',
      'Updated by',
      'Feature',
    ])
    expect(dimensions.map(d => d.key as string)).not.toContain('packageType')
    expect(dimensions.map(d => d.label)).not.toContain('Package type (old)')
  })

  it('by daemon, then by Control Link, unless the URL says', () => {
    const dimensions = fleetDimensions(TAXONOMY)
    expect(readChoices('?view=fleet', dimensions)).toMatchObject({ group: 'implementation', then: 'controlLink' })
    expect(readChoices('?view=fleet&group=os', dimensions)).toMatchObject({ group: 'os', then: undefined })
    // A link from before: the retired package type falls back to the default grouping.
    expect(readChoices('?view=fleet&group=packageType', dimensions)).toMatchObject({ group: 'implementation', then: 'controlLink' })
    expect(readChoices('?view=fleet&group=packageType&then=os', dimensions)).toMatchObject({ group: 'implementation', then: 'controlLink' })
    expect(readChoices('?view=fleet&group=os&then=packageType', dimensions)).toMatchObject({ group: 'os', then: undefined })
  })

  it('a feature grouping by its name, read back as written', () => {
    const dimensions = fleetDimensions(TAXONOMY)
    const choices = readChoices('?view=fleet&group=feature:subnet&then=feature:exec', dimensions)
    expect(choices).toMatchObject({ group: 'feature:subnet', then: 'feature:exec' })
    expect(readChoices(writeChoices(choices), dimensions)).toEqual(choices)
    expect(readChoices('?view=fleet&group=feature:', dimensions).group).toBe('implementation')
    expect(readChoices('?view=fleet&group=feature', dimensions).group).toBe('implementation')
  })
})

describe('versions by daemon', () => {
  const daemon = (version: string, implementation: string, behind: number | null = null) => ({
    ...column(version, 1, behind),
    implementation,
  })

  it('beside the daemon, never inside it; C major.minor marked; unknown as itself', () => {
    expect(shownVersion('5.6.1', 'go')).toMatchObject({ text: 'Go 5.6.1', majorMinor: false })
    expect(shownVersion('c 5.6')).toMatchObject({ implementation: 'c', version: '5.6', text: 'C 5.6', majorMinor: true })
    expect(shownVersion('c:5.7.0')).toMatchObject({ text: 'C 5.7.0', majorMinor: false })
    expect(shownVersion('5.6', 'c', false).majorMinor).toBe(false)
    expect(shownVersion('unknown')).toMatchObject({ text: 'unknown', unknown: true, majorMinor: false })
    expect(shownVersion('go unknown')).toMatchObject({ text: 'Go unknown', unknown: true })
    // graphql's keys, its implementation beside them.
    expect(shownVersion('Go 5.6.1.1761000000', 'go', false)).toMatchObject({ text: 'Go 5.6.1.1761000000', majorMinor: false })
    expect(shownVersion('C 5.6', 'c', true)).toMatchObject({ text: 'C 5.6', majorMinor: true })
    expect(shownVersion('C unknown', 'c', false)).toMatchObject({ text: 'C unknown', unknown: true, majorMinor: false })
    expect(shownVersion('none', null, false)).toMatchObject({ text: 'none', implementation: undefined })
    // No daemon named: the version as it is, as before.
    expect(shownVersion('1.1.0.9')).toMatchObject({ text: '1.1.0.9', implementation: undefined, majorMinor: false })
    expect(shownVersion('5.6')).toMatchObject({ text: '5.6', majorMinor: false })
  })

  it("each daemon its own newest columns and its own fold, its unknown last of its own; none last of all", () => {
    const columns = [
      ...Array.from({ length: 9 }, (_, i) => daemon(`go 5.${9 - i}`, 'go', i > 1 ? i - 1 : null)),
      daemon('Go unknown', 'go'),
      daemon('c 5.6', 'c'),
      daemon('c 5.5', 'c'),
      daemon('C unknown', 'c'),
      column('none', 4, null, 'none'),
    ]
    const shown = matrixColumns(columns, false)
    expect(shown.map(c => c.key)).toEqual([
      'go 5.9',
      'go 5.8',
      'go 5.7',
      'go 5.6',
      'go 5.5',
      'go 5.4',
      'older:go',
      'Go unknown',
      'c 5.6',
      'c 5.5',
      'C unknown',
      'none',
    ])
    expect(columnHeading(shown[6])).toEqual({ text: 'Go older (3)', majorMinor: false })
    expect(columnHeading(shown[7]).text).toBe('Go unknown')
    expect(columnHeading(shown[8])).toEqual({ text: 'C 5.6', majorMinor: true })
    expect(columnHeading(shown[10]).text).toBe('C unknown')
    expect(matrixColumns(columns, true).filter(c => c.kind === 'older')).toHaveLength(0)
  })
})

describe('names on screen', () => {
  const row = (dimension: string, value: string, label = value) => ({ dimension, values: [value], label })

  it("each value in the contract's names", () => {
    expect(rowName(row('implementation', 'go'))).toBe('Go')
    expect(rowName(row('controlLink', 'false'))).toBe('Classic')
    expect(rowName(row('distribution', 'remoteit'))).toBe('remote.it package (classic)')
    expect(rowName(row('distribution', 'remoteit-device'))).toBe('remote.it package')
    expect(rowName(row('distribution', 'remoteit-cli'))).toBe('remote.it CLI')
    expect(rowName(row('distribution', 'desktop'))).toBe('remote.it Desktop')
    expect(rowName(row('distribution', 'none'))).toBe('no package')
    expect(rowName(row('format', 'ipk'))).toBe('OpenWrt package (.ipk)')
    expect(rowName(row('updatedBy', 'remoteit'))).toBe('remote.it rollouts')
    expect(rowName(row('updatedBy', 'package-manager'))).toBe('package manager')
    expect(rowName(row('updatedBy', 'image'))).toBe('container image')
    expect(rowName(row('feature:exec', 'yes'))).toBe('supports exec')
    expect(rowName(row('feature:exec', 'no'))).toBe('does not support exec')
    expect(rowName(row('controlLink', 'true'))).toBe('Control Link')
    expect(rowName(row('updatedBy', 'unknown'))).toBe('unknown')
    expect(rowName(row('managed', 'managed'))).toBe('managed')
    expect(rowName(row('managed', 'managed: held'))).toBe("managed: held by the device's admin")
    expect(rowName(row('managed', 'unmanaged: updated by package-manager'))).toBe('unmanaged: updated by package manager')
    expect(rowName(row('managed', 'unmanaged: updated by image'))).toBe('unmanaged: updated by container image')
    expect(rowName(row('managed', 'unmanaged: classic'))).toBe('unmanaged: Classic')
    expect(rowName(row('managed', 'unmanaged: no package'))).toBe('unmanaged: no package')
    expect(rowName(row('managed', 'unmanaged: refused: this device does not take updates'))).toBe(
      'unmanaged: refused: this device does not take updates'
    )
    expect(rowName(row('managed', 'unknown: not reported yet'))).toBe('unknown: not reported yet')
    expect(rowName(row('distribution', 'unknown'))).toBe('unknown')
    expect(rowName(row('os', 'Debian GNU/Linux 12'))).toBe('Debian GNU/Linux 12')
  })

  it('no device session, and no CloudShift, whatever the API wrote', () => {
    expect(userText('connectd, no device session')).toBe('connectd, Classic')
    expect(userText('unmanaged: no device session')).toBe('unmanaged: Classic')
    expect(userText('none without a device session')).toBe('none on a Classic device')
    expect(userText('Device sessions')).toBe('Control Link')
    expect(userText('CloudShift package')).toBe('remote.it package (classic)')
    expect(rowName(row('distribution', 'weird', 'cloudshift oem'))).toBe('remote.it package (classic) oem')
  })
})
