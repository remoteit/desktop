import { describe, it, expect } from 'vitest'
import { rowAccount, rowKey, rowSub } from './rowKey'

describe('the key a row is kept by', () => {
  it('is the account’s own id for the page’s own person', () => {
    expect(rowKey('acme')).toBe('acme')
    expect(rowKey('acme', '')).toBe('acme')
    expect(rowAccount(rowKey('acme'))).toBe('acme')
    expect(rowSub(rowKey('acme'))).toBe('')
  })

  it('says the account and the sign-in for a row under another sign-in', () => {
    const row = rowKey('acme', 'sub-work')
    expect(row).not.toBe('acme')
    expect(rowAccount(row)).toBe('acme')
    expect(rowSub(row)).toBe('sub-work')
    expect(rowKey('acme', 'sub-third')).not.toBe(row)
  })

  it('reads a name the store keeps beside the rows as itself', () => {
    expect(rowAccount('connections')).toBe('connections')
    expect(rowSub('default')).toBe('')
  })
})
