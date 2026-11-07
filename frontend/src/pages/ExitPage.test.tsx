import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Exit } from '../services/graphQLExits'
import type { ExitDevice } from '../services/graphQLDeviceRuns'

const {
  readExit,
  accountExits,
  rename,
  setActivation,
  deleteExit,
  leaveShare,
  moveUsers,
  addTag,
  removeTag,
  setNetworkExit,
  addDevice,
  reload,
  push,
  route,
  picker,
  after,
} = vi.hoisted(() => ({
  readExit: vi.fn(async (_id: string) => null as any),
  accountExits: vi.fn(async (_accountId: string) => ({ own: [], shared: [] } as any)),
  rename: vi.fn(async (_exit: string, _name: string) => ({} as any)),
  setActivation: vi.fn(async (_exit: string, _activation: string) => ({} as any)),
  deleteExit: vi.fn(async (_exit: string, _confirm: boolean) => ({} as any)),
  leaveShare: vi.fn(async (_exit: string) => ({} as any)),
  moveUsers: vi.fn(async (_from: string, _to: string, _apply: boolean) => ({ users: 0, applied: false } as any)),
  addTag: vi.fn(async (_exit: string, _names: string[]) => ({} as any)),
  removeTag: vi.fn(async (_exit: string, _names: string[]) => ({} as any)),
  setNetworkExit: vi.fn(async (_networkId: string, _exit: string, _available: boolean) => ({} as any)),
  addDevice: vi.fn(async (_exit: string, _deviceId: string) => ({ runs: { proxy: null, exit: null } } as any)),
  reload: vi.fn(),
  push: vi.fn(),
  route: { exitID: 'xoffice' },
  picker: { chosen: [] as string[] },
  after: { runs: null as any },
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }), useParams: () => route }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQL', () => ({
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('../services/graphQLExits', () => ({
  graphQLExit: readExit,
  graphQLAccountExits: accountExits,
  graphQLRenameExit: rename,
  graphQLSetExitActivation: setActivation,
  graphQLDeleteExit: deleteExit,
  graphQLLeaveExitShare: leaveShare,
  graphQLMoveExitUsers: moveUsers,
  graphQLAddExitTag: addTag,
  graphQLRemoveExitTag: removeTag,
  graphQLSetNetworkExit: setNetworkExit,
}))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLAddExitDevice: addDevice }))
// The list beside the page is the store's (hooks/useAccountStore.ts): here, its being read again.
vi.mock('../hooks/useAccountExits', () => ({ useAccountExits: () => ({ value: undefined, reload }) }))
// The picker is its own (RunDevicePicker.tsx): here, what it was given, and the devices chosen in it. Adding them one
// after another is its real addEach.
vi.mock('../selectors/devices', () => ({ getAllDevices: () => [] }))
vi.mock('../components/RunDevicePicker', async () => ({
  ...(await vi.importActual<typeof import('../components/RunDevicePicker')>('../components/RunDevicePicker')),
  RunDevicePicker: ({ kind, target, ownerId, busy, refusals, onAdd }: any) => (
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
    </div>
  ),
}))
// A device it runs is RunListItem's own: here, what it was given, and one of its actions done — answering what the
// device runs after, as RunActions does.
vi.mock('../components/RunListItem', () => ({
  RunListItem: ({ kind, run, name, activation, to, manage, onChanged, lan, onRefresh }: any) => (
    <div
      data-run={run.id}
      data-kind={kind}
      data-name={name}
      data-activation={activation}
      data-to={to}
      data-manage={manage ? 'yes' : 'no'}
      data-lan={lan ? 'yes' : 'no'}
    >
      <button data-acted onClick={() => onChanged(after.runs, { id: run.id, name: run.name || run.id })} />
      <button data-lan-set onClick={onRefresh} />
    </div>
  ),
}))
// The share dialog and the tag editor are their own tests' (ExitShareDialog.test.tsx, ExitTagEditor.test.tsx): here,
// what each was given, and their ways back.
vi.mock('../components/ExitShareDialog', () => ({
  ExitShareDialog: ({ exit, open, onClose, onChanged }: any) =>
    open ? (
      <div data-share-dialog={exit.id}>
        <button data-shared onClick={onChanged} />
        <button data-close onClick={onClose} />
      </div>
    ) : null,
}))
vi.mock('../components/ExitTagEditor', () => ({
  ExitTagEditor: ({ exit, disabled, onAdd, onRemove }: any) => (
    <div data-tag-editor={exit.tags.map((tag: ITag) => tag.name).join('|')} data-disabled={disabled ? 'yes' : 'no'}>
      <button data-tag-add onClick={() => onAdd({ name: 'prod', color: 2 })} />
      {exit.tags.map((tag: ITag) => (
        <button key={tag.name} data-tag-remove={tag.name} onClick={() => onRemove(tag)} />
      ))}
    </div>
  ),
}))
// The name's field: its value, and a name typed and saved.
vi.mock('../components/InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: ({ label, value, disabled, onSave }: any) => (
    <button data-rename={value} disabled={disabled} onClick={() => onSave('  Front office ')}>
      {label}
    </button>
  ),
}))
// The activation's choice: each value a button that chooses it.
vi.mock('../components/SelectSetting', () => ({
  SelectSetting: ({ label, value, values, disabled, onChange }: any) => (
    <div data-select={value}>
      {label}
      {values.map((each: any) => (
        <button key={each.key} data-choose={each.key} disabled={disabled} onClick={() => onChange(each.key)}>
          {each.name}
        </button>
      ))}
    </div>
  ),
}))
// A setting row, by its icon: its label, its line, and its button.
vi.mock('../components/ListItemSetting', () => ({
  ListItemSetting: ({ icon, label, subLabel, button, disabled, onButtonClick }: any) => (
    <div data-setting={icon}>
      <span data-label>{label}</span>
      <span data-sub-label>{subLabel}</span>
      <button disabled={disabled} onClick={onButtonClick}>
        {button}
      </button>
    </div>
  ),
}))
vi.mock('../components/ListItemLocation', () => ({
  ListItemLocation: ({ to, title, children }: any) => (
    <div data-location={to}>
      {title}
      {children}
    </div>
  ),
}))
// A confirmation: its title, what it says, and its action, while open.
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, action, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm={title}>
        <div data-says>{children}</div>
        <button data-confirm-action disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-deny onClick={onDeny} />
      </div>
    ) : null,
}))
// The exit to move the users to: each offered a button that picks it.
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ children, value, onChange }: any) => (
      <div data-move-to={value}>
        {React.Children.map(children, (child: any) => (
          <button data-target={child.props.value} onClick={() => onChange({ target: { value: child.props.value } })}>
            {child.props.children}
          </button>
        ))}
      </div>
    ),
  }
})
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
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, severity = 'info' }: any) => <div data-notice={severity}>{children}</div>,
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, icon, onClick, disabled }: any) => (
    <button data-icon={icon} disabled={disabled} onClick={onClick}>
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

import { ExitPage } from './ExitPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const ME = { id: 'ACCOUNT', email: 'me@example.com' }
const PAT = { id: 'PAT', email: 'pat@example.com' }
const SAM = { id: 'SAM', email: 'sam@example.com' }
const LAB = { name: 'lab', color: 1 }

const share = (user: { id: string; email: string | null }) => ({
  user,
  sharedBy: null,
  created: '2026-11-07T00:00:00Z',
})
const device = (id: string, name: string | null, more: Partial<ExitDevice> = {}): ExitDevice => ({
  id,
  name,
  state: 'ACTIVE',
  joining: false,
  activeSince: null,
  drainingSince: null,
  checks: [],
  established: true,
  offering: true,
  refusal: null,
  health: null,
  disabled: false,
  lan: false,
  lanRefusal: null,
  ...more,
})
const exit = (id: string, name: string, more: Partial<Exit> = {}): Exit => ({
  id,
  name,
  remoteit: false,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  offered: true,
  dormant: false,
  owner: ME,
  devices: [],
  users: 0,
  access: [],
  tags: [],
  networks: [],
  ...more,
})

// Yours: run by two devices, used by two, shared with Sam, tagged, offered on two networks.
const OFFICE = exit('xoffice', 'Office', {
  devices: [device('MAC', 'Office Mac'), device('PI', 'Garage Pi', { state: 'RETIRED', joining: true })],
  users: 2,
  access: [share(SAM)],
  tags: [LAB],
  networks: [
    { id: 'N1', name: 'Home' },
    { id: 'N2', name: 'Shop' },
  ],
})
// Yours: no device runs it, and three devices use it: no device available.
const IDLE = exit('xidle', 'Old Mac', {
  users: 3,
  offered: false,
  dormant: true,
  access: [share(SAM)],
  networks: [{ id: 'N1', name: 'Home' }],
})
// Yours, with no device in service either.
const SPARE = exit('xspare', 'Spare', { offered: false, dormant: true })
// Pat's, shared with you: your own share alone, nothing of managing it.
const PATS = exit('xpat', 'Pat’s exit', {
  owner: PAT,
  manage: false,
  devices: null,
  users: null,
  access: [share(ME)],
  networks: null,
})
// remote.it's, as a remote.it admin managing it reads it.
const PDX = exit('xpdx', 'remote.it pdx1a', {
  remoteit: true,
  location: 'pdx1a',
  provider: 'AWS',
  owner: null,
  devices: [device('E1', 'e1')],
  users: 40,
  networks: [],
})

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(each => each.textContent === text) as HTMLButtonElement
const setting = (icon: string) => find(`[data-setting="${icon}"]`)
const settingButton = (icon: string) => setting(icon).querySelector('button') as HTMLButtonElement
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())
const press = (icon: string) => click(settingButton(icon))
const says = () => [...document.body.querySelectorAll('[data-confirm] [data-says] p')].map(line => line.textContent)
const confirmAction = () => find('[data-confirm-action]') as HTMLButtonElement

