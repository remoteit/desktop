import { describe, expect, it } from 'vitest'
import { productIntake, ProductOverview } from './productStatus'

const base: ProductOverview = { devices: 3, maxDevices: null, joinKeys: [], oneTimeCodes: [], registrationCode: false }
const now = new Date('2026-11-22T12:00:00Z')

describe('productIntake', () => {
  it('is closed with no key or code in force', () => {
    expect(productIntake(base, now)).toBe('closed')
    expect(productIntake({ ...base, joinKeys: [{ inForce: false }] }, now)).toBe('closed')
  })

  it('accepts with a join key in force, a reusable code or a live one-time code', () => {
    expect(productIntake({ ...base, joinKeys: [{ inForce: true }] }, now)).toBe('accepting')
    expect(productIntake({ ...base, registrationCode: true }, now)).toBe('accepting')
    expect(productIntake({ ...base, oneTimeCodes: [{ used: 0, expires: '2026-11-23T00:00:00Z' }] }, now)).toBe(
      'accepting'
    )
    expect(productIntake({ ...base, oneTimeCodes: [{ used: 1 }, { expires: '2026-11-21T00:00:00Z' }] }, now)).toBe(
      'closed'
    )
  })

  it('is full at its maximum of devices, whatever its keys', () => {
    expect(productIntake({ ...base, maxDevices: 3, joinKeys: [{ inForce: true }] }, now)).toBe('full')
    expect(productIntake({ ...base, maxDevices: 4, joinKeys: [{ inForce: true }] }, now)).toBe('accepting')
  })
})
