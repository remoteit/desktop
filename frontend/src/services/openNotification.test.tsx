import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const set = vi.hoisted(() => vi.fn())

vi.mock('../store', () => ({ store: { dispatch: { ui: { set } } } }))

import { openNotification, restoreNotice } from './openNotification'

const NOW = Date.parse('2026-11-09T12:00:00Z')

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('openNotification', () => {
  it('opens the page with what was tapped and how long ago it happened', () => {
    openNotification('/devices/abc', { title: 'pi went offline', body: 'Linux', time: NOW - 40 * 60 * 1000 })

    const [{ redirect, noticeMessage }] = set.mock.calls[0]
    expect(redirect).toBe('/devices/abc')
    expect(renderToStaticMarkup(noticeMessage)).toBe(
      '<strong>pi went offline</strong><em>Linux</em><em>40 minutes ago</em>'
    )
  })

  it('leaves out the lines it has nothing for', () => {
    openNotification('/devices/abc', { title: 'pi went offline' })

    expect(renderToStaticMarkup(set.mock.calls[0][0].noticeMessage)).toBe('<strong>pi went offline</strong>')
  })

  it('only opens the page when there is no title, keeping any notice already showing', () => {
    openNotification('/devices/abc', {})

    expect(set).toHaveBeenCalledWith({ redirect: '/devices/abc' })
  })
})

describe('restoreNotice', () => {
  it('shows a saved notice', () => {
    restoreNotice(JSON.stringify({ title: 'pi came online', time: NOW - 2 * 60 * 60 * 1000 }))

    expect(renderToStaticMarkup(set.mock.calls[0][0].noticeMessage)).toBe(
      '<strong>pi came online</strong><em>2 hours ago</em>'
    )
  })

  it('shrugs off a saved notice it cannot read', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => restoreNotice('{')).not.toThrow()
    expect(set).not.toHaveBeenCalled()
  })
})
