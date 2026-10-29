import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  graphQLFetchDeviceList,
  graphQLDeviceAdaptor,
  graphQLDisableDevices,
  graphQLRestoreDevices,
  graphQLDecommissionDevices,
} = vi.hoisted(() => ({
  graphQLFetchDeviceList: vi.fn(),
  graphQLDeviceAdaptor: vi.fn(),
  graphQLDisableDevices: vi.fn(),
  graphQLRestoreDevices: vi.fn(),
  graphQLDecommissionDevices: vi.fn(),
}))
vi.mock('../services/graphQLDevice', () => ({ graphQLFetchDeviceList, graphQLDeviceAdaptor }))
vi.mock('../services/deviceDisable', () => ({
  graphQLDisableDevices,
  graphQLRestoreDevices,
  graphQLDecommissionDevices,
}))
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('../services/graphQLRequest', () => ({}))
vi.mock('../services/graphQLVirtualDevices', () => ({}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'acct' }))
vi.mock('../selectors/devices', () => ({
  selectDeviceModelAttributes: (state: any) => state.devices.acct,
  selectActiveColumns: () => [],
  selectDevice: (state: any, _: any, id: string) => state.devices.acct.all.find((d: any) => d.id === id),
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
  it.each([
    { response: 'ERROR', over: { query: 'new' } },
    { response: 'ERROR', over: { searched: true, append: true } },
    { response: undefined, over: {} },
  ])(
    'writes no devices, totals, initialized or appliedName and reports failure ($response, $over)',
    async ({ response, over }) => {
      graphQLFetchDeviceList.mockResolvedValue(response)
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

  it('fetchPage puts the held page back only when its fetch fails', async () => {
    dispatch.devices.fetchList.mockResolvedValue(false)
    await effects().fetchPage({ from: 100, append: true }, stateWith({ from: 50 }))
    expect(dispatch.devices.set.mock.calls).toEqual([
      [{ from: 100, append: true, accountId: 'acct' }],
      [{ from: 50, accountId: 'acct' }],
    ])

    dispatch.devices.set.mockClear()
    dispatch.devices.fetchList.mockResolvedValue(true)
    await effects().fetchPage({ from: 100, append: true }, stateWith({ from: 50 }))
    expect(dispatch.devices.set.mock.calls).toEqual([[{ from: 100, append: true, accountId: 'acct' }]])
  })
})

describe('disable, restore, decommission (graphql-api docs/DEVICE-DISABLE.md)', () => {
  const device = (id: string, over: Partial<IDevice> = {}) =>
    ({ id, name: id, state: 'inactive', shared: false, permissions: ['MANAGE'], ...over } as IDevice)

  beforeEach(() => {
    dispatch.ui = { set: vi.fn() }
    dispatch.connections = { clearByDevice: vi.fn() }
    dispatch.networks = { clearById: vi.fn() }
    dispatch.accounts.setDevice = vi.fn()
    dispatch.devices.cleanup = vi.fn()
    dispatch.devices.fetchDevices = vi.fn()
  })

  it('an online device is disabled: kept in the store marked, out of the total only where it was listed', async () => {
    graphQLDisableDevices.mockResolvedValue({ data: {} })
    const online = device('d1', { state: 'active' })
    const hidden = device('d2', { hidden: true })
    const state = { ...stateWith({ all: [online, hidden], total: 5 }), auth: { user: { email: 'me@x' } } }
    expect(await effects().disable({ ids: ['d1', 'd2'] }, state)).toBe(true)
    expect(graphQLDisableDevices).toHaveBeenCalledWith(['d1', 'd2'], undefined)
    expect(dispatch.connections.clearByDevice.mock.calls).toEqual([['d1'], ['d2']])
    expect(
      dispatch.accounts.setDevice.mock.calls.map(([a]: any) => [
        a.id,
        a.device.disabled,
        a.device.disabledReason,
        a.device.disabledBy,
      ])
    ).toEqual([
      ['d1', true, 'person', 'me@x'],
      ['d2', true, 'person', 'me@x'],
    ])
    expect(dispatch.devices.set).toHaveBeenCalledWith({ total: 4, accountId: 'acct' })
    expect(dispatch.devices.cleanup).not.toHaveBeenCalled()
  })

  it('a gateway: its virtual devices disabled with it, or kept and read again', async () => {
    graphQLDisableDevices.mockResolvedValue({ data: {} })
    const gateway = device('g1', { hosts: 2, hostedDevices: [{ id: 'v1' } as IHostedDevice] })
    const v1 = device('v1', { virtual: true, hostedBy: { visible: true, id: 'g1', state: 'active' } })
    const v2 = device('v2', { virtual: true, hostedBy: { visible: true, id: 'g1', state: 'active' } })
    const other = device('o1')
    const all = [gateway, v1, v2, other]

    expect(await effects().disable({ ids: ['g1'], keepHosted: false }, stateWith({ all, total: 4 }))).toBe(true)
    expect(graphQLDisableDevices).toHaveBeenCalledWith(['g1'], false)
    expect(dispatch.accounts.setDevice.mock.calls.map(([a]: any) => a.id)).toEqual(['g1', 'v1', 'v2'])
    expect(dispatch.devices.set).toHaveBeenCalledWith({ total: 1, accountId: 'acct' })
    expect(dispatch.devices.fetchDevices).not.toHaveBeenCalled()

    dispatch.accounts.setDevice.mockReset()
    expect(await effects().disable({ ids: ['g1'], keepHosted: true }, stateWith({ all, total: 4 }))).toBe(true)
    expect(graphQLDisableDevices).toHaveBeenLastCalledWith(['g1'], true)
    expect(dispatch.accounts.setDevice.mock.calls.map(([a]: any) => a.id)).toEqual(['g1'])
    expect(dispatch.devices.fetchDevices).toHaveBeenCalledWith({ ids: ['v1', 'v2'] })
  })

  it('one without MANAGE is refused before the API is asked', async () => {
    expect(
      await effects().disable({ ids: ['d1'] }, stateWith({ all: [device('d1', { permissions: [] as IPermission[] })] }))
    ).toBe(false)
    expect(graphQLDisableDevices).not.toHaveBeenCalled()
  })

  it('a shared device whose share grants MANAGE is disabled, as graphql allows', async () => {
    graphQLDisableDevices.mockResolvedValue({ data: {} })
    expect(
      await effects().disable({ ids: ['d1'] }, stateWith({ all: [device('d1', { shared: true })], total: 1 }))
    ).toBe(true)
    expect(graphQLDisableDevices).toHaveBeenCalled()
  })

  it('a refused disable changes nothing', async () => {
    graphQLDisableDevices.mockResolvedValue('ERROR')
    expect(await effects().disable({ ids: ['d1'] }, stateWith({ all: [device('d1')], total: 1 }))).toBe(false)
    expect(dispatch.accounts.setDevice).not.toHaveBeenCalled()
    expect(dispatch.devices.set).not.toHaveBeenCalled()
  })

  it('restore unmarks the device and reads the list again', async () => {
    graphQLRestoreDevices.mockResolvedValue({ data: {} })
    const disabled = device('d1', { disabled: true, disabledReason: 'person' })
    expect(await effects().restore(['d1'], stateWith({ all: [disabled] }))).toBe(true)
    expect(dispatch.accounts.setDevice.mock.calls[0][0].device).toMatchObject({
      disabled: false,
      disabledReason: undefined,
    })
    expect(dispatch.devices.fetchList).toHaveBeenCalled()
  })

  it('decommission forgets the devices', async () => {
    graphQLDecommissionDevices.mockResolvedValue({ data: {} })
    expect(await effects().decommission(['d1', 'd2'])).toBe(true)
    expect(graphQLDecommissionDevices).toHaveBeenCalledWith(['d1', 'd2'])
    expect(dispatch.devices.cleanup).toHaveBeenCalledWith(['d1', 'd2'])
  })
})