let root: Root | undefined
async function mount() {
  if (root) {
    const old = root
    await act(async () => old.unmount())
  }
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<ExitPage />))
}
// The page at an exit's address, as graphql reads it.
async function render(read: Exit | null | string, id = read && typeof read === 'object' ? read.id : 'xnone') {
  route.exitID = id
  readExit.mockResolvedValue(read)
  await mount()
}

beforeEach(() => {
  for (const mock of [rename, setActivation, deleteExit, leaveShare, addTag, removeTag, setNetworkExit])
    mock.mockReset().mockResolvedValue({})
  readExit.mockReset().mockResolvedValue(null)
  accountExits.mockReset().mockResolvedValue({ own: [], shared: [] })
  moveUsers.mockReset().mockResolvedValue({ users: 0, applied: false })
  addDevice.mockReset().mockResolvedValue({ runs: { proxy: null, exit: null } })
  reload.mockReset()
  push.mockReset()
  picker.chosen = []
  after.runs = { proxy: null, exit: null }
})

describe('one of your exits', () => {
  it('is read by the id in its address, and says its name and the devices using it', async () => {
    await render(OFFICE)
    expect(readExit).toHaveBeenCalledWith('xoffice')
    expect(find('[data-title]').textContent).toBe('Office')
    expect(find('[data-header]').textContent).toContain('2 devices use it as their exit')
    expect(find('[data-notice]')).toBeNull()
  })

  it('with none of its devices carrying its traffic, warns there is no device available; with none taking traffic, says so', async () => {
    await render(IDLE)
    expect(find('[data-notice="warning"]').textContent).toBe(
      'No device available: none of its devices carries its traffic, so the devices using it go their usual way until one does.'
    )
    // Its device in service, carrying nothing — its exit node off on the machine —: dormant all the same.
    await render({ ...OFFICE, offered: false, dormant: true })
    expect(find('[data-notice="warning"]').textContent).toContain('No device available: none of its devices carries')
    await render({ ...OFFICE, offered: false })
    expect(find('[data-notice="warning"]').textContent).toBe('None of its devices takes traffic now.')
  })

  it('is renamed, its name trimmed, then read again with the list beside it', async () => {
    await render(OFFICE)
    expect(find('[data-rename]').getAttribute('data-rename')).toBe('Office')
    await click(find('[data-rename]'))
    expect(rename).toHaveBeenCalledWith('xoffice', 'Front office')
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(find('[data-notice]')).toBeNull()
  })

  it('sets how a device added goes into service, then is read again with the list beside it', async () => {
    await render(OFFICE)
    expect(find('[data-select]').getAttribute('data-select')).toBe('auto')
    expect(find('[data-select]').textContent).toContain('A device added goes into service')
    expect(find('[data-choose="admin"]').textContent).toBe('When an admin puts it in service')
    await click(find('[data-choose="admin"]'))
    expect(setActivation).toHaveBeenCalledWith('xoffice', 'admin')
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('a change refused is said above in graphql’s words, or that it was not changed; one that goes through clears it', async () => {
    await render(OFFICE)
    rename.mockResolvedValue({ reason: 'An exit’s name is 1 to 255 characters' })
    await click(find('[data-rename]'))
    expect(find('[data-notice="error"]').textContent).toBe('An exit’s name is 1 to 255 characters')
    expect(readExit).toHaveBeenCalledTimes(2)
    rename.mockResolvedValue('ERROR')
    await click(find('[data-rename]'))
    expect(find('[data-notice="error"]').textContent).toBe('It was not changed: try again.')
    await click(find('[data-choose="admin"]'))
    expect(find('[data-notice]')).toBeNull()
  })

  it('while a change is made, what would change it again is off', async () => {
    await render(OFFICE)
    let renamed!: (value: unknown) => void
    rename.mockReturnValue(new Promise(resolve => (renamed = resolve)))
    await click(find('[data-rename]'))
    expect((find('[data-rename]') as HTMLButtonElement).disabled).toBe(true)
    expect((find('[data-choose="auto"]') as HTMLButtonElement).disabled).toBe(true)
    expect(button('Add devices').disabled).toBe(true)
    expect(settingButton('user-group').disabled).toBe(true)
    expect(find('[data-tag-editor]').getAttribute('data-disabled')).toBe('yes')
    expect(button('Stop offering it on Home').disabled).toBe(true)
    await act(async () => renamed({}))
    expect((find('[data-rename]') as HTMLButtonElement).disabled).toBe(false)
    expect(find('[data-tag-editor]').getAttribute('data-disabled')).toBe('no')
  })
})

describe('the devices it runs on', () => {
  it('each with its actions in this exit, leading to the device’s runs', async () => {
    await render(OFFICE)
    const mac = find('[data-runs-on] [data-run="MAC"]')
    expect(mac.getAttribute('data-kind')).toBe('exit')
    expect(mac.getAttribute('data-name')).toBe('Office')
    expect(mac.getAttribute('data-activation')).toBe('auto')
    expect(mac.getAttribute('data-to')).toBe('/devices/MAC/runs')
    expect(mac.getAttribute('data-manage')).toBe('yes')
    expect(find('[data-runs-on] [data-run="PI"]')).not.toBeNull()
    expect(find('[data-runs-on]').textContent).not.toContain('No device runs it')
  })

  it('none: says to add one', async () => {
    await render(IDLE)
    expect(find('[data-run]')).toBeNull()
    expect(find('[data-runs-on]').textContent).toContain('No device runs it: add one to carry its traffic.')
  })

  it('an action on one says what the device runs after, and the exit is read again with the list beside it', async () => {
    await render(OFFICE)
    after.runs = {
      proxy: null,
      exit: {
        ...device('MAC', 'Office Mac', { state: 'DRAINING' }),
        exit: { id: 'xoffice', name: 'Office', remoteit: false },
      },
    }
    await click(find('[data-run="MAC"] [data-acted]'))
    expect(find('[data-notice="info"]').textContent).toBe('Office Mac runs the exit Office (draining).')
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
    after.runs = { proxy: null, exit: null }
    await click(find('[data-run="PI"] [data-acted]'))
    expect(find('[data-notice="info"]').textContent).toBe('Garage Pi runs no proxy or exit now.')
  })
})

describe('adding devices to it', () => {
  it('Add devices opens the picker for its account’s devices, those running it already left out', async () => {
    await render(OFFICE)
    expect(find('[data-picker]')).toBeNull()
    await click(button('Add devices'))
    const shown = find('[data-picker]')
    expect(shown.getAttribute('data-picker')).toBe('exit')
    expect(shown.getAttribute('data-owner')).toBe('ACCOUNT')
    expect(shown.getAttribute('data-for')).toBe('xoffice')
    expect(shown.getAttribute('data-refusals')).toBe('')
  })

  it('those chosen are added one after another; with none refused, the picker closes and the exit is read again', async () => {
    await render(OFFICE)
    await click(button('Add devices'))
    picker.chosen = ['D1', 'D2']
    await click(find('[data-add]'))
    expect(addDevice.mock.calls).toEqual([
      ['xoffice', 'D1'],
      ['xoffice', 'D2'],
    ])
    expect(find('[data-picker]')).toBeNull()
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('one refused is passed back to the picker by its id in graphql’s words, and the picker stays to choose again', async () => {
    await render(OFFICE)
    await click(button('Add devices'))
    addDevice.mockImplementation(async (_exit: string, id: string) =>
      id === 'D2'
        ? { reason: 'Its daemon is not online to say whether it can be an exit' }
        : { runs: { proxy: null, exit: null } }
    )
    picker.chosen = ['D1', 'D2']
    await click(find('[data-add]'))
    expect(addDevice).toHaveBeenCalledTimes(2)
    expect(find('[data-picker]').getAttribute('data-refusals')).toBe(
      'D2: Its daemon is not online to say whether it can be an exit'
    )
    expect(find('[data-picker]').getAttribute('data-busy')).toBe('no')
    expect(readExit).toHaveBeenCalledTimes(2)
  })

  it('Cancel closes the picker, and it opens again with no refusals', async () => {
    await render(OFFICE)
    await click(button('Add devices'))
    addDevice.mockResolvedValue({ reason: 'It cannot be an exit (a client only)' })
    picker.chosen = ['D1']
    await click(find('[data-add]'))
    expect(find('[data-picker]').getAttribute('data-refusals')).toBe('D1: It cannot be an exit (a client only)')
    await click(button('Cancel'))
    expect(find('[data-picker]')).toBeNull()
    await click(button('Add devices'))
    expect(find('[data-picker]').getAttribute('data-refusals')).toBe('')
  })
})

describe('who it is shared with, its tags, and its networks', () => {
  it('says who it is shared with; Share opens its dialog, and a change there reads the exit again', async () => {
    await render({ ...OFFICE, access: [share(SAM), share({ id: 'NOMAIL', email: null })] })
    expect(setting('user-group').querySelector('[data-label]')?.textContent).toBe('Shared with sam@example.com, NOMAIL')
    expect(find('[data-share-dialog]')).toBeNull()
    await press('user-group')
    expect(find('[data-share-dialog]').getAttribute('data-share-dialog')).toBe('xoffice')
    await click(find('[data-shared]'))
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
    await click(find('[data-close]'))
    expect(find('[data-share-dialog]')).toBeNull()
  })

  it('shared with no one: said so', async () => {
    await render({ ...OFFICE, access: [] })
    expect(setting('user-group').querySelector('[data-label]')?.textContent).toBe('Shared with no one')
  })

  it('a tag added or taken off is asked of graphql by its name, and the exit read again', async () => {
    await render(OFFICE)
    expect(find('[data-tag-editor]').getAttribute('data-tag-editor')).toBe('lab')
    await click(find('[data-tag-add]'))
    expect(addTag).toHaveBeenCalledWith('xoffice', ['prod'])
    await click(find('[data-tag-remove="lab"]'))
    expect(removeTag).toHaveBeenCalledWith('xoffice', ['lab'])
    expect(readExit).toHaveBeenCalledTimes(3)
  })

  it('lists the networks it is offered on, each leading to its network; one taken off stops its being offered there', async () => {
    await render(OFFICE)
    const networks = [...document.body.querySelectorAll('[data-networks] [data-location]')]
    expect(networks.map(each => each.getAttribute('data-location'))).toEqual(['/networks/N1', '/networks/N2'])
    expect(networks[1].textContent).toContain('Shop')
    await click(button('Stop offering it on Shop'))
    expect(setNetworkExit).toHaveBeenCalledWith('N2', 'xoffice', false)
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('offered on no network: says where it is made available', async () => {
    await render({ ...OFFICE, networks: [] })
    expect(find('[data-networks] [data-location]')).toBeNull()
    expect(find('[data-networks]').textContent).toContain(
      'On no network: make it available from a network’s page, for the devices initiating there.'
    )
  })
})

describe('deleting it', () => {
  it('is off while devices run it, saying to take them out first', async () => {
    await render(OFFICE)
    expect(settingButton('trash').disabled).toBe(true)
    expect(setting('trash').querySelector('[data-sub-label]')?.textContent).toBe('Take its devices out of it first')
    await render(IDLE)
    expect(settingButton('trash').disabled).toBe(false)
    expect(setting('trash').querySelector('[data-sub-label]')?.textContent).toBe(
      'It is kept until it is deleted, with no device running it too'
    )
  })

  it('says what goes with it; denied, nothing is deleted', async () => {
    await render(IDLE)
    expect(find('[data-confirm]')).toBeNull()
    await press('trash')
    expect(find('[data-confirm]').getAttribute('data-confirm')).toBe('Delete Old Mac?')
    expect(says()).toEqual([
      'The 3 devices using it as their exit lose it, and go their usual way.',
      'Its shares with sam@example.com end.',
      'It is no longer offered on Home.',
    ])
    await click(find('[data-deny]'))
    expect(find('[data-confirm]')).toBeNull()
    expect(deleteExit).not.toHaveBeenCalled()
  })

  it('one devices use is deleted confirmed, and the list opens', async () => {
    await render(IDLE)
    await press('trash')
    readExit.mockResolvedValue(null)
    await click(confirmAction())
    expect(deleteExit).toHaveBeenCalledWith('xidle', true)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/exits')
  })

  it('one nothing uses is deleted unconfirmed: nothing else changes, as said', async () => {
    await render({ ...IDLE, users: 0, access: [], networks: [] })
    await press('trash')
    expect(says()).toEqual(['Nothing else changes: nothing uses it.'])
    readExit.mockResolvedValue(null)
    await click(confirmAction())
    expect(deleteExit).toHaveBeenCalledWith('xidle', false)
    expect(push).toHaveBeenCalledWith('/exits')
  })

  it('refused: said on the page in graphql’s words, or that it was not deleted, and the page stays', async () => {
    await render(IDLE)
    deleteExit.mockResolvedValue({ reason: 'A device was added to it meanwhile: take it out first' })
    await press('trash')
    await click(confirmAction())
    expect(find('[data-confirm]')).toBeNull()
    expect(find('[data-notice="error"]').textContent).toBe('A device was added to it meanwhile: take it out first')
    expect(find('[data-title]').textContent).toBe('Old Mac')
    deleteExit.mockResolvedValue('ERROR')
    await press('trash')
    await click(confirmAction())
    expect(find('[data-notice="error"]').textContent).toBe('It was not deleted.')
    expect(push).not.toHaveBeenCalled()
  })
})

describe('moving its users to another exit', () => {
  const targets = () =>
    [...document.body.querySelectorAll('[data-target]')].map(each => each.getAttribute('data-target'))

  it('is offered once no device runs it while devices use it', async () => {
    await render(OFFICE)
    expect(setting('arrow-right-arrow-left')).toBeNull()
    await render({ ...IDLE, users: 0 })
    expect(setting('arrow-right-arrow-left')).toBeNull()
    await render(IDLE)
    expect(setting('arrow-right-arrow-left').querySelector('[data-sub-label]')?.textContent).toBe(
      '3 devices use it as their exit'
    )
  })

  it('offers its account’s other exits with a device in service', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE, SPARE], shared: [PATS] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    expect(accountExits).toHaveBeenCalledWith('ACCOUNT')
    expect(find('[data-confirm]').getAttribute('data-confirm')).toBe('Move the users of Old Mac')
    expect(targets()).toEqual(['xoffice'])
    expect(confirmAction().disabled).toBe(true)
  })

  it('the move is said first — how many devices, to which exit — then made, and the exit read again', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE], shared: [] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    moveUsers.mockResolvedValue({ users: 3, applied: false })
    await click(find('[data-target="xoffice"]'))
    expect(moveUsers).toHaveBeenCalledWith('xidle', 'xoffice', false)
    expect(find('[data-move-preview]').textContent).toBe('3 devices go out through Office from now on.')
    expect(confirmAction().disabled).toBe(false)
    expect(readExit).toHaveBeenCalledTimes(1)
    moveUsers.mockResolvedValue({ users: 3, applied: true })
    readExit.mockResolvedValue({ ...IDLE, users: 0 })
    await click(confirmAction())
    expect(moveUsers).toHaveBeenLastCalledWith('xidle', 'xoffice', true)
    expect(find('[data-confirm]')).toBeNull()
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(setting('arrow-right-arrow-left')).toBeNull()
  })

  it('one device to move is said as one', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE], shared: [] })
    await render({ ...IDLE, users: 1 })
    await press('arrow-right-arrow-left')
    moveUsers.mockResolvedValue({ users: 1, applied: false })
    await click(find('[data-target="xoffice"]'))
    expect(find('[data-move-preview]').textContent).toBe('1 device goes out through Office from now on.')
  })

  it('a move refused as it is said is shown in graphql’s words, with no Move', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE], shared: [] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    moveUsers.mockResolvedValue({ reason: 'Office has no device in service' })
    await click(find('[data-target="xoffice"]'))
    expect(find('[data-confirm] [data-notice="error"]').textContent).toBe('Office has no device in service')
    expect(find('[data-move-preview]')).toBeNull()
    expect(confirmAction().disabled).toBe(true)
  })

  it('a move refused as it is made is shown, the dialog left open and nothing read again; denied, it closes', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE], shared: [] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    moveUsers.mockResolvedValue({ users: 3, applied: false })
    await click(find('[data-target="xoffice"]'))
    moveUsers.mockResolvedValue({ reason: 'Office went dormant meanwhile' })
    await click(confirmAction())
    expect(find('[data-confirm] [data-notice="error"]').textContent).toBe('Office went dormant meanwhile')
    expect(confirmAction().disabled).toBe(true)
    expect(readExit).toHaveBeenCalledTimes(1)
    await click(find('[data-deny]'))
    expect(find('[data-confirm]')).toBeNull()
  })

  it('no other exit of its account to take them: said so', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, SPARE], shared: [] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    expect(targets()).toEqual([])
    expect(find('[data-confirm]').textContent).toContain(
      'No other exit of its account has a device in service to take them.'
    )
    expect(confirmAction().disabled).toBe(true)
  })
})

