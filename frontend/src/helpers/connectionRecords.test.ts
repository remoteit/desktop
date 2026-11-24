import { describe, it, expect, vi } from 'vitest'

const browser = vi.hoisted(() => ({ hasBackend: false }))
vi.mock('../services/browser', () => ({ default: browser }))

import { pickRecord, recordSub, sameRecord } from './connectionRecords'

// Acme is reached by the page's own person and by Work; Labs by Work alone.
const routes: any = {
  acme: { reach: [{ sub: '' }, { sub: 'sub-work' }] },
  labs: { sub: 'sub-work', reach: [{ sub: 'sub-work' }] },
}
const mine: IConnection = { id: 'svc', accountId: 'acme', enabled: true }
const works: IConnection = { id: 'svc', accountId: 'acme', sub: 'sub-work', enabled: true }
const labs: IConnection = { id: 'svc-labs', accountId: 'labs', enabled: true }

describe('a connection record: the service, as one sign-in', () => {
  it('is a row’s own where two rows are connected to the service, and never the other row’s', () => {
    browser.hasBackend = false
    expect(sameRecord(routes, mine, works)).toBe(false)
    expect(sameRecord(routes, works, { ...works })).toBe(true)
    expect(pickRecord(routes, [mine, works], 'svc', 'acme', '')).toBe(mine)
    expect(pickRecord(routes, [mine, works], 'svc', 'acme', 'sub-work')).toBe(works)
    expect(pickRecord(routes, [mine], 'svc', 'acme', 'sub-work')).toBeUndefined()
    // A service of another account here: seen as that account's connection.
    expect(pickRecord(routes, [labs], 'svc-labs', 'acme', '')).toBe(labs)
  })

  it('that says no sign-in is the page’s own person’s where they belong to its account, else its serving sign-in’s', () => {
    browser.hasBackend = false
    expect(recordSub(routes, mine)).toBe('')
    expect(recordSub(routes, labs)).toBe('sub-work')
  })

  it('is ONE per service with a backend: a second row finds, and writes, the connection the first made', () => {
    browser.hasBackend = true
    expect(sameRecord(routes, mine, works)).toBe(true)
    expect(pickRecord(routes, [mine], 'svc', 'acme', 'sub-work')).toBe(mine)
    expect(recordSub(routes, works)).toBe('')
    browser.hasBackend = false
  })
})
