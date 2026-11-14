import { describe, expect, it } from 'vitest'
import { getPanelWidthDefault } from './usePanelWidth'

describe('getPanelWidthDefault', () => {
  // A route with no default gives its left panel the whole width, and the right one is squeezed to its minimum.
  it('gives the Apps pages a left panel, so the app beside the catalogue has room', () => {
    expect(getPanelWidthDefault('apps')).toBe(420)
    expect(getPanelWidthDefault('apps')).toBeLessThan(9999)
  })

  it('falls back where a route names none', () => {
    expect(getPanelWidthDefault('nowhere', undefined, 250)).toBe(250)
  })
})
