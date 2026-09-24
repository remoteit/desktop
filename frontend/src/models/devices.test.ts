import { describe, it, expect, vi, beforeEach } from 'vitest'

const { graphQLFetchDeviceList, graphQLDeviceAdaptor } = vi.hoisted(() => ({
  graphQLFetchDeviceList: vi.fn(),
  graphQLDeviceAdaptor: vi.fn(),
}))
vi.mock('../services/graphQLDevice', () => ({ graphQLFetchDeviceList, graphQLDeviceAdaptor }))
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('../services/graphQLRequest', () => ({}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'acct' }))
vi.mock('../selectors/devices', () => ({
  selectDeviceModelAttributes: (state: any) => state.devices.acct,
  selectActiveColumns: () => [],
}))
vi.mock('../selectors/ui', () => ({ selectTimeSeries: () => ({}) }))
vi.mock('../selectors/organizations', () => ({}))

import devices, { defaultState } from './devices'

const stateWith = (over: Partial<typeof defaultState> = {}) => ({ devices: { acct: { ...defaultState, ...over } } })

let dispatch: any
const effects = () => {
  const all = (devices as any).effects(dispatch)
  dispatch.devices.graphQLListProcessor = all.graphQLListProcessor
  return all
}

beforeEach(() => {
  vi.resetAllMocks()
  dispatch = {
    devices: { set: vi.fn(), fetchList: vi.fn() },
    accounts: { truncateMergeDevices: vi.fn(), appendUniqueDevices: vi.fn() },
    search: { updateSearch: vi.fn() },
  }
})

describe('a failed device list fetch keeps the held list', () => {
  it.each([{ query: 'new' }, { searched: true, append: true }])(
    'writes no devices, totals, initialized or appliedName and reports failure (%o)',
    async over => {
      graphQLFetchDeviceList.mockResolvedValue('ERROR')
      expect(await effects().fetchList(undefined, stateWith(over))).toBe(false)
      expect(dispatch.devices.set.mock.calls).toEqual([
        [{ fetching: true, accountId: 'acct' }],
        [{ fetching: false, append: false, accountId: 'acct' }],
      ])
      expect(dispatch.accounts.truncateMergeDevices).not.toHaveBeenCalled()
      expect(dispatch.accounts.appendUniqueDevices).not.toHaveBeenCalled()
      expect(dispatch.search.updateSearch).not.toHaveBeenCalled()
    }
  )

  it('a successful fetch still replaces the list and marks it initialized', async () => {
    const fetched = { id: 'd1' }
    graphQLFetchDeviceList.mockResolvedValue({ data: { data: { login: { account: { devices: { total: 1 } } } } } })
    graphQLDeviceAdaptor.mockReturnValue([fetched])
    expect(await effects().fetchList(undefined, stateWith({ query: 'new' }))).toBe(true)
    expect(dispatch.accounts.truncateMergeDevices).toHaveBeenCalledWith({ devices: [fetched], accountId: 'acct' })
    expect(dispatch.devices.set.mock.calls).toEqual([
      [{ fetching: true, accountId: 'acct' }],
      [{ total: 1, accountId: 'acct' }],
      [{ fetching: false, append: false, initialized: true, appliedName: 'new', accountId: 'acct' }],
    ])
  })

  it('fetchPage puts the held page back when its fetch fails', async () => {
    dispatch.devices.fetchList.mockResolvedValue(false)
    await effects().fetchPage({ from: 100, append: true }, stateWith({ from: 50 }))
    expect(dispatch.devices.set.mock.calls).toEqual([
      [{ from: 100, append: true, accountId: 'acct' }],
      [{ from: 50, accountId: 'acct' }],
    ])
  })
})
