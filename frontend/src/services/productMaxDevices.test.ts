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
  devicesOver,
  graphQLProductMaxDevices,
  parseMaxDevices,
  productMaxDevicesServed,
  resetProductMaxDevices,
  setProductMaxDevices,
} from './productMaxDevices'

// What the probe reads of graphql's schema: the field names of Mutation and DeviceProduct.
const schema = ({
  mutations = ['setDeviceProductLifecycle', 'setDeviceProductMaxDevices'],
  productFields = ['id', 'lifecycle', 'maxDevices', 'devicesCounted'],
} = {}) => ({
  data: {
    data: {
      mutation: { fields: mutations.map(name => ({ name })) },
      product: { fields: productFields.map(name => ({ name })) },
    },
  },
})
const older = schema({ mutations: ['setDeviceProductLifecycle'], productFields: ['id', 'lifecycle'] })
const sent = (call: number) => request.mock.calls[call][0].data
const product = (item: object) => ({ data: { data: { login: { account: { deviceProducts: { items: [item] } } } } } })

beforeEach(() => {
  request.mockReset()
  resetProductMaxDevices()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe("a product's maximum of devices: whether the API has it", () => {
  it('an older API has none: the product is never asked for it', async () => {
    request.mockResolvedValueOnce(older)
    expect(await graphQLProductMaxDevices('P1')).toBeUndefined()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('needs the mutation and both fields', async () => {
    request.mockResolvedValueOnce(schema({ productFields: ['id', 'maxDevices'] }))
    expect(await productMaxDevicesServed()).toBe(false)
  })

  it('is read once, and again after a failed probe', async () => {
    request.mockRejectedValueOnce(new Error('offline'))
    expect(await productMaxDevicesServed()).toBe(false)
    request.mockResolvedValueOnce(schema())
    expect(await productMaxDevicesServed()).toBe(true)
    expect(await productMaxDevicesServed()).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
  })
})

describe("a product's maximum of devices: read and set", () => {
  it('reads the maximum and the count on their own, for the product and account', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce(product({ id: 'P1', maxDevices: 50, devicesCounted: 52 }))
    expect(await graphQLProductMaxDevices('P1', 'ACCOUNT')).toEqual({ maxDevices: 50, devicesCounted: 52 })
    expect(sent(1).query).toContain('items { id maxDevices devicesCounted }')
    expect(sent(1).variables).toEqual({ id: 'P1', accountId: 'ACCOUNT' })
  })

  it('none is null, and a count withheld (not a manager) is null', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce(product({ id: 'P1', maxDevices: null, devicesCounted: null }))
    expect(await graphQLProductMaxDevices('P1')).toEqual({ maxDevices: null, devicesCounted: null })
  })

  it('sets it, or removes it, answering the product as it is then', async () => {
    request.mockResolvedValueOnce({
      data: { data: { setDeviceProductMaxDevices: { id: 'P1', maxDevices: null, devicesCounted: 3 } } },
    })
    expect(await setProductMaxDevices('P1', null)).toEqual({ product: { maxDevices: null, devicesCounted: 3 } })
    expect(sent(0).variables).toEqual({ productId: 'P1', maxDevices: null })
  })

  it("a refusal is answered in graphql's words", async () => {
    request.mockResolvedValueOnce({
      data: {
        errors: [
          {
            message: 'Not authorized',
            extensions: { message: "not authorized to change this product's maximum of devices" },
          },
        ],
      },
    })
    expect(await setProductMaxDevices('P1', 5)).toEqual({
      reason: "Not authorized to change this product's maximum of devices",
    })
  })
})

describe("a product's maximum of devices: as typed, and past it", () => {
  it('is a whole number from 0 to a million, or nothing for none', () => {
    expect(parseMaxDevices('')).toBeNull()
    expect(parseMaxDevices(' 0 ')).toBe(0)
    expect(parseMaxDevices('250')).toBe(250)
    expect(parseMaxDevices('1000000')).toBe(1_000_000)
    for (const wrong of ['-1', '1.5', '1e3', '1000001', 'ten']) expect(parseMaxDevices(wrong)).toBeUndefined()
  })

  it('says how many are over a maximum lowered below them', () => {
    expect(devicesOver({ maxDevices: 10, devicesCounted: 12 })).toBe(2)
    expect(devicesOver({ maxDevices: 10, devicesCounted: 9 })).toBe(0)
    expect(devicesOver({ maxDevices: null, devicesCounted: 12 })).toBe(0)
    expect(devicesOver({ maxDevices: 10, devicesCounted: null })).toBe(0)
  })
})
