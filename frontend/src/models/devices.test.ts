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

const held = { id: 'd1', name: 'Held' }
const fetched = { id: 'd2', name: 'Fetched' }
const stateWith = (over: Partial<typeof defaultState> = {}) => ({
  devices: {
    acct: { ...defaultState, all: [held], total: 7, results: 2, initialized: true, appliedName: 'old', ...over },
  },
})

let dispatch: {
  devices: { set: ReturnType<typeof vi.fn>; graphQLListProcessor?: (options: any) => Promise<any> }
  accounts: { truncateMergeDevices: ReturnType<typeof vi.fn>; appendUniqueDevices: ReturnType<typeof vi.fn> }
  search: { updateSearch: ReturnType<typeof vi.fn> }
}
const effects = () => {
  const all = (devices as any).effects(dispatch)
  dispatch.devices.graphQLListProcessor = all.graphQLListProcessor
  return all
}

beforeEach(() => {
  vi.resetAllMocks()
  dispatch = {
    devices: { set: vi.fn() },
    accounts: { truncateMergeDevices: vi.fn(), appendUniqueDevices: vi.fn() },
    search: { updateSearch: vi.fn() },
  }
})

describe('a failed device list fetch keeps the held list', () => {
  it('leaves the devices, total, initialized and appliedName alone and reports failure', async () => {
    graphQLFetchDeviceList.mockResolvedValue('ERROR')
    expect(await effects().fetchList(undefined, stateWith({ query: 'new' }))).toBe(false)
    expect(dispatch.devices.set.mock.calls).toEqual([
      [{ fetching: true, accountId: 'acct' }],
      [{ fetching: false, append: false, accountId: 'acct' }],
    ])
    expect(dispatch.accounts.truncateMergeDevices).not.toHaveBeenCalled()
    expect(dispatch.search.updateSearch).not.toHaveBeenCalled()
  })

  it('a failed search or load more writes no results and appends nothing', async () => {
    graphQLFetchDeviceList.mockResolvedValue('ERROR')
    expect(await effects().fetchList(undefined, stateWith({ searched: true, append: true }))).toBe(false)
    expect(dispatch.devices.set).not.toHaveBeenCalledWith(expect.objectContaining({ results: expect.anything() }))
    expect(dispatch.devices.set).toHaveBeenLastCalledWith({ fetching: false, append: false, accountId: 'acct' })
    expect(dispatch.accounts.appendUniqueDevices).not.toHaveBeenCalled()
  })

  it('a successful fetch still replaces the list and marks it initialized', async () => {
    graphQLFetchDeviceList.mockResolvedValue({ data: { data: { login: { account: { devices: { total: 1 } } } } } })
    graphQLDeviceAdaptor.mockReturnValue([fetched])
    expect(await effects().fetchList(undefined, stateWith({ query: 'new', initialized: false }))).toBe(true)
    expect(dispatch.devices.set).toHaveBeenCalledWith({ total: 1, accountId: 'acct' })
    expect(dispatch.accounts.truncateMergeDevices).toHaveBeenCalledWith({ devices: [fetched], accountId: 'acct' })
    expect(dispatch.devices.set).toHaveBeenLastCalledWith({
      fetching: false,
      append: false,
      initialized: true,
      appliedName: 'new',
      accountId: 'acct',
    })
  })
})
