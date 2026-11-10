import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const set = vi.hoisted(() => vi.fn())

vi.mock('../store', () => ({ store: { dispatch: { ui: { set } } } }))

import { openNotification, showPendingNotice } from './openNotification'

const NOW = Date.parse('2026-11-09T12:00:00Z')
const KEY = 'app:pendingNotification'

const notices = () => set.mock.calls.filter(([value]) => 'noticeMessage' in value).map(([value]) => value.noticeMessage)

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('openNotification', () => {
  it('opens the page now and shows what was tapped, and how long ago, once the Router opens it', () => {
    openNotification('/devices/abc', { title: 'pi went offline', body: 'Linux', time: NOW - 40 * 60 * 1000 })

    expect(set).toHaveBeenCalledWith({ redirect: '/devices/abc' })
    expect(notices()).toEqual([])

    expect(showPendingNotice('/devices/abc')).toBe('/devices/abc')
    expect(notices().map(notice => renderToStaticMarkup(notice))).toEqual([
      '<strong>pi went offline</strong><em>Linux</em><em>40 minutes ago</em>',
    ])
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it('survives a reload: a cold start opens whatever was tapped', () => {
    openNotification('/devices/abc', { title: 'pi came online', time: NOW - 2 * 60 * 60 * 1000 })
    set.mockClear()

    expect(showPendingNotice()).toBe('/devices/abc')
    expect(renderToStaticMarkup(notices()[0])).toBe('<strong>pi came online</strong><em>2 hours ago</em>')
  })

  it('leaves a tap for another page alone', () => {
    openNotification('/devices/abc', { title: 'pi went offline' })

    expect(showPendingNotice('/devices/other')).toBeUndefined()
    expect(notices()).toEqual([])
    expect(window.localStorage.getItem(KEY)).not.toBeNull()
  })

  it('opens the page without a notice when there is no title, keeping any notice already showing', () => {
    openNotification('/devices/abc', {})

    expect(showPendingNotice()).toBe('/devices/abc')
    expect(notices()).toEqual([])
  })

  it('drops a saved tap it cannot read', () => {
    window.localStorage.setItem(KEY, '{')

    expect(showPendingNotice()).toBeUndefined()
    expect(notices()).toEqual([])
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })
})
