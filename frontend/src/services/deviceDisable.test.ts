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
  deviceDisableSchema,
  disabledAdaptor,
  graphQLDecommissionDevices,
  graphQLDisableDevices,
  graphQLFetchDisabledDevices,
  resetDeviceDisable,
} from './deviceDisable'

const scalar = (name: string) => ({ kind: 'SCALAR', name })
const nonNull = (ofType: any) => ({ kind: 'NON_NULL', ofType })
const list = (ofType: any) => ({ kind: 'LIST', ofType })
const ids = nonNull(list(nonNull(scalar('String'))))

// The contract's shape (docs/DEVICE-DISABLE.md "Build contract"): disableDevices(ids), restoreDevices(ids),
// decommissionDevices(ids, confirm), Device.disabled/disabledAt/disabledReason, User.devices(disabled:).
const contract = ({
  idsArg = 'ids',
  confirm = nonNull(scalar('String')) as any,
  deviceFields = ['id', 'disabled', 'disabledAt', 'disabledReason'],
  filter = true,
} = {}) => ({
  data: {
    data: {
      mutation: {
        fields: [
          {
            name: 'deleteDevices',
            type: scalar('Boolean'),
            args: [{ name: 'deviceId', type: list(scalar('String')) }],
          },
          { name: 'disableDevices', type: scalar('Boolean'), args: [{ name: idsArg, type: ids }] },
          { name: 'restoreDevices', type: scalar('Boolean'), args: [{ name: idsArg, type: ids }] },
          {
            name: 'decommissionDevices',
            type: scalar('Boolean'),
            args: [{ name: idsArg, type: ids }, ...(confirm ? [{ name: 'confirm', type: confirm }] : [])],
          },
        ],
      },
      device: { fields: deviceFields.map(name => ({ name, type: scalar('String') })) },
      user: {
        fields: [{ name: 'devices', args: [{ name: 'size' }, ...(filter ? [{ name: 'disabled' }] : [])] }],
      },
    },
  },
})
const older = { data: { data: { mutation: { fields: [] }, device: { fields: [] }, user: { fields: [] } } } }
const sent = (call: number) => request.mock.calls[call][0].data

beforeEach(() => {
  request.mockReset()
  resetDeviceDisable()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('device disable: what the API serves', () => {
  it('an older API has none: device queries add nothing and nothing is sent', async () => {
    request.mockResolvedValueOnce(older)
    expect(await deviceDisableSchema()).toBeUndefined()
    expect(await deviceDisableFields()).toBe('')
    expect(await graphQLDisableDevices(['d1'])).toBe('ERROR')
    expect(await graphQLFetchDisabledDevices('A')).toBe('ERROR')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('asked once; asked again after a failed request', async () => {
    request.mockRejectedValueOnce(new Error('offline'))
    expect(await deviceDisableSchema()).toBeUndefined()
    request.mockResolvedValueOnce(contract())
    expect(await deviceDisableSchema()).toBeDefined()
    expect(await deviceDisableSchema()).toBeDefined()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('device queries ask only for the fields served', async () => {
    request.mockResolvedValueOnce(contract({ deviceFields: ['disabled', 'disabledReason'] }))
    const fields = await deviceDisableFields()
    expect(fields).toMatch(/disabled\s+disabledReason/)
    expect(fields).not.toMatch(/disabledAt|disabledBy/)
  })

  it('the mutations take the argument name and type the API declares', async () => {
    request.mockResolvedValueOnce(contract({ idsArg: 'deviceId' }))
    request.mockResolvedValueOnce({ data: { data: { disableDevices: true } } })
    await graphQLDisableDevices(['d1', 'd2'])
    expect(sent(1).query).toMatch(/\$ids: \[String!\]!/)
    expect(sent(1).query).toMatch(/disableDevices\(deviceId: \$ids\)/)
    expect(sent(1).variables).toEqual({ ids: ['d1', 'd2'] })
  })

  it('decommission sends what was typed, or true where confirm is a Boolean', async () => {
    request.mockResolvedValueOnce(contract())
    request.mockResolvedValueOnce({ data: { data: { decommissionDevices: true } } })
    await graphQLDecommissionDevices(['d1'], 'Kitchen Pi')
    expect(sent(1).query).toMatch(/decommissionDevices\(ids: \$ids, confirm: \$confirm\)/)
    expect(sent(1).variables).toEqual({ ids: ['d1'], confirm: 'Kitchen Pi' })

    resetDeviceDisable()
    request.mockResolvedValueOnce(contract({ confirm: nonNull(scalar('Boolean')) }))
    request.mockResolvedValueOnce({ data: { data: { decommissionDevices: true } } })
    await graphQLDecommissionDevices(['d1'], 'Kitchen Pi')
    expect(sent(3).query).toMatch(/\$confirm: Boolean!/)
    expect(sent(3).variables).toEqual({ ids: ['d1'], confirm: true })
  })

  it('the Disabled view lists only where the list takes the disabled filter', async () => {
    request.mockResolvedValueOnce(contract({ filter: false }))
    expect(await graphQLFetchDisabledDevices('A')).toBe('ERROR')
    expect(request).toHaveBeenCalledTimes(1)

    resetDeviceDisable()
    request.mockResolvedValueOnce(contract())
    request.mockResolvedValueOnce({ data: { data: { login: { account: { devices: { total: 0, items: [] } } } } } })
    await graphQLFetchDisabledDevices('A')
    expect(sent(2).query).toMatch(/devices\(disabled: true/)
    expect(sent(2).variables).toMatchObject({ accountId: 'A' })
  })
})

describe('disabledAdaptor', () => {
  it('reads nothing from an API without the fields', () => {
    expect(disabledAdaptor({ id: 'd1' })).toEqual({})
  })

  it('reads when, why and by whom', () => {
    expect(
      disabledAdaptor({
        disabled: true,
        disabledAt: '2026-10-28T10:00:00Z',
        disabledReason: 'EXPIRED',
        disabledBy: { id: 'u1', email: 'a@b.c' },
      })
    ).toEqual({
      disabled: true,
      disabledAt: new Date('2026-10-28T10:00:00Z'),
      disabledReason: 'expired',
      disabledBy: 'a@b.c',
    })
  })
})
