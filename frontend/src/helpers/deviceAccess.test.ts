import { describe, it, expect } from 'vitest'
import { accessBlocked, accessDormant, accessLevel, accessSteps } from './deviceAccess'

const ME = 'me@example.com'
const OTHER = 'other@example.com'

describe('accessLevel: read from the subnet setting and user mode', () => {
  it.each([
    [{ subnet: false, actsFor: null }, 'off'],
    [{ subnet: true, actsFor: null }, 'networks'],
    [{ subnet: true, actsFor: ME }, 'full'],
    [{ subnet: true, actsFor: OTHER }, 'full'],
    [{ subnet: false, actsFor: ME }, 'off'],
  ])('%o reads %s', (reading, level) => {
    expect(accessLevel(reading)).toBe(level)
  })

  it('user mode with the subnet off is dormant', () => {
    expect(accessDormant({ subnet: false, actsFor: ME })).toBe(true)
    expect(accessDormant({ subnet: true, actsFor: ME })).toBe(false)
    expect(accessDormant({ subnet: false, actsFor: null })).toBe(false)
  })
})

describe('accessSteps: each level written to the two settings', () => {
  it('Off turns user mode off first, then the subnet', () => {
    expect(accessSteps({ subnet: true, actsFor: ME }, ME, 'off')).toEqual([
      { setting: 'user_mode', on: false },
      { setting: 'subnet', on: false },
    ])
    expect(accessSteps({ subnet: true, actsFor: null }, ME, 'off')).toEqual([{ setting: 'subnet', on: false }])
  })

  it('Networks only turns the subnet on and user mode off', () => {
    expect(accessSteps({ subnet: false, actsFor: null }, ME, 'networks')).toEqual([{ setting: 'subnet', on: true }])
    expect(accessSteps({ subnet: true, actsFor: ME }, ME, 'networks')).toEqual([{ setting: 'user_mode', on: false }])
  })

  it('Full access turns the subnet on first, then user mode for you', () => {
    expect(accessSteps({ subnet: false, actsFor: null }, ME, 'full')).toEqual([
      { setting: 'subnet', on: true },
      { setting: 'user_mode', on: true },
    ])
    expect(accessSteps({ subnet: true, actsFor: null }, ME, 'full')).toEqual([{ setting: 'user_mode', on: true }])
  })

  it('Full access while user mode acts for someone else makes it act for you, in one call', () => {
    expect(accessSteps({ subnet: true, actsFor: OTHER }, ME, 'full')).toEqual([{ setting: 'user_mode', on: true }])
  })

  it('a dormant user mode is cleared by any level, or woken by Full access', () => {
    expect(accessSteps({ subnet: false, actsFor: ME }, ME, 'off')).toEqual([{ setting: 'user_mode', on: false }])
    expect(accessSteps({ subnet: false, actsFor: ME }, ME, 'networks')).toEqual([
      { setting: 'user_mode', on: false },
      { setting: 'subnet', on: true },
    ])
    expect(accessSteps({ subnet: false, actsFor: ME }, ME, 'full')).toEqual([{ setting: 'subnet', on: true }])
  })

  it('the level it already has changes nothing', () => {
    expect(accessSteps({ subnet: false, actsFor: null }, ME, 'off')).toEqual([])
    expect(accessSteps({ subnet: true, actsFor: null }, ME, 'networks')).toEqual([])
    expect(accessSteps({ subnet: true, actsFor: ME }, ME, 'full')).toEqual([])
  })
})

describe('accessBlocked: locked settings', () => {
  it('a subnet locked by the administrator or a product blocks every level that changes it', () => {
    const locks = { subnet: true }
    expect(accessBlocked({ subnet: true, actsFor: null }, ME, 'off', locks)).toBe(true)
    expect(accessBlocked({ subnet: true, actsFor: null }, ME, 'full', locks)).toBe(false)
    expect(accessBlocked({ subnet: false, actsFor: null }, ME, 'networks', locks)).toBe(true)
  })

  it('user mode refused on the device blocks Full access, never turning it off', () => {
    const locks = { userMode: true }
    expect(accessBlocked({ subnet: true, actsFor: null }, ME, 'full', locks)).toBe(true)
    expect(accessBlocked({ subnet: true, actsFor: ME }, ME, 'networks', locks)).toBe(false)
  })
})
