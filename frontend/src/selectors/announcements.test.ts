import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))

import '../store'
import { ANNOUNCEMENT_POPUP_DATE } from '../constants'
import { DAY_MS } from '../models/logs'
import { selectLatestUnreadAnnouncement } from './announcements'

const notice = (id: string, offsetDays: number, extra: Partial<IAnnouncement> = {}) =>
  ({
    id,
    title: id,
    type: 'RELEASE',
    modified: new Date(ANNOUNCEMENT_POPUP_DATE.getTime() + offsetDays * DAY_MS),
    ...extra,
  } as IAnnouncement)

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
