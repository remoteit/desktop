import React, { act, useEffect } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const redux = vi.hoisted(() => ({ state: {} as any }))
const read = vi.hoisted(() => vi.fn())

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(redux.state),
  useDispatch: () => ({ announcements: { read } }),
}))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./AnnouncementCard', () => ({ AnnouncementCard: ({ data }: any) => <h1>{data.title}</h1> }))
vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal<typeof import('@mui/material')>()),
  Dialog: ({ open, onClose, TransitionProps, children }: any) => {
    useEffect(() => {
      if (!open) TransitionProps?.onExited?.()
    }, [open])
    return open ? (
      <div role="dialog">
        <button onClick={onClose}>close</button>
        {children}
      </div>
    ) : null
  },
}))

import '../store'
import { FULL_SCREEN_LAUNCH } from '../selectors/announcements'
import { AnnouncementDialog } from './AnnouncementDialog'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const notice = (id: string, offsetDays: number) =>
  ({ id, title: id, type: 'RELEASE', modified: new Date(FULL_SCREEN_LAUNCH + offsetDays * 86400000) } as IAnnouncement)

describe('AnnouncementDialog', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (state: { all: IAnnouncement[]; fetched?: boolean; userId?: string }) => {
    redux.state = {
      announcements: { all: state.all },
      ui: { announcementsFetched: state.fetched ?? true },
      auth: { user: state.userId === undefined ? { id: 'USER-A' } : { id: state.userId } },
    }
    act(() => root.render(<AnnouncementDialog />))
  }
  const shown = () => document.querySelector('[role=dialog] h1')?.textContent
  const close = () => act(() => document.querySelector<HTMLButtonElement>('[role=dialog] button')?.click())

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    read.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('waits for this session to fetch before presenting', () => {
    render({ all: [notice('stale', 1)], fetched: false })
    expect(shown()).toBeUndefined()

    render({ all: [notice('fresh', 1)] })
    expect(shown()).toBe('fresh')
  })

  it('presents the newest unread notice and marks it read on close', () => {
    render({ all: [notice('older', 1), notice('newest', 2)] })
    expect(shown()).toBe('newest')

    close()
    expect(read).toHaveBeenCalledWith('newest')
    expect(shown()).toBeUndefined()
  })

  it('does not open the next unread notice after one is closed', () => {
    const older = notice('older', 1)
    const newest = notice('newest', 2)
    render({ all: [older, newest] })
    close()

    render({ all: [older, { ...newest, read: new Date() }] })
    expect(shown()).toBeUndefined()
  })

  it('presents again for a different account signed in without a reload', () => {
    const all = [notice('newest', 2)]
    render({ all })
    close()

    render({ all, userId: 'USER-B' })
    expect(shown()).toBe('newest')
  })
})
