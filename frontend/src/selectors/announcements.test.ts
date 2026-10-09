import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))

import '../store'
import { FULL_SCREEN_LAUNCH, selectLatestUnreadAnnouncement } from './announcements'

const DAY = 24 * 60 * 60 * 1000

const notice = (id: string, offsetDays: number, extra: Partial<IAnnouncement> = {}) =>
  ({ id, type: 'RELEASE', modified: new Date(FULL_SCREEN_LAUNCH + offsetDays * DAY), ...extra } as IAnnouncement)

const latestUnread = (all: IAnnouncement[]) => selectLatestUnreadAnnouncement({ announcements: { all } } as any)?.id

describe('selectLatestUnreadAnnouncement', () => {
  it('picks the newest unread notice', () => {
    expect(latestUnread([notice('older', 1), notice('newest', 3), notice('middle', 2)])).toBe('newest')
  })

  it('skips read notices and falls back to the next unread one', () => {
    expect(latestUnread([notice('read', 3, { read: new Date() }), notice('unread', 1)])).toBe('unread')
  })

  it('ignores notices saved before the full-screen launch', () => {
    expect(latestUnread([notice('backlog', -1)])).toBeUndefined()
    expect(latestUnread([notice('launch-day', 0)])).toBe('launch-day')
  })

  it('ignores banners', () => {
    expect(latestUnread([notice('banner', 2, { type: 'BANNER' }), notice('card', 1)])).toBe('card')
  })
})
