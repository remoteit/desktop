import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))

import '../store'
import { ANNOUNCEMENT_POPUP_DATE } from '../constants'
import { DAY_MS } from '../models/logs'
import { selectPresentableAnnouncement } from './announcements'

const notice = (id: string, offsetDays: number, extra: Partial<IAnnouncement> = {}) =>
  ({
    id,
    title: id,
    type: 'RELEASE',
    modified: new Date(ANNOUNCEMENT_POPUP_DATE.getTime() + offsetDays * DAY_MS),
    ...extra,
  } as IAnnouncement)

const presentable = (all: IAnnouncement[]) => selectPresentableAnnouncement({ announcements: { all } } as any)?.id

describe('selectPresentableAnnouncement', () => {
  it('picks the newest notice when it is unread', () => {
    expect(presentable([notice('older', 1), notice('newest', 3), notice('middle', 2)])).toBe('newest')
  })

  it('presents nothing once the newest notice is read, even with older ones unread', () => {
    expect(presentable([notice('read', 3, { read: new Date() }), notice('unread', 1)])).toBeUndefined()
  })

  it('ignores notices saved before the full-screen launch', () => {
    expect(presentable([notice('backlog', -1)])).toBeUndefined()
    expect(presentable([notice('launch-day', 0)])).toBe('launch-day')
  })

  it('ignores banners', () => {
    expect(presentable([notice('banner', 2, { type: 'BANNER' }), notice('card', 1)])).toBe('card')
  })
})
