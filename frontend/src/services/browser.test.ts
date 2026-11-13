import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../store', () => ({ store: { getState: () => ({}) } }))

import { getLocalStorage, setLocalStorage } from './browser'

describe('browser — local storage per signed-in user', () => {
  const alice = { auth: { user: { id: 'alice' } } } as any
  const bob = { auth: { user: { id: 'bob' } } } as any

  beforeEach(() => window.localStorage.clear())

  it('keeps false and 0, so a setting turned off stays off', () => {
    setLocalStorage(alice, 'flag', false)
    setLocalStorage(alice, 'count', 0)
    expect(getLocalStorage(alice, 'flag')).toBe(false)
    expect(getLocalStorage(alice, 'count')).toBe(0)
  })

  it('removes the value for null or undefined', () => {
    setLocalStorage(alice, 'flag', true)
    setLocalStorage(alice, 'flag', undefined)
    expect(getLocalStorage(alice, 'flag')).toBeNull()
    setLocalStorage(alice, 'flag', true)
    setLocalStorage(alice, 'flag', null)
    expect(getLocalStorage(alice, 'flag')).toBeNull()
  })

  it('keeps each user’s values apart', () => {
    setLocalStorage(alice, 'flag', false)
    expect(getLocalStorage(bob, 'flag')).toBeNull()
  })
})
