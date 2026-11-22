import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Exit } from '../services/graphQLExits'

const { create, addDevice, reload, push, picker } = vi.hoisted(() => ({
  create: vi.fn(async (_name: string, _accountId?: string) => ({} as any)),
  addDevice: vi.fn(async (_exit: string, _deviceId: string) => ({ runs: { proxy: null, exit: null } } as any)),
  reload: vi.fn(),
  push: vi.fn(),
  picker: { chosen: [] as string[] },
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../services/graphQLExits', () => ({ graphQLCreateExit: create }))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLAddExitDevice: addDevice }))
// The exits list beside the page is the store's (hooks/useAccountStore.ts): here, its being read again.
vi.mock('../hooks/useAccountExits', () => ({ useAccountExits: () => ({ value: undefined, reload }) }))
// The picker is its own (RunDevicePicker.tsx): here, what it was given, and the device chosen in it.
vi.mock('../components/RunDevicePicker', () => ({
  RunDevicePicker: ({ kind, target, ownerId, single, onChoose }: any) => (
    <div data-picker={kind} data-owner={ownerId} data-for={target ?? ''} data-single={single ? 'yes' : 'no'}>
      <button data-choose onClick={() => onChoose(picker.chosen[0])} />
    </div>
  ),
}))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      <div data-header>{header}</div>
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, severity = 'info' }: any) => <div data-notice={severity}>{children}</div>,
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

import { ExitAddPage } from './ExitAddPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// As graphql makes it: in the active account, run by no device yet, its devices' local networks closed.
const MADE: Exit = {
  id: 'xnew',
  name: 'Office',
  remoteit: false,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  offered: false,
  dormant: true,
  lan: false,
  lanRefusal: null,
  owner: { id: 'ACCOUNT', email: 'me@example.com' },
  devices: [],
  users: 0,
  access: [],
  tags: [],
  networks: null,
}

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(each => each.textContent === text) as HTMLButtonElement
const createIt = () => button('Create exit')
const nameField = () => document.body.querySelector('input') as HTMLInputElement
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())

async function type(text: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    set.call(nameField(), text)
    nameField().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

let root: Root | undefined
async function render() {
  if (root) {
    const old = root
    await act(async () => old.unmount())
  }
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<ExitAddPage />))
}
async function choose(id?: string) {
  picker.chosen = id ? [id] : []
  await click(find('[data-choose]'))
}

beforeEach(() => {
  create.mockReset().mockResolvedValue(MADE)
  addDevice.mockReset().mockResolvedValue({ runs: { proxy: null, exit: null } })
  reload.mockReset()
  push.mockReset()
  picker.chosen = []
})

describe('creating an exit', () => {
  it('asks its name and one device of the active account to carry it, before it is made', async () => {
    await render()
    expect(find('[data-title]').textContent).toBe('Create exit')
    expect(find('[data-picker]').getAttribute('data-picker')).toBe('exit')
    expect(find('[data-picker]').getAttribute('data-owner')).toBe('ACCOUNT')
    expect(find('[data-picker]').getAttribute('data-for')).toBe('')
    expect(find('[data-picker]').getAttribute('data-single')).toBe('yes')
    expect(createIt().disabled).toBe(true)
    await type('   ')
    expect(createIt().disabled).toBe(true)
    await type('  Office ')
    expect(createIt().disabled).toBe(false)
  })

  it('made by its name trimmed, the device chosen added to it, then its page opens', async () => {
    await render()
    await type('  Office ')
    await choose('PI')
    await click(createIt())
    expect(create).toHaveBeenCalledWith('Office', 'ACCOUNT')
    expect(addDevice).toHaveBeenCalledWith('xnew', 'PI')
    expect(reload).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('with no device chosen, it is made alone and its page opens to add one', async () => {
    await render()
    await type('Office')
    await click(createIt())
    expect(create).toHaveBeenCalledTimes(1)
    expect(addDevice).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('while it is made, it is not asked for again', async () => {
    let answer: (exit: Exit) => void = () => {}
    create.mockReturnValue(new Promise(resolve => (answer = resolve)))
    await render()
    await type('Office')
    await click(createIt())
    expect(createIt().disabled).toBe(true)
    await act(async () => answer(MADE))
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('refused: said in graphql’s words, or that it was not made, the name kept to try again', async () => {
    create.mockResolvedValue({ reason: 'name taken' })
    await render()
    await type('Office')
    await click(createIt())
    expect(find('[data-notice]').getAttribute('data-notice')).toBe('error')
    expect(find('[data-notice]').textContent).toBe('name taken')
    expect(nameField().value).toBe('Office')
    expect(push).not.toHaveBeenCalled()
    create.mockResolvedValue({ reason: '' })
    await click(createIt())
    expect(find('[data-notice]').textContent).toBe('Couldn’t create the exit. Try again.')
  })
})

describe('the device refused', () => {
  it('the exit kept, why said in a person’s words; another device is added to it, not a new exit', async () => {
    addDevice.mockResolvedValueOnce({
      reason: "its administrator's policy forbids exits on this machine: it would never go into service",
    })
    await render()
    await type('Office')
    await choose('NAS')
    await click(createIt())
    expect(push).not.toHaveBeenCalled()
    expect(find('[data-notice]').textContent).toBe(
      'Exit created, but that device couldn’t be added. Exits are turned off on this device.'
    )
    expect(nameField().disabled).toBe(true)
    expect(find('[data-picker]').getAttribute('data-for')).toBe('xnew')
    await choose('PI')
    await click(button('Add device'))
    expect(create).toHaveBeenCalledTimes(1)
    expect(addDevice).toHaveBeenLastCalledWith('xnew', 'PI')
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('Open exit opens it with no device added', async () => {
    addDevice.mockResolvedValueOnce({ reason: '' })
    await render()
    await type('Office')
    await choose('NAS')
    await click(createIt())
    expect(find('[data-notice]').textContent).toBe(
      'Exit created, but that device couldn’t be added. Choose another device.'
    )
    await click(button('Open exit'))
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('Cancel before anything is made goes back to the exits', async () => {
    await render()
    await click(button('Cancel'))
    expect(push).toHaveBeenCalledWith('/exits')
    expect(create).not.toHaveBeenCalled()
  })
})