describe('an exit shared with you', () => {
  it('says whose it is, with nothing of managing it, and offers to leave it', async () => {
    await render(PATS)
    expect(find('[data-header]').textContent).toContain('Shared with you by pat@example.com')
    expect(find('[data-rename]')).toBeNull()
    expect(find('[data-select]')).toBeNull()
    expect(find('[data-runs-on]')).toBeNull()
    expect(setting('user-group')).toBeNull()
    expect(find('[data-tag-editor]')).toBeNull()
    expect(find('[data-networks]')).toBeNull()
    expect(setting('trash')).toBeNull()
    expect(setting('arrow-right-from-bracket').querySelector('[data-label]')?.textContent).toBe('Leave this exit')
  })

  it('says when a device of yours may not choose it now', async () => {
    await render({ ...PATS, offered: false, dormant: true })
    expect(find('[data-notice="warning"]').textContent).toContain('No device available')
  })

  it('leaving it is confirmed, then the list opens', async () => {
    await render(PATS)
    await press('arrow-right-from-bracket')
    expect(find('[data-confirm]').getAttribute('data-confirm')).toBe('Leave Pat’s exit?')
    expect(find('[data-confirm]').textContent).toContain(
      'You can no longer use it as an exit: a device of yours using it goes its usual way.'
    )
    readExit.mockResolvedValue(null)
    await click(confirmAction())
    expect(leaveShare).toHaveBeenCalledWith('xpat')
    expect(reload).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/exits')
  })

  it('a leave refused is said in graphql’s words, or that it was not left, and the page stays', async () => {
    await render(PATS)
    leaveShare.mockResolvedValue({ reason: 'It is not shared with you' })
    await press('arrow-right-from-bracket')
    await click(confirmAction())
    expect(find('[data-confirm]')).toBeNull()
    expect(find('[data-notice="error"]').textContent).toBe('It is not shared with you')
    leaveShare.mockResolvedValue('ERROR')
    await press('arrow-right-from-bracket')
    await click(confirmAction())
    expect(find('[data-notice="error"]').textContent).toBe('It was not left.')
    expect(push).not.toHaveBeenCalled()
  })

  it('one graphql says you manage, though its devices are not read: managed all the same', async () => {
    await render({ ...OFFICE, devices: null })
    expect(find('[data-select]')).not.toBeNull()
    expect(find('[data-runs-on]')).not.toBeNull()
  })

  it('one you reach by your role, not shared with you: nothing to leave', async () => {
    await render({ ...PATS, access: [] })
    expect(setting('arrow-right-from-bracket')).toBeNull()
  })
})

