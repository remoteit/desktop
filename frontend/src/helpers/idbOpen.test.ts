import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { idbOpen } from './idbOpen'

// A hand-driven IDBFactory: the test decides when (and whether) the open request answers.
function fakeFactory() {
  const db = { close: vi.fn() } as unknown as IDBDatabase
  const request: any = { result: db, error: new Error('quota') }
  const factory = { open: vi.fn(() => request) } as unknown as IDBFactory
  return { factory, request, db }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('idbOpen', () => {
  it('resolves the database when the open succeeds, running the upgrade first', async () => {
    const { factory, request, db } = fakeFactory()
    const upgrade = vi.fn()
    const opened = idbOpen(factory, 'remoteit-oidc', 1, upgrade, 5000)
    request.onupgradeneeded()
    request.onsuccess()
    await expect(opened).resolves.toBe(db)
    expect(upgrade).toHaveBeenCalledWith(db)
  })

  it('rejects when the open never answers, instead of waiting forever', async () => {
    const { factory } = fakeFactory()
    const opened = idbOpen(factory, 'remoteit-oidc', 1, () => {}, 5000)
    const settled = expect(opened).rejects.toThrow(/did not open within 5000 ms/)
    await vi.advanceTimersByTimeAsync(5000)
    await settled
  })

  it('closes a connection that opens after the deadline', async () => {
    const { factory, request, db } = fakeFactory()
    const opened = idbOpen(factory, 'remoteit-oidc', 1, () => {}, 5000)
    const settled = expect(opened).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(5000)
    await settled
    request.onsuccess()
    expect(db.close).toHaveBeenCalled()
  })

  it('rejects at once when blocked by another connection', async () => {
    const { factory, request } = fakeFactory()
    const opened = idbOpen(factory, 'remoteit-oidc', 1, () => {}, 5000)
    request.onblocked()
    await expect(opened).rejects.toThrow(/blocked/)
  })

  it('rejects with the request error', async () => {
    const { factory, request } = fakeFactory()
    const opened = idbOpen(factory, 'remoteit-oidc', 1, () => {}, 5000)
    request.onerror()
    await expect(opened).rejects.toThrow('quota')
  })
})
