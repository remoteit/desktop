import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { groups, deleteGroup, access, shared, unshare, sharing, addTag, removeTag } = vi.hoisted(() => ({
  groups: vi.fn(async (_accountId: string) => [] as any),
  deleteGroup: vi.fn(async (_label: string, _confirm: boolean) => ({} as any)),
  access: { manages: true },
  shared: vi.fn(async () => [] as any),
  unshare: vi.fn(async (_label: string, _emails: string[]) => ({} as any)),
  sharing: { served: true, tags: true },
  addTag: vi.fn(async (_label: string, _names: string[]) => ({} as any)),
  removeTag: vi.fn(async (_label: string, _names: string[]) => ({} as any)),
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('../hooks/useDeviceDisable', () => ({ useDisabledDevicesAccess: () => access.manages }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLProxyGroups', () => ({
  graphQLAccountProxyGroups: groups,
  graphQLDeleteProxyGroup: deleteGroup,
  graphQLSharedProxyGroups: shared,
  graphQLUnshareProxyGroup: unshare,
  graphQLAddProxyGroupTag: addTag,
  graphQLRemoveProxyGroupTag: removeTag,
  proxyGroupSharesServed: async () => sharing.served,
  proxyGroupTagsServed: async () => sharing.tags,
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
// A group's tags are their editor's own test's (ProxyGroupTagEditor.test.tsx): here, what it was given, and its three
// ways back — a tag added, one removed, one clicked.
vi.mock('../components/ProxyGroupTagEditor', () => ({
  ProxyGroupTagEditor: ({ group, disabled, onAdd, onRemove, onClick }: any) => (
    <div data-tags={group.tags.map((tag: any) => tag.name).join('|')} data-disabled={disabled ? '' : undefined}>
      <button data-add onClick={() => onAdd({ name: 'prod', color: 2 })} />
      {group.tags.map((tag: any) => (
        <span key={tag.name}>
          <button data-remove={tag.name} onClick={() => onRemove(tag)} />
          <button data-click={tag.name} onClick={() => onClick(tag)} />
        </span>
      ))}
    </div>
  ),
}))
vi.mock('../components/Tags', () => ({
  Tags: ({ tags, onDelete }: any) => (
    <span data-filter-chip={tags.map((tag: any) => tag.name).join('|')}>
      <button data-clear onClick={() => onDelete(tags[0])} />
    </span>
  ),
}))
// The share dialog is its own test's (ProxyGroupShareDialog.test.tsx): here, which group it opened for.
vi.mock('../components/ProxyGroupShareDialog', () => ({
  ProxyGroupShareDialog: ({ group }: any) => <div data-share-dialog={group.label} />,
}))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Body', () => ({ Body: ({ children }: any) => <>{children}</> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, icon, onClick, disabled }: any) => (
    <button data-delete={icon === 'trash' ? '' : undefined} data-icon={icon} disabled={disabled} onClick={onClick}>
      {title}
    </button>
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { ProxyGroupsPage } from './ProxyGroupsPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const member = (id: string, name: string) => ({ id, name, kind: 'exit', state: 'active' })
const OFFICE = {
  label: 'gaaa',
  name: 'Office Mac',
  remoteit: false,
  host: null,
  members: [member('MAC', 'Office Mac')],
  users: 2,
  endpoints: 0,
}
const OLD_MAC = { label: 'gbbb', name: 'Old Mac', remoteit: false, host: null, members: [], users: 3, endpoints: 0 }
const SHOP = {
  label: 'gccc',
  name: 'Shop gateway',
  remoteit: false,
  host: 'gw.r3proxy.com',
  members: [],
  users: 0,
  endpoints: 2,
}
const SPARE = { label: 'gddd', name: 'Spare', remoteit: false, host: null, members: [], users: 0, endpoints: 0 }

const row = (label: string) => document.body.querySelector(`[data-group="${label}"]`) as HTMLElement
// The dialog's own Delete, not a row's.
const confirm = () =>
  [...document.body.querySelectorAll('.MuiDialogActions-root button')].find(b =>
    b.textContent?.includes('Delete')
  ) as HTMLButtonElement

async function render() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<ProxyGroupsPage />))
  await act(async () => {})
  return container
}

beforeEach(() => {
  document.body.innerHTML = ''
  access.manages = true
  sharing.served = true
  sharing.tags = true
  groups.mockReset().mockResolvedValue([OFFICE, OLD_MAC, SHOP, SPARE])
  deleteGroup.mockReset().mockResolvedValue({})
  shared.mockReset().mockResolvedValue([])
  unshare.mockReset().mockResolvedValue({})
  addTag.mockReset().mockResolvedValue({})
  removeTag.mockReset().mockResolvedValue({})
})

describe('the account’s proxy and exit groups', () => {
  it('lists every group, an empty one too, with its devices, users and endpoints; Delete on the empty ones alone', async () => {
    await render()
    expect(groups).toHaveBeenCalledWith('ACCOUNT')
    expect(row('gaaa').textContent).toContain('Office Mac')
    expect(row('gaaa').textContent).toContain(
      'In it: Office Mac. 2 devices use it as their exit, and it has no endpoints.'
    )
    expect(row('gaaa').querySelector('[data-delete]')).toBeNull()
    expect(row('gbbb').textContent).toContain(
      'No device in it. 3 devices use it as their exit, and it has no endpoints.'
    )
    expect(row('gccc').textContent).toContain('No device in it. No device uses it as its exit, and it has 2 endpoints.')
    for (const label of ['gbbb', 'gccc', 'gddd']) expect(row(label).querySelector('[data-delete]')).not.toBeNull()
  })

  it('Delete says what goes with it, and confirms to graphql only what it said: users’ exits and endpoints', async () => {
    await render()
    await act(async () => (row('gbbb').querySelector('[data-delete]') as HTMLButtonElement).click())
    expect(document.body.textContent).toContain('Delete Old Mac?')
    expect(document.body.textContent).toContain(
      '3 devices use it as their exit, and it has no endpoints. Deleted, the devices using it go their usual way.'
    )
    groups.mockResolvedValue([OFFICE, SHOP, SPARE])
    await act(async () => confirm().click())
    expect(deleteGroup).toHaveBeenCalledWith('gbbb', true)
    expect(row('gbbb')).toBeNull()

    // Nothing uses it: deleted with no confirm needed.
    await act(async () => (row('gddd').querySelector('[data-delete]') as HTMLButtonElement).click())
    expect(document.body.textContent).toContain('Deleted, nothing else changes: nothing uses it.')
    await act(async () => confirm().click())
    expect(deleteGroup).toHaveBeenLastCalledWith('gddd', false)
  })

  it('a refusal is said in the dialog, and nothing is taken off the list', async () => {
    await render()
    deleteGroup.mockResolvedValue({ reason: 'A device joined Shop gateway meanwhile: it is not deleted' })
    await act(async () => (row('gccc').querySelector('[data-delete]') as HTMLButtonElement).click())
    await act(async () => confirm().click())
    expect(document.body.textContent).toContain('A device joined Shop gateway meanwhile')
    expect(row('gccc')).not.toBeNull()
  })

  it('none, an API without groups, or someone who does not manage devices here: said, nothing listed', async () => {
    groups.mockResolvedValue([])
    expect((await render()).textContent).toContain('No groups yet')
    document.body.innerHTML = ''
    groups.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).toContain('This server does not have proxy and exit groups.')
    document.body.innerHTML = ''
    access.manages = false
    groups.mockClear()
    expect((await render()).textContent).toContain('Groups are seen by those who may manage devices here.')
    expect(groups).not.toHaveBeenCalled()
  })
})

describe('sharing the account’s groups, and those shared with you', () => {
  const share = (id: string, email: string) => ({ user: { id, email } })
  const pat = { id: 'PAT', email: 'pat@example.com' }

  it('each group says who it is shared with, and whether its users are dormant; Share opens its dialog', async () => {
    groups.mockResolvedValue([
      { ...OFFICE, access: [share('SAM', 'sam@example.com')], offered: true, dormant: false },
      { ...OLD_MAC, access: [], offered: false, dormant: true },
    ])
    await render()
    expect(row('gaaa').textContent).toContain('Shared with sam@example.com.')
    expect(row('gbbb').textContent).toContain(
      'No device in it is in service: the devices using it are dormant, their traffic going its usual way until one is.'
    )
    expect(row('gaaa').textContent).not.toContain('dormant')
    await act(async () => (row('gbbb').querySelector('[data-icon="share"]') as HTMLButtonElement).click())
    expect(document.body.querySelector('[data-share-dialog]')?.getAttribute('data-share-dialog')).toBe('gbbb')
  })

  it('an API that shares no groups: no Share, and none listed as shared with you', async () => {
    sharing.served = false
    shared.mockResolvedValue([
      { label: 'gxxx', name: 'Theirs', access: [share('ME', 'me@example.com')], offered: true, owner: pat },
    ])
    await render()
    expect(document.body.querySelector('[data-icon="share"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Shared with you')
    expect(shared).not.toHaveBeenCalled()
  })

  it('the groups shared with you: whose, whether a device can choose it now, and Leave — confirmed, by your own address', async () => {
    shared.mockResolvedValue([
      {
        label: 'gxxx',
        name: 'Pat exits',
        access: [share('ME', 'me@example.com')],
        offered: true,
        dormant: false,
        owner: pat,
      },
      {
        label: 'gyyy',
        name: 'Old Mac',
        access: [share('ME', 'me@example.com')],
        offered: false,
        dormant: true,
        owner: pat,
      },
    ])
    await render()
    const theirs = (label: string) => document.body.querySelector(`[data-shared="${label}"]`) as HTMLElement
    expect(document.body.textContent).toContain('Shared with you')
    expect(theirs('gxxx').textContent).toContain('Shared by pat@example.com. A device of yours can use it as its exit.')
    expect(theirs('gyyy').textContent).toContain('No device in it is in service: it cannot be chosen until one is.')
    await act(async () =>
      (theirs('gxxx').querySelector('[data-icon="arrow-right-from-bracket"]') as HTMLButtonElement).click()
    )
    expect(document.body.textContent).toContain('Leave Pat exits?')
    shared.mockResolvedValue([])
    const leave = [...document.body.querySelectorAll('.MuiDialogActions-root button')].find(b =>
      b.textContent?.includes('Leave')
    ) as HTMLButtonElement
    await act(async () => leave.click())
    expect(unshare).toHaveBeenCalledWith('gxxx', ['me@example.com'])
    expect(theirs('gxxx')).toBeNull()
  })
})

describe('the account’s tags on its groups', () => {
  const lab = { name: 'lab', color: 1 }
  const prod = { name: 'Prod', color: 2 }
  const tagsOf = (label: string) => row(label).querySelector('[data-tags]')?.getAttribute('data-tags')
  const press = (label: string, selector: string) =>
    act(async () => (row(label).querySelector(selector) as HTMLButtonElement).click())

  it('each group shows its tags; one added or taken off is asked of graphql, and the groups read again', async () => {
    groups.mockResolvedValue([
      { ...OFFICE, tags: [lab] },
      { ...SPARE, tags: [] },
    ])
    await render()
    expect(tagsOf('gaaa')).toBe('lab')
    expect(tagsOf('gddd')).toBe('')
    groups.mockClear()
    await press('gddd', '[data-add]')
    expect(addTag).toHaveBeenCalledWith('gddd', ['prod'])
    expect(groups).toHaveBeenCalledTimes(1)
    await press('gaaa', '[data-remove="lab"]')
    expect(removeTag).toHaveBeenCalledWith('gaaa', ['lab'])
    expect(groups).toHaveBeenCalledTimes(2)
    expect(document.body.querySelector('[data-notice]')).toBeNull()
  })

  it('a refusal is said in graphql’s words, above the list', async () => {
    groups.mockResolvedValue([{ ...OFFICE, tags: [] }])
    addTag.mockResolvedValue({ reason: 'prod is not a tag of the group’s account: its administrators make tags' })
    await render()
    await press('gaaa', '[data-add]')
    expect(document.body.querySelector('[data-notice]')?.textContent).toBe(
      'prod is not a tag of the group’s account: its administrators make tags'
    )
    addTag.mockResolvedValue('ERROR')
    await press('gaaa', '[data-add]')
    expect(document.body.querySelector('[data-notice]')?.textContent).toBe('Its tags could not be changed.')
    addTag.mockResolvedValue({})
    await press('gaaa', '[data-add]')
    expect(document.body.querySelector('[data-notice]')).toBeNull()
  })

  it('a tag clicked shows only the groups carrying it, its name compared case aside; its chip shows them all again', async () => {
    groups.mockResolvedValue([
      { ...OFFICE, tags: [lab, prod] },
      { ...OLD_MAC, tags: [{ name: 'prod', color: 2 }] },
      { ...SPARE, tags: [] },
    ])
    await render()
    await press('gaaa', '[data-click="Prod"]')
    expect(document.body.querySelector('[data-tag-filter]')?.textContent).toContain('Groups tagged')
    expect(row('gaaa')).not.toBeNull()
    expect(row('gbbb')).not.toBeNull()
    expect(row('gddd')).toBeNull()
    await press('gaaa', '[data-click="lab"]')
    expect(row('gbbb')).toBeNull()
    await act(async () => (document.body.querySelector('[data-clear]') as HTMLButtonElement).click())
    expect(document.body.querySelector('[data-tag-filter]')).toBeNull()
    for (const label of ['gaaa', 'gbbb', 'gddd']) expect(row(label)).not.toBeNull()
  })

  it('a tag no group carries any longer: said so, the filter still there to clear', async () => {
    groups.mockResolvedValue([{ ...OFFICE, tags: [lab] }])
    await render()
    await press('gaaa', '[data-click="lab"]')
    groups.mockResolvedValue([{ ...OFFICE, tags: [] }])
    await press('gaaa', '[data-remove="lab"]')
    expect(row('gaaa')).toBeNull()
    expect(document.body.querySelector('[data-tag-filter]')?.textContent).toContain('None of your groups carries it.')
  })

  it('an API that tags no groups: no tags shown', async () => {
    sharing.tags = false
    groups.mockResolvedValue([OFFICE])
    await render()
    expect(row('gaaa').querySelector('[data-tags]')).toBeNull()
  })
})
