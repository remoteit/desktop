import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { share, unshare } = vi.hoisted(() => ({
  share: vi.fn(async (_exit: string, _emails: string[]) => ({} as any)),
  unshare: vi.fn(async (_exit: string, _emails: string[]) => ({} as any)),
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/contacts', () => ({
  selectContacts: () => [
    { id: 'SAM', email: 'sam@example.com' },
    { id: 'MEMBER', email: 'member@example.com' },
  ],
}))
vi.mock('../selectors/organizations', () => ({ selectOrganization: () => ({ members: [{ user: { id: 'MEMBER' } }] }) }))
vi.mock('../services/graphQLExits', () => ({ graphQLShareExit: share, graphQLUnshareExit: unshare }))
vi.mock('../services/graphQL', () => ({
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
// The address picker: its offered contacts, and a way to pick addresses.
vi.mock('./ContactSelector', () => ({
  ContactSelector: ({ contacts, onSelect }: any) => (
    <button data-contacts={contacts.map((c: any) => c.email).join('|')} onClick={() => onSelect(['dee@example.com'])}>
      pick
    </button>
  ),
}))
vi.mock('./Avatar', () => ({ Avatar: () => null }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick, disabled }: any) => (
    <button data-remove disabled={disabled} onClick={onClick}>
      {title}
    </button>
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : '') }) }
})

import { ExitShareDialog } from './ExitShareDialog'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const EXIT = {
  id: 'xaaa',
  name: 'Office Mac',
  access: [{ user: { id: 'SAM', email: 'sam@example.com' }, sharedBy: null, created: '2026-11-07T00:00:00Z' }],
}
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.includes(text)) as HTMLButtonElement
// The dialog's own action, not a row's.
const action = (text: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('.MuiDialogActions-root button')].find(
    b => b.textContent === text
  )!

async function render(exit: any = EXIT) {
  const onChanged = vi.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(<ExitShareDialog exit={exit} open onClose={() => undefined} onChanged={onChanged} />)
  )
  return onChanged
}

beforeEach(() => {
  document.body.innerHTML = ''
  share.mockReset().mockResolvedValue({})
  unshare.mockReset().mockResolvedValue({})
})

describe('sharing an exit', () => {
  it('lists who it is shared with, and offers contacts but the organization’s members', async () => {
    await render()
    expect(document.body.textContent).toContain('Share Office Mac')
    expect(document.body.querySelector('[data-share="sam@example.com"]')).not.toBeNull()
    expect(document.body.querySelector('[data-contacts]')?.getAttribute('data-contacts')).toBe('sam@example.com')
    expect(document.body.textContent).toContain('They get nothing on its devices themselves.')
  })

  it('shares with the addresses picked, and stops sharing with one by its Remove', async () => {
    const onChanged = await render()
    expect(button('Share').disabled).toBe(true)
    await act(async () => button('pick').click())
    await act(async () => action('Share').click())
    expect(share).toHaveBeenCalledWith('xaaa', ['dee@example.com'])
    await act(async () => button('Stop sharing with sam@example.com').click())
    expect(unshare).toHaveBeenCalledWith('xaaa', ['sam@example.com'])
    expect(onChanged).toHaveBeenCalledTimes(2)
  })

  it('a refusal is said in graphql’s words, and nothing is reloaded', async () => {
    share.mockResolvedValue({
      reason: 'Member@example.com is a member of the exit’s account: what they may use is their role’s',
    })
    const onChanged = await render({ ...EXIT, access: [] })
    expect(document.body.textContent).toContain('Shared with no one yet.')
    await act(async () => button('pick').click())
    await act(async () => action('Share').click())
    expect(document.body.querySelector('[data-notice]')?.textContent).toContain('is a member of the exit’s account')
    expect(onChanged).not.toHaveBeenCalled()
  })
})
