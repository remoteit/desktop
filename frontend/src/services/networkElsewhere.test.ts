import { describe, it, expect, vi, beforeEach } from 'vitest'

/* A network's page opened at its address, the network not among those of the row looked at: each other row's list is
   read as that row's sign-in, and the first that has it is selected (services/networkElsewhere, services/elsewhere). */

const { state, selectAs, deviceNetworks, preloadNetworks } = vi.hoisted(() => ({
  state: {} as Record<string, any>,
  selectAs: vi.fn(),
  deviceNetworks: vi.fn(),
  preloadNetworks: vi.fn(),
}))
// A new object each time, as the store's is after any change: what is worked out of it is not kept across tests.
vi.mock('../store', () => ({ store: { getState: () => ({ ...state }), dispatch: { accounts: { selectAs } } } }))
vi.mock('./graphQLDeviceNetworks', () => ({ graphQLDeviceNetworks: deviceNetworks }))
vi.mock('./graphQLRequest', () => ({ graphQLPreloadNetworks: preloadNetworks }))

import { findDeviceNetworkElsewhere, findStoredNetworkElsewhere } from './networkElsewhere'
import { resetElsewhere } from './elsewhere'
import { requestSignIn, resetNotedAccounts } from '../selectors/signIns'
import { rowKey } from '../helpers/rowKey'

const WORK = 'sub-work'
const member = (id: string) => ({ account: { id, email: '' } })
// Personal is the page's own person, a member of Acme — the row looked at. Work is signed in beside them: its own
// account, and Labs, whose network `net-labs` only Work is given.
const several = () =>
  Object.assign(state, {
    auth: { user: { id: 'personal' } },
    user: { id: 'personal', email: 'personal@x.test' },
    accounts: {
      activeId: 'acme',
      activeSub: '',
      membership: [member('acme')],
      signIns: { [WORK]: { sub: WORK, id: 'work', email: 'work@x.test', membership: [member('labs')] } },
    },
    devices: {},
  })
const listed = (accountId: string, sub?: string) => (accountId === 'labs' && sub === WORK ? [{ id: 'net-labs' }] : [])
const stored = (networks: object[]) => ({ data: { data: { login: { account: { networks } } } } })
// Who each list was asked of, and as.
const asked = (read: ReturnType<typeof vi.fn>) =>
  read.mock.calls.map(([accountId, requestFor]) => [accountId, requestFor?.sub])

beforeEach(() => {
  resetElsewhere()
  resetNotedAccounts()
  selectAs.mockReset()
  deviceNetworks
    .mockReset()
    .mockImplementation(async (accountId: string, requestFor?: { sub: string }) => listed(accountId, requestFor?.sub))
  preloadNetworks
    .mockReset()
    .mockImplementation(async (accountId: string, requestFor?: { sub: string }) =>
      stored(listed(accountId, requestFor?.sub))
    )
  several()
})

describe.each([
  { pages: 'the device networks’ page', find: findDeviceNetworkElsewhere, read: deviceNetworks, failure: 'ERROR' },
  {
    pages: 'the pages that read the store’s networks',
    find: findStoredNetworkElsewhere,
    read: preloadNetworks,
    failure: 'ERROR',
  },
])('a network opened at its address from $pages', ({ find, read, failure }) => {
  it('is found in the row of the sign-in that has it: that row is selected, and the network is its from then on', async () => {
    const found = await find('net-labs')
    expect(found).toBeTruthy()
    // Every other row, in the sign-ins' order, each as its own sign-in — and not the row looked at, already read.
    expect(asked(read)).toEqual([
      ['personal', ''],
      ['work', WORK],
      ['labs', WORK],
    ])
    expect(selectAs.mock.calls).toEqual([[{ accountId: 'labs', sub: WORK }]])
    expect(requestSignIn({ ...state } as any, undefined, { networkId: 'net-labs' })).toBe(WORK)
  })

  it('asks nothing with one sign-in in use', async () => {
    state.accounts = { ...state.accounts, signIns: {} }
    expect(await find('net-labs')).toBeFalsy()
    expect(read).not.toHaveBeenCalled()
    expect(selectAs).not.toHaveBeenCalled()
  })

  it('is asked for once where it is nowhere', async () => {
    expect(await find('net-nowhere')).toBeFalsy()
    expect(read).toHaveBeenCalledTimes(3)
    expect(await find('net-nowhere')).toBeFalsy()
    expect(read).toHaveBeenCalledTimes(3)
    expect(selectAs).not.toHaveBeenCalled()
  })

  it('is asked for again where a row could not be read: a failed read is not a miss', async () => {
    read.mockImplementation(async (_accountId: string, requestFor?: { sub: string }) =>
      requestFor?.sub === WORK ? failure : find === findStoredNetworkElsewhere ? stored([]) : []
    )
    expect(await find('net-labs')).toBeFalsy()
    expect(selectAs).not.toHaveBeenCalled()
    read.mockImplementation(async (accountId: string, requestFor?: { sub: string }) => {
      const networks = listed(accountId, requestFor?.sub)
      return find === findStoredNetworkElsewhere ? stored(networks) : networks
    })
    expect(await find('net-labs')).toBeTruthy()
    expect(selectAs.mock.calls).toEqual([[{ accountId: 'labs', sub: WORK }]])
  })
})

describe('what is found', () => {
  it('is the row and its list as just read, for the device networks’ page to show without reading it again', async () => {
    expect(await findDeviceNetworkElsewhere('net-labs')).toEqual({
      row: rowKey('labs', WORK),
      networks: [{ id: 'net-labs' }],
    })
  })

  it('is never one of the built-in groups of the classic pages', async () => {
    expect(await findStoredNetworkElsewhere('local')).toBe(false)
    expect(preloadNetworks).not.toHaveBeenCalled()
  })

  it('an API without device networks is a row not asked, not a miss', async () => {
    deviceNetworks.mockResolvedValue(Symbol('unsupported'))
    expect(await findDeviceNetworkElsewhere('net-labs')).toBeUndefined()
    deviceNetworks.mockImplementation(async (accountId: string, requestFor?: { sub: string }) =>
      listed(accountId, requestFor?.sub)
    )
    expect(await findDeviceNetworkElsewhere('net-labs')).toBeTruthy()
  })
})
