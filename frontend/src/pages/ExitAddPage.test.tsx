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
// The picker is its own (RunDevicePicker.tsx): here, what it was given, the devices chosen in it, and Not now. Adding
// them one after another is its real addEach.
vi.mock('../selectors/devices', () => ({ getAllDevices: () => [] }))
vi.mock('../components/RunDevicePicker', async () => ({
  ...(await vi.importActual<typeof import('../components/RunDevicePicker')>('../components/RunDevicePicker')),
  RunDevicePicker: ({ kind, target, ownerId, busy, refusals, onAdd, onSkip }: any) => (
    <div
      data-picker={kind}
      data-owner={ownerId}
      data-for={target}
      data-busy={busy ? 'yes' : 'no'}
      data-refusals={Object.entries(refusals)
        .map(([id, reason]) => `${id}: ${reason}`)
        .join('|')}
    >
      <button data-add onClick={() => onAdd(picker.chosen)} />
      {onSkip && <button data-skip onClick={onSkip} />}
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

// As graphql makes it: in the active account, run by no device yet.
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
  owner: { id: 'ACCOUNT', email: 'me@example.com' },
  devices: [],
  users: 0,
  access: [],
  tags: [],
  networks: null,
}

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const makeIt = () =>
  [...document.body.querySelectorAll('button')].find(each => each.textContent === 'Make the exit') as HTMLButtonElement
const nameField = () => document.body.querySelector('input') as HTMLInputElement
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())

async function type(text: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    set.call(nameField(), text)
    nameField().dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const enter = () =>
  act(async () => {
    nameField().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })

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
// The page with the exit made, its devices to choose.
async function made() {
  await render()
  await type('Office')
  await click(makeIt())
}

beforeEach(() => {
  create.mockReset().mockResolvedValue(MADE)
  addDevice.mockReset().mockResolvedValue({ runs: { proxy: null, exit: null } })
  reload.mockReset()
  push.mockReset()
  picker.chosen = []
})

describe('making an exit', () => {
  it('is named first: Make the exit waits for a name, then makes it in the active account by its name trimmed', async () => {
    await render()
    expect(find('[data-title]').textContent).toBe('New exit')
    expect(find('[data-picker]')).toBeNull()
    expect(makeIt().disabled).toBe(true)
    await type('   ')
    expect(makeIt().disabled).toBe(true)
    await type('  Office  ')
    expect(makeIt().disabled).toBe(false)
    await click(makeIt())
    expect(create).toHaveBeenCalledWith('Office', 'ACCOUNT')
  })

  it('Enter in the name makes it too, once a name is typed', async () => {
    await render()
    await enter()
    expect(create).not.toHaveBeenCalled()
    await type('Office')
    await enter()
    expect(create).toHaveBeenCalledWith('Office', 'ACCOUNT')
  })

  it('while it is made, it is not asked for again', async () => {
    let answer!: (exit: Exit) => void
    create.mockReturnValue(new Promise(resolve => (answer = resolve)))
    await render()
    await type('Office')
    await click(makeIt())
    expect(makeIt().disabled).toBe(true)
    await enter()
    expect(create).toHaveBeenCalledTimes(1)
    await act(async () => answer(MADE))
    expect(find('[data-picker]')).not.toBeNull()
  })

  it('made, its devices are chosen next, among its account’s; the list beside it read again', async () => {
    await made()
    expect(find('[data-title]').textContent).toBe('Office')
    expect(nameField()).toBeNull()
    expect(document.body.textContent).toContain(
      'Made. Now choose the devices that run it: each goes into service once its checks pass.'
    )
    const shown = find('[data-picker]')
    expect(shown.getAttribute('data-picker')).toBe('exit')
    expect(shown.getAttribute('data-owner')).toBe('ACCOUNT')
    expect(shown.getAttribute('data-for')).toBe('xnew')
    expect(shown.getAttribute('data-refusals')).toBe('')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('refused: said in graphql’s words, or that it was not made, the name kept to try again', async () => {
    create.mockResolvedValue({ reason: 'You may not make exits in this account' })
    await render()
    await type('Office')
    await click(makeIt())
    expect(find('[data-notice="error"]').textContent).toBe('You may not make exits in this account')
    expect(find('[data-picker]')).toBeNull()
    expect(find('[data-title]').textContent).toBe('New exit')
    expect(nameField().value).toBe('Office')
    expect(reload).not.toHaveBeenCalled()
    create.mockResolvedValue({ reason: '' })
    await click(makeIt())
    expect(find('[data-notice="error"]').textContent).toBe('It was not made: try again.')
    create.mockResolvedValue(MADE)
    await click(makeIt())
    expect(find('[data-notice]')).toBeNull()
    expect(find('[data-picker]')).not.toBeNull()
  })
})

describe('adding its devices', () => {
  it('those chosen are added to it one after another, and its page opens', async () => {
    await made()
    picker.chosen = ['D1', 'D2']
    await click(find('[data-add]'))
    expect(addDevice.mock.calls).toEqual([
      ['xnew', 'D1'],
      ['xnew', 'D2'],
    ])
    expect(reload).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('while they are added, the picker is busy', async () => {
    await made()
    let added!: (value: unknown) => void
    addDevice.mockReturnValue(new Promise(resolve => (added = resolve)))
    picker.chosen = ['D1']
    await click(find('[data-add]'))
    expect(find('[data-picker]').getAttribute('data-busy')).toBe('yes')
    await act(async () => added({ runs: { proxy: null, exit: null } }))
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('one refused keeps the page: each refusal passed back to the picker by its id, the exit kept to add to', async () => {
    await made()
    addDevice.mockImplementation(async (_exit: string, id: string) =>
      id === 'D2' ? { reason: 'It cannot be an exit (a client only)' } : { runs: { proxy: null, exit: null } }
    )
    picker.chosen = ['D1', 'D2']
    await click(find('[data-add]'))
    expect(addDevice).toHaveBeenCalledTimes(2)
    expect(push).not.toHaveBeenCalled()
    expect(find('[data-picker]').getAttribute('data-refusals')).toBe('D2: It cannot be an exit (a client only)')
    expect(find('[data-picker]').getAttribute('data-busy')).toBe('no')
    expect(find('[data-title]').textContent).toBe('Office')
    expect(reload).toHaveBeenCalledTimes(2)
    addDevice.mockResolvedValue({ runs: { proxy: null, exit: null } })
    picker.chosen = ['D2']
    await click(find('[data-add]'))
    expect(addDevice).toHaveBeenLastCalledWith('xnew', 'D2')
    expect(create).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/exits/xnew')
  })

  it('Not now opens its page with no device added', async () => {
    await made()
    await click(find('[data-skip]'))
    expect(push).toHaveBeenCalledWith('/exits/xnew')
    expect(addDevice).not.toHaveBeenCalled()
  })
})