describe('one of remote.it’s exits', () => {
  it('for a remote.it admin: where it is, its activation and devices; nothing of an own exit’s', async () => {
    await render(PDX)
    expect(find('[data-header]').textContent).toContain('One of remote.it’s exits · AWS')
    expect(find('[data-select]')).not.toBeNull()
    expect(find('[data-runs-on] [data-run="E1"]')).not.toBeNull()
    expect(find('[data-rename]')).toBeNull()
    expect(button('Add devices')).toBeUndefined()
    expect(setting('user-group')).toBeNull()
    expect(find('[data-networks]')).toBeNull()
    expect(setting('trash')).toBeNull()
  })

  it('for anyone else: where it is, and nothing to change or leave', async () => {
    await render({ ...PDX, manage: false, devices: null, users: null, networks: null })
    expect(find('[data-header]').textContent).toContain('One of remote.it’s exits · AWS')
    expect(find('[data-select]')).toBeNull()
    expect(find('[data-runs-on]')).toBeNull()
    expect(setting('arrow-right-from-bracket')).toBeNull()
  })
})

describe('the exit not to be had', () => {
  it('while it is read: loading', async () => {
    route.exitID = 'xoffice'
    readExit.mockReturnValue(new Promise(() => undefined))
    await mount()
    expect(find('[data-loading]')).not.toBeNull()
  })

  it('none, not yours to see, or an API without exits: said', async () => {
    for (const read of [null, 'UNSUPPORTED']) {
      await render(read)
      expect(find('[data-notice]').getAttribute('data-notice')).toBe('info')
      expect(find('[data-notice]').textContent).toBe('No such exit, or not one you may see.')
      expect(find('[data-title]')).toBeNull()
    }
  })

  it('one that could not be read: said as an error', async () => {
    await render('ERROR')
    expect(find('[data-notice]').getAttribute('data-notice')).toBe('error')
    expect(find('[data-notice]').textContent).toBe('The exit could not be read.')
  })
})

