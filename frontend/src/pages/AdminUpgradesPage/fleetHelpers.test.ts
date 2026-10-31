import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CHOICES,
  behindShade,
  cellOf,
  isFleetView,
  matrixColumns,
  onlineTitle,
  readChoices,
  shownCount,
  writeChoices,
} from './fleetHelpers'

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
    const choices = { ...DEFAULT_CHOICES, group: 'account' as const, then: 'os' as const, online: true, percent: true, search: 'acme', older: true }
    const search = writeChoices(choices)
    expect(search).toBe('?view=fleet&group=account&then=os&online=1&pct=1&q=acme&older=1')
    expect(isFleetView(search)).toBe(true)
    expect(readChoices(search)).toEqual(choices)
    expect(writeChoices(DEFAULT_CHOICES)).toBe('?view=fleet&group=packageType')
    expect(readChoices(writeChoices({ ...DEFAULT_CHOICES, of: 'package' })).of).toBe('package')
  })

  it('anything unknown is the default; a second dimension like the first is none', () => {
    expect(readChoices('?view=fleet&group=color&then=packageType&of=desktop')).toEqual(DEFAULT_CHOICES)
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
