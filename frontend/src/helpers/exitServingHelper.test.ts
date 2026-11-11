import { describe, it, expect } from 'vitest'
import { servingLine } from './exitServingHelper'

const t = (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')

describe('an exit’s devices in words', () => {
  it('how many run it, carrying its traffic', () => {
    expect(servingLine(t, null)).toBeNull()
    expect(servingLine(t, undefined)).toBeNull()
    expect(servingLine(t, { devices: 1, carrying: 1, healthy: 1, draining: 0 })).toBe('1 device')
    expect(servingLine(t, { devices: 3, carrying: 3, healthy: 3, draining: 0 })).toBe('3 devices')
    expect(servingLine(t, { devices: 3, carrying: 2, healthy: 2, draining: 0 })).toBe('2 of 3 devices carrying traffic')
    expect(servingLine(t, { devices: 2, carrying: 0, healthy: 0, draining: 0 })).toBe('No device carrying its traffic')
  })

  it('those judged unhealthy, and those draining, said after', () => {
    expect(servingLine(t, { devices: 2, carrying: 2, healthy: 1, draining: 0 })).toBe('2 devices · 1 unhealthy')
    expect(servingLine(t, { devices: 2, carrying: 2, healthy: 1, draining: 1 })).toBe('2 devices · 1 draining')
    expect(servingLine(t, { devices: 4, carrying: 3, healthy: 1, draining: 1 })).toBe(
      '3 of 4 devices carrying traffic · 1 unhealthy · 1 draining'
    )
  })
})
