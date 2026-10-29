import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import {
  deviceDisableFields,
  deviceDisableServed,
  disabledAdaptor,
  graphQLDecommissionDevices,
  graphQLDisableDevices,
  graphQLFetchDisabledDevices,
  graphQLRestoreDevices,
  resetDeviceDisable,
} from './deviceDisable'

// What the probe reads of graphql's schema: the field names of Mutation and Device.
const schema = ({
  mutations = ['deleteDevices', 'disableDevices', 'restoreDevices', 'decommissionDevices'],
  deviceFields = ['id', 'disabled', 'disabledAt', 'disabledReason'] as (string | { name: string; type: any })[],
} = {}) => ({
  data: {
    data: {
      mutation: { fields: mutations.map(name => ({ name })) },
      device: { fields: deviceFields.map(name => (typeof name === 'string' ? { name } : name)) },
    },
  },
})
const older = schema({ mutations: ['deleteDevices'], deviceFields: ['id'] })
const sent = (call: number) => request.mock.calls[call][0].data

beforeEach(() => {
  request.mockReset()
  resetDeviceDisable()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('device disable: whether the API serves it', () => {
  it('an older API has none: device queries add nothing', async () => {
    request.mockResolvedValueOnce(older)
    expect(await deviceDisableServed()).toBe(false)
    expect(await deviceDisableFields()).toBe('')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('served only with all three mutations and Device.disabled', async () => {
    request.mockResolvedValueOnce(schema({ mutations: ['disableDevices', 'restoreDevices'] }))
    expect(await deviceDisableServed()).toBe(false)
    resetDeviceDisable()
    request.mockResolvedValueOnce(schema({ deviceFields: ['id'] }))
    expect(await deviceDisableServed()).toBe(false)
    resetDeviceDisable()
    request.mockResolvedValueOnce(schema())
    expect(await deviceDisableServed()).toBe(true)
    expect(await deviceDisableFields()).toMatch(/disabled\s+disabledAt\s+disabledReason/)
  })

  it('who disabled it is asked only where Device has disabledBy: a user as { id email }, else as given', async () => {
    request.mockResolvedValueOnce(schema())
    expect(await deviceDisableFields()).not.toMatch(/disabledBy/)
    resetDeviceDisable()
    const object = { name: 'disabledBy', type: { kind: 'OBJECT' } }
    request.mockResolvedValueOnce(schema({ deviceFields: ['disabled', object] }))
    expect(await deviceDisableFields()).toMatch(/disabledBy \{ id email \}/)
    resetDeviceDisable()
    const text = { name: 'disabledBy', type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR' } } }
    request.mockResolvedValueOnce(schema({ deviceFields: ['disabled', text] }))
    const fields = await deviceDisableFields()
    expect(fields).toMatch(/disabledBy$/)
    request.mockResolvedValueOnce({ data: { data: { login: { account: { devices: { total: 0, items: [] } } } } } })
    await graphQLFetchDisabledDevices('A', 0, fields)
    expect(sent(request.mock.calls.length - 1).query).toMatch(/disabledBy\s/)
  })

  it('asked once; asked again after a failed request', async () => {
    request.mockRejectedValueOnce(new Error('offline'))
    expect(await deviceDisableServed()).toBe(false)
    request.mockResolvedValueOnce(schema())
    expect(await deviceDisableServed()).toBe(true)
    expect(await deviceDisableServed()).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
  })
})

describe("device disable: graphql's mutations", () => {
  it('disable sends keepHosted only when asked', async () => {
    request.mockResolvedValue({ data: { data: { disableDevices: true } } })
    await graphQLDisableDevices(['d1', 'd2'])
    expect(sent(0).query).toMatch(/disableDevices\(ids: \$ids, keepHosted: \$keepHosted\)/)
    expect(sent(0).variables).toEqual({ ids: ['d1', 'd2'] })
    await graphQLDisableDevices(['d1'], false)
    expect(sent(1).variables).toEqual({ ids: ['d1'], keepHosted: false })
  })

  it('restore takes the ids', async () => {
    request.mockResolvedValue({ data: { data: { restoreDevices: true } } })
    await graphQLRestoreDevices(['d1'])
    expect(sent(0).query).toMatch(/restoreDevices\(ids: \$ids\)/)
    expect(sent(0).variables).toEqual({ ids: ['d1'] })
  })

  it('decommission sends confirm: true — the typed confirmation stays in the portal', async () => {
    request.mockResolvedValue({ data: { data: { decommissionDevices: true } } })
    await graphQLDecommissionDevices(['d1'])
    expect(sent(0).query).toMatch(/decommissionDevices\(ids: \$ids, confirm: true\)/)
    expect(sent(0).variables).toEqual({ ids: ['d1'] })
  })

  it('the Disabled view asks the list with disabled: true', async () => {
    request.mockResolvedValue({ data: { data: { login: { account: { devices: { total: 0, items: [] } } } } } })
    await graphQLFetchDisabledDevices('A')
    expect(sent(0).query).toMatch(/devices\(disabled: true/)
    expect(sent(0).query).toMatch(/disabledReason/)
    expect(sent(0).variables).toMatchObject({ accountId: 'A' })
  })
})

describe('disabledAdaptor', () => {
  it('reads nothing from an API without the fields', () => {
    expect(disabledAdaptor({ id: 'd1' })).toEqual({})
  })

  it("reads who: a user's email or id, text as given, nothing for the expiry", () => {
    expect(disabledAdaptor({ disabled: true, disabledBy: { id: 'u1', email: 'a@b.c' } }).disabledBy).toBe('a@b.c')
    expect(disabledAdaptor({ disabled: true, disabledBy: { id: 'u1' } }).disabledBy).toBe('u1')
    expect(disabledAdaptor({ disabled: true, disabledBy: 'a@b.c' }).disabledBy).toBe('a@b.c')
    expect(
      disabledAdaptor({ disabled: true, disabledBy: 'expiry', disabledReason: 'expired' }).disabledBy
    ).toBeUndefined()
    expect(disabledAdaptor({ disabled: true, disabledBy: null }).disabledBy).toBeUndefined()
  })

  it('reads when and why', () => {
    expect(disabledAdaptor({ disabled: true, disabledAt: '2026-10-28T10:00:00Z', disabledReason: 'expired' })).toEqual({
      disabled: true,
      disabledAt: new Date('2026-10-28T10:00:00Z'),
      disabledReason: 'expired',
      disabledBy: undefined,
    })
  })
})
