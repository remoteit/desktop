import { describe, expect, it } from 'vitest'
import { platforms } from '.'

// A phone or tablet registers as what it is (graphql-api db/migrations/2026-10-11-tablet-platform-types.sql): each of
// the four is named for itself and drawn with its family's logo.
describe('mobile platform types', () => {
  it.each([
    [1213, 'Android Phone', 'android'],
    [1229, 'Android Tablet', 'android'],
    [1214, 'iPhone', 'ios'],
    [1230, 'iPad', 'ios'],
  ])('%i is "%s", drawn as %s', async (type, label, route) => {
    await platforms.initialize()
    expect(platforms.name(type)).toBe(label)
    expect(platforms.componentByType(type)).toBe(platforms.component(route))
    expect(platforms.component(route)).not.toBe(platforms.component('unknown'))
  })

  it('a page still starts its codes as the phone', () => {
    expect(platforms.findType('android')).toBe(1213)
    expect(platforms.findType('ios')).toBe(1214)
  })
})
