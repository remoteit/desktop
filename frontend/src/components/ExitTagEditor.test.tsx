import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { account, create } = vi.hoisted(() => ({
  account: { admin: true, tags: [] as ITag[] },
  create: vi.fn(async (_: any) => undefined),
}))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({}),
  useDispatch: () => ({ tags: { create } }),
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('../selectors/tags', () => ({
  selectTags: (_state: any, accountId: string) => (accountId === 'ACCOUNT' ? account.tags : []),
}))
vi.mock('../models/tags', () => ({
  canEditTags: (_state: any, accountId: string) => accountId === 'ACCOUNT' && account.admin,
}))
// The chips and the editor are the device and network pages' own: here, what each is given, and a way to use it.
vi.mock('./Tags', () => ({
  Tags: ({ tags, onDelete, onClick }: any) => (
    <span data-chips={tags.map((tag: ITag) => tag.name).join('|')}>
      {tags.map((tag: ITag) => (
        <span key={tag.name}>
          {onDelete && <button data-delete={tag.name} onClick={() => onDelete(tag)} />}
          {onClick && <button data-chip={tag.name} onClick={() => onClick(tag)} />}
        </span>
      ))}
    </span>
  ),
}))
vi.mock('./TagEditor', () => ({
  TagEditor: ({ tags, filter, allowAdding, keyboardShortcut, onCreate, onSelect }: any) => (
    <span
      data-editor
      data-offered={tags.map((tag: ITag) => tag.name).join('|')}
      data-filtered={filter.map((tag: ITag) => tag.name).join('|')}
      data-adding={allowAdding ? 'yes' : 'no'}
      data-shortcut={keyboardShortcut ? 'yes' : 'no'}
    >
      <button data-select onClick={() => onSelect(tags[0])} />
      <button
        data-new
        onClick={async () => {
          const tag = { name: 'brand-new', color: 3 }
          await onCreate(tag)
          await onSelect(tag)
        }}
      />
    </span>
  ),
}))

import { ExitTagEditor } from './ExitTagEditor'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const LAB = { name: 'lab', color: 1 }
const PROD = { name: 'prod', color: 2 }
const EXIT = { id: 'xaaa', tags: [LAB] }
const find = (selector: string) => document.body.querySelector(selector) as HTMLElement

async function render(props: Partial<React.ComponentProps<typeof ExitTagEditor>> = {}) {
  const handlers = { onAdd: vi.fn(), onRemove: vi.fn(), onClick: vi.fn() }
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<ExitTagEditor exit={EXIT} {...handlers} {...props} />))
  return handlers
}

beforeEach(() => {
  document.body.innerHTML = ''
  account.admin = true
  account.tags = [LAB, PROD]
  create.mockClear()
})

describe('an exit’s tags', () => {
  it('shows the exit’s tags, each to take off and to click; the account’s tags offered, those it carries apart', async () => {
    const { onRemove, onClick, onAdd } = await render()
    expect(find('[data-chips]').getAttribute('data-chips')).toBe('lab')
    expect(find('[data-editor]').getAttribute('data-offered')).toBe('lab|prod')
    expect(find('[data-editor]').getAttribute('data-filtered')).toBe('lab')
    // One editor an exit, so '#' opens none of them.
    expect(find('[data-editor]').getAttribute('data-shortcut')).toBe('no')
    await act(async () => find('[data-delete="lab"]').click())
    expect(onRemove).toHaveBeenCalledWith(LAB)
    await act(async () => find('[data-chip="lab"]').click())
    expect(onClick).toHaveBeenCalledWith(LAB)
    await act(async () => find('[data-select]').click())
    expect(onAdd).toHaveBeenCalledWith(LAB)
  })

  it('a new tag is the account’s administrators’ to make: made first, then put on the exit', async () => {
    const { onAdd } = await render()
    expect(find('[data-editor]').getAttribute('data-adding')).toBe('yes')
    await act(async () => find('[data-new]').click())
    expect(create).toHaveBeenCalledWith({ tag: { name: 'brand-new', color: 3 }, accountId: 'ACCOUNT' })
    expect(onAdd).toHaveBeenCalledWith({ name: 'brand-new', color: 3 })
    document.body.innerHTML = ''
    account.admin = false
    await render()
    expect(find('[data-editor]').getAttribute('data-adding')).toBe('no')
  })

  it('while busy, none is taken off', async () => {
    await render({ disabled: true })
    expect(find('[data-delete="lab"]')).toBeNull()
    expect(find('[data-chip="lab"]')).not.toBeNull()
  })
})
