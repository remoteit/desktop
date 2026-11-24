import { describe, it, expect, vi, beforeEach } from 'vitest'

/* DEVICES ARE KEPT BY ROW (helpers/rowKey): an organization two people signed in here both belong to is two rows of the
   switcher, and each holds the devices its own sign-in was given. The real store, its effects and selectors; only the
   requests are stood in for. */

const { list, full } = vi.hoisted(() => ({ list: vi.fn(), full: vi.fn() }))

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../services/post', () => ({
  post: async () => 'ERROR',
  postFile: async () => 'ERROR',
  apiError: vi.fn(),
  resetErrorCount: vi.fn(),
}))
vi.mock('../services/graphQLDevice', async importOriginal => ({
  ...(await importOriginal<object>()),
  graphQLFetchDeviceList: list,
  graphQLFetchFullDevice: full,
  graphQLDeviceAdaptor: ({ gqlDevices, accountId }: { gqlDevices: any; accountId: string }) =>
    [gqlDevices].flat().map((device: object) => ({ services: [], permissions: [], ...device, accountId })),
}))

import { store } from '../store'
import { rowKey } from '../helpers/rowKey'
import { getDevices } from '../selectors/devices'
import { requestSignIn, selectActiveRowKey, selectActiveSub } from '../selectors/signIns'
import { selectActiveAccountId } from '../selectors/accounts'

const { dispatch } = store
const WORK = 'sub-work'
const ACME_AS_WORK = rowKey('acme', WORK)

const member = (id: string) =>
  ({ account: { id, email: '' }, name: id, roleId: 'MEMBER', roleName: 'Member', created: new Date(1) } as IMembership)
const answer = (...ids: string[]) => ({
  data: { data: { login: { account: { devices: { total: ids.length, items: ids.map(id => ({ id })) } } } } },
})
const ids = (devices: IDevice[]) => devices.map(device => device.id)
const shown = () => ids(getDevices(store.getState()))
const stored = (row: string) => ids(store.getState().devices[row]?.all || [])
// What each sign-in is given for the organization: asked as the page's own person, or as Work.
const asked = () => list.mock.calls.map(([options, requestFor]) => [options.accountId, requestFor?.sub])

beforeEach(async () => {
  list
    .mockReset()
    .mockImplementation(async (_options: object, requestFor?: { sub?: string }) =>
      requestFor?.sub === WORK ? answer('shared', 'works') : answer('shared', 'mine')
    )
  full.mockReset()
  dispatch.devices.reset()
  dispatch.accounts.reset()
  dispatch.auth.set({ user: { id: 'personal' } as IUser })
  // Personal is the page's own person; Work is signed in beside them. Both belong to Acme.
  dispatch.accounts.set({
    membership: [member('acme')],
    signIns: { [WORK]: { sub: WORK, id: 'work', email: 'work@x.test', membership: [member('acme')] } },
  })
})

describe('an organization two sign-ins reach, one row under each', () => {
  it('holds each row’s devices at once, and shows each when its row is picked — with nothing read again', async () => {
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'mine']))
    expect(selectActiveRowKey(store.getState())).toBe('acme')

    await dispatch.accounts.selectAs({ accountId: 'acme', sub: WORK })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'works']))
    // The selected row is the account — its real id — and the sign-in.
    expect(selectActiveAccountId(store.getState())).toBe('acme')
    expect(selectActiveSub(store.getState())).toBe(WORK)
    expect(selectActiveRowKey(store.getState())).toBe(ACME_AS_WORK)
    // Both are held, each under its own row.
    expect(stored('acme')).toEqual(['shared', 'mine'])
    expect(stored(ACME_AS_WORK)).toEqual(['shared', 'works'])
    expect(asked()).toEqual([
      ['acme', ''],
      ['acme', WORK],
    ])

    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    expect(shown()).toEqual(['shared', 'mine'])
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: WORK })
    expect(shown()).toEqual(['shared', 'works'])
    await new Promise(resolve => setTimeout(resolve))
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('writes an answer that lands after the row changed into the row that asked', async () => {
    let late!: (value: unknown) => void
    list.mockImplementationOnce(() => new Promise(resolve => (late = resolve)))
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    await vi.waitFor(() => expect(late).toBeDefined())
    // The other row is picked, and read, before the first answers.
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: WORK })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'works']))
    late(answer('shared', 'mine'))
    await vi.waitFor(() => expect(stored('acme')).toEqual(['shared', 'mine']))
    expect(store.getState().devices.acme).toMatchObject({ initialized: true, fetching: false, total: 2 })
    // The row looked at is as it was.
    expect(shown()).toEqual(['shared', 'works'])
    expect(stored(ACME_AS_WORK)).toEqual(['shared', 'works'])
  })

  it('writes a device read by id into the row it was asked for, as that row’s sign-in', async () => {
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: WORK })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'works']))
    let late!: (value: unknown) => void
    full.mockImplementationOnce(() => new Promise(resolve => (late = resolve)))
    const reading = dispatch.devices.fetchSingleFull({ id: 'works', silent: true })
    await vi.waitFor(() => expect(late).toBeDefined())
    expect(full.mock.calls[0][4]).toEqual({ sub: WORK, row: true })
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'mine']))
    late({ data: { data: { login: { device: [{ id: 'works', name: 'read as Work' }] } } } })
    await reading
    expect(store.getState().devices[ACME_AS_WORK].all[1]).toMatchObject({ id: 'works', name: 'read as Work' })
    // Not put among the page's own person's, who may not see it.
    expect(stored('acme')).toEqual(['shared', 'mine'])
  })

  it('asks about a device as the sign-in of the row that holds it', async () => {
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'mine']))
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: WORK })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'works']))
    const as = (deviceId: string) => requestSignIn(store.getState(), undefined, { deviceId })
    // Work's row is the selected one: what both rows hold is asked as Work, what only the other holds as its own.
    expect(as('shared')).toBe(WORK)
    expect(as('works')).toBe(WORK)
    expect(as('mine')).toBeUndefined()
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    expect(as('shared')).toBeUndefined()
    expect(as('works')).toBe(WORK)
    // Neither row selected: the page's own person's row first.
    await dispatch.accounts.select('personal')
    expect(as('shared')).toBeUndefined()
    expect(as('works')).toBe(WORK)
  })

  it('drops the rows of a sign-in that leaves, and no other', async () => {
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'mine']))
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: WORK })
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'works']))
    await dispatch.accounts.setSignIns({})
    expect(Object.keys(store.getState().devices).sort()).toEqual(['acme', 'default'])
    // Still selected, and the page's own person's row of it is shown as it was read: nothing asked again.
    expect(selectActiveRowKey(store.getState())).toBe('acme')
    expect(shown()).toEqual(['shared', 'mine'])
    await new Promise(resolve => setTimeout(resolve))
    expect(list).toHaveBeenCalledTimes(2)
  })
})

describe('one sign-in in use', () => {
  it('keeps each account’s devices under the account’s own id, as ever', async () => {
    dispatch.accounts.set({ signIns: {} })
    await dispatch.accounts.select('acme')
    await vi.waitFor(() => expect(shown()).toEqual(['shared', 'mine']))
    await dispatch.accounts.select('personal')
    await vi.waitFor(() => expect(stored('personal')).toEqual(['shared', 'mine']))
    expect(Object.keys(store.getState().devices).sort()).toEqual(['acme', 'default', 'personal'])
    expect(asked()).toEqual([
      ['acme', ''],
      ['personal', ''],
    ])
  })
})
