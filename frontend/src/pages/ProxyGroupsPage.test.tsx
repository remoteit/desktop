import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { groups, deleteGroup, access } = vi.hoisted(() => ({
  groups: vi.fn(async (_accountId: string) => [] as any),
  deleteGroup: vi.fn(async (_label: string, _confirm: boolean) => ({} as any)),
  access: { manages: true },
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('../hooks/useDeviceDisable', () => ({ useDisabledDevicesAccess: () => access.manages }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLProxyGroups', () => ({
  graphQLAccountProxyGroups: groups,
  graphQLDeleteProxyGroup: deleteGroup,
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
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
  IconButton: ({ title, onClick }: any) => (
    <button data-delete onClick={onClick}>
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
  groups.mockReset().mockResolvedValue([OFFICE, OLD_MAC, SHOP, SPARE])
  deleteGroup.mockReset().mockResolvedValue({})
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
