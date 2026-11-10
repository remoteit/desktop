import { describe, it, expect, vi } from 'vitest'

vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({}))
vi.mock('react-router-dom', () => ({}))
vi.mock('./DecommissionDialog', () => ({}))
vi.mock('./Notice', () => ({}))
vi.mock('../hooks/useDeviceDisable', () => ({ disabledWhen: (date?: Date) => date && 'Nov 9, 10:00' }))

import { disabledDescription } from './DisabledDeviceNotice'

const t = ((_key: string, a: any, b?: any) => {
  const text = typeof a === 'string' ? a : a.defaultValue
  const values = typeof a === 'string' ? b : a
  return text.replace(/{{(\w+)}}/g, (_: string, k: string) => values?.[k] ?? '')
}) as any

describe('disabledDescription', () => {
  it('a duplicate says it was split off another device, and waits for its owner', () => {
    expect(disabledDescription(t, { disabledReason: 'duplicate', disabledAt: new Date() })).toBe(
      'Split off Nov 9, 10:00 as a duplicate of another device: disabled until its owner decides.'
    )
    expect(disabledDescription(t, { disabledReason: 'duplicate' })).toBe(
      'A duplicate of another device: disabled until its owner decides.'
    )
  })

  it('a person, or the expiry, as before', () => {
    expect(disabledDescription(t, { disabledReason: 'person', disabledAt: new Date(), disabledBy: 'a@x' })).toBe(
      'Disabled Nov 9, 10:00 by a@x'
    )
    expect(disabledDescription(t, { disabledReason: 'expired' })).toMatch(/^Disabled: offline past/)
  })
})
