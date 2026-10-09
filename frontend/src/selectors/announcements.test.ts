import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))

import '../store'
import { ANNOUNCEMENT_POPUP_DATE } from '../constants'
import { DAY_MS } from '../models/logs'
import { selectAnnouncements, selectPresentableAnnouncement } from './announcements'

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

  it('ranks and dates notices by start date, so editing an old notice does not make it new', () => {
    const edited = notice('old', -400, {
      modified: new Date(),
      from: new Date(ANNOUNCEMENT_POPUP_DATE.getTime() - DAY_MS),
    })
    expect(presentable([edited])).toBeUndefined()
    expect(presentable([edited, notice('new', 2)])).toBe('new')
  })

  it('ignores banners', () => {
    expect(presentable([notice('banner', 2, { type: 'BANNER' }), notice('card', 1)])).toBe('card')
  })
})

describe('selectAnnouncements', () => {
  it('lists newest start date first, so an edited old notice keeps its place', () => {
    const edited = notice('old', -400, {
      modified: new Date(),
      from: new Date(ANNOUNCEMENT_POPUP_DATE.getTime() - DAY_MS),
    })
    const all = [edited, notice('new', 2), notice('middle', 1)]
    expect(selectAnnouncements({ announcements: { all } } as any).map(a => a.id)).toEqual(['new', 'middle', 'old'])
  })
})
