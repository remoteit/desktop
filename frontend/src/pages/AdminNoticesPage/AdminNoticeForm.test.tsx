import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../components/ServiceForm', () => ({ fieldSx: {} }))
vi.mock('../../components/AnnouncementCard', () => ({ AnnouncementCard: () => null }))
vi.mock('../../components/Notice', () => ({ Notice: () => null }))
vi.mock('../../components/ListItemCheckbox', () => ({
  ListItemCheckbox: ({ onClick }: { onClick: (checked: boolean) => void }) => (
    <button type="button" id="enable" onClick={() => onClick(true)} />
  ),
}))

import { AdminNoticeForm } from './AdminNoticeForm'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const notice = (extra: Partial<IAdminNotice>) =>
  ({ id: 'n1', type: 'RELEASE', title: 'Title', body: '', enabled: false, ...extra } as IAdminNotice)

describe('AdminNoticeForm', () => {
  let root: Root
  let container: HTMLDivElement
  const onSave = vi.fn()

  const save = (existing: IAdminNotice, enable = false) => {
    act(() => root.render(<AdminNoticeForm notice={existing} onCancel={vi.fn()} onSave={onSave} />))
    if (enable) act(() => container.querySelector<HTMLButtonElement>('#enable')?.click())
    act(() => container.querySelector('form')?.requestSubmit())
    return onSave.mock.calls[0][0] as INoticeInput
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    onSave.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('starts a draft now when it is enabled', () => {
    const before = Date.now()
    const saved = save(notice({ enabled: false }), true)
    expect(new Date(saved.from as string).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('dates an already-live notice by its last save, so editing it does not re-announce it', () => {
    const modified = new Date('2024-07-24T07:25:42Z')
    expect(save(notice({ enabled: true, modified })).from).toBe(modified.toISOString())
  })

  it('keeps an existing start date', () => {
    const from = new Date('2026-08-01T12:00:00Z')
    expect(save(notice({ enabled: true, from })).from).toBe(from.toISOString())
  })

  it('leaves a disabled draft without a start date', () => {
    expect(save(notice({ enabled: false })).from).toBeNull()
  })
})