describe('another exit’s address', () => {
  it('reads that exit, the last one’s notice and picker gone', async () => {
    await render(OFFICE)
    rename.mockResolvedValue({ reason: 'Not now' })
    await click(find('[data-rename]'))
    await click(button('Add devices'))
    expect(find('[data-notice="error"]')).not.toBeNull()
    expect(find('[data-picker]')).not.toBeNull()
    route.exitID = 'xidle'
    readExit.mockResolvedValue(IDLE)
    await act(async () => root!.render(<ExitPage />))
    expect(readExit).toHaveBeenLastCalledWith('xidle')
    expect(find('[data-title]').textContent).toBe('Old Mac')
    expect(find('[data-notice="error"]')).toBeNull()
    expect(find('[data-picker]')).toBeNull()
  })
})

describe('its devices’ local network', () => {
  it('set on each device of an own exit, the exit read again after; never on remote.it’s', async () => {
    await render(OFFICE)
    expect(find('[data-run="MAC"]').getAttribute('data-lan')).toBe('yes')
    await click(find('[data-run="MAC"] [data-lan-set]'))
    expect(readExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalled()
    await render(PDX)
    expect(find('[data-run="E1"]').getAttribute('data-lan')).toBe('no')
  })
})

describe('another exit’s address, with a dialog open or an answer still to come', () => {
  it('closes the last exit’s dialogs: none is left to act on the next one', async () => {
    await render(IDLE)
    await press('trash')
    expect(find('[data-confirm]').getAttribute('data-confirm')).toBe('Delete Old Mac?')
    route.exitID = 'xspare'
    readExit.mockResolvedValue(SPARE)
    await act(async () => root!.render(<ExitPage />))
    expect(find('[data-title]').textContent).toBe('Spare')
    expect(find('[data-confirm]')).toBeNull()
    expect(deleteExit).not.toHaveBeenCalled()

    // The share dialog and the move dialog too.
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE], shared: [] })
    await render(IDLE)
    await press('user-group')
    await press('arrow-right-arrow-left')
    expect(find('[data-share-dialog]')).not.toBeNull()
    route.exitID = 'xoffice'
    readExit.mockResolvedValue(OFFICE)
    await act(async () => root!.render(<ExitPage />))
    expect(find('[data-share-dialog]')).toBeNull()
    expect(find('[data-confirm]')).toBeNull()
  })

  it('shows the exit at its address, whichever read is answered first', async () => {
    const answers: Record<string, (exit: Exit) => void> = {}
    readExit.mockImplementation((id: string) => new Promise(resolve => (answers[id] = resolve)))
    route.exitID = 'xidle'
    await mount()
    route.exitID = 'xspare'
    await act(async () => root!.render(<ExitPage />))
    await act(async () => answers.xspare(SPARE))
    await act(async () => answers.xidle(IDLE))
    expect(find('[data-title]').textContent).toBe('Spare')
  })

  it('a read answered late after a newer one is not shown over it', async () => {
    await render(OFFICE)
    const answers: ((exit: Exit) => void)[] = []
    readExit.mockImplementation(() => new Promise(resolve => answers.push(resolve)))
    // Two actions on its devices, each reading the exit again.
    await click(find('[data-run="MAC"] [data-acted]'))
    await click(find('[data-run="PI"] [data-acted]'))
    expect(answers).toHaveLength(2)
    await act(async () => answers[1]({ ...OFFICE, name: 'Newest' }))
    await act(async () => answers[0]({ ...OFFICE, name: 'Older' }))
    expect(find('[data-title]').textContent).toBe('Newest')
  })
})

