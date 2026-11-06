import { beforeAll, describe, expect, it } from 'vitest'
import { platforms } from '.'

// Every platform module, loaded once before the cases: under a full run vitest 5's module runner can take longer than a
// test's 5 s default to import them all, and a case that timed out mid-import left the next reading half-loaded modules.
beforeAll(() => platforms.initialize(), 30_000)

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