describe('the move said for the exit chosen last', () => {
  it('an earlier choice’s answer, come late, is not shown for the later one', async () => {
    const BUSY = exit('xbusy', 'Busy', { devices: [device('NUC', 'Nuc')] })
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE, BUSY], shared: [] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    const answers: Record<string, (said: any) => void> = {}
    moveUsers.mockImplementation((_from: string, to: string) => new Promise(resolve => (answers[to] = resolve)))
    await click(find('[data-target="xoffice"]'))
    await click(find('[data-target="xbusy"]'))
    await act(async () => answers.xbusy({ users: 3, applied: false }))
    await act(async () => answers.xoffice({ reason: 'Office has no device in service' }))
    expect(find('[data-move-preview]').textContent).toBe('3 devices go out through Busy from now on.')
    expect(find('[data-confirm] [data-notice="error"]')).toBeNull()
    expect(confirmAction().disabled).toBe(false)
  })

  it('its account’s exits not read: said so, not that none can take them', async () => {
    accountExits.mockResolvedValue('ERROR')
    await render(IDLE)
    await press('arrow-right-arrow-left')
    expect(find('[data-confirm] [data-notice="error"]').textContent).toBe(
      'Its account’s exits could not be read: try again.'
    )
    expect(find('[data-confirm]').textContent).not.toContain('No other exit of its account')
  })

  it('a move refused as it is made, with no words, says it was not made', async () => {
    accountExits.mockResolvedValue({ own: [IDLE, OFFICE], shared: [] })
    await render(IDLE)
    await press('arrow-right-arrow-left')
    moveUsers.mockResolvedValue({ users: 3, applied: false })
    await click(find('[data-target="xoffice"]'))
    moveUsers.mockResolvedValue({ reason: '' })
    await click(confirmAction())
    expect(find('[data-confirm] [data-notice="error"]').textContent).toBe('The move was not made: try again.')
  })
})

describe('one of remote.it’s exits with no provider said', () => {
  it('says where it is by its location, never a dot with nothing after it', async () => {
    await render({ ...PDX, provider: '' })
    expect(find('[data-header]').textContent).toContain('One of remote.it’s exits · pdx1a')
    await render({ ...PDX, provider: '', location: null })
    expect(find('[data-header]').textContent).toContain('One of remote.it’s exits')
    expect(find('[data-header]').textContent).not.toContain('·')
  })
})

