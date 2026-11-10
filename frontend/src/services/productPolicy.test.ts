import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, uiSet } = vi.hoisted(() => ({ request: vi.fn(), uiSet: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import {
  graphQLAddDeviceProductNetwork,
  graphQLDeviceProduct,
  graphQLDeviceProductPreview,
  graphQLProductPolicy,
  graphQLProductProxies,
  graphQLProductSyncPreview,
  graphQLSetDeviceProduct,
  graphQLSetDeviceProductExit,
  graphQLSetDeviceProductSetting,
  graphQLSetDeviceProductSync,
  graphQLSetDevicesProduct,
  lockOf,
  networkOf,
  previewOf,
  productExit,
  productPolicyServed,
  removes,
  resetProductPolicy,
  settingPolicyFields,
  summarize,
} from './productPolicy'

/* graphql's schema as introspection answers it: each type a map of its fields, each field its type and arguments. */

type Ref = { kind: string; name: string | null; ofType?: Ref }
const scalar = (name = 'String'): Ref => ({ kind: 'SCALAR', name })
const object = (name: string): Ref => ({ kind: 'OBJECT', name })
const enumOf = (name: string): Ref => ({ kind: 'ENUM', name })
const nonNull = (ofType: Ref): Ref => ({ kind: 'NON_NULL', name: null, ofType })
const list = (ofType: Ref): Ref => ({ kind: 'LIST', name: null, ofType })
type Desc = Record<string, Record<string, { type: Ref; args?: Record<string, Ref> }>>

const ITEM = list(nonNull(object('ProductPolicyItem')))

// The API as wave 4 builds it.
const WAVE4: Desc = {
  Query: {
    deviceProductPreview: {
      type: nonNull(object('DeviceProductPreview')),
      args: { deviceId: nonNull(scalar()), productId: scalar('ID') },
    },
    productSyncPreview: {
      type: nonNull(list(nonNull(object('DeviceProductPreview')))),
      args: { productId: nonNull(scalar('ID')), sync: nonNull(scalar()) },
    },
  },
  Mutation: {
    setDeviceProduct: {
      type: object('Device'),
      args: { deviceId: nonNull(scalar()), productId: scalar('ID'), confirm: scalar('Boolean') },
    },
    setDevicesProduct: {
      type: nonNull(scalar('Boolean')),
      args: { deviceIds: nonNull(list(nonNull(scalar()))), productId: scalar('ID'), confirm: scalar('Boolean') },
    },
    setDeviceProductSync: {
      type: object('DeviceProduct'),
      args: { productId: nonNull(scalar('ID')), sync: nonNull(scalar()), confirm: scalar('Boolean') },
    },
    setDeviceProductSetting: {
      type: object('DeviceProduct'),
      args: { productId: nonNull(scalar('ID')), name: nonNull(scalar()), value: scalar('Any') },
    },
    addDeviceProductNetwork: {
      type: object('DeviceProduct'),
      args: {
        productId: nonNull(scalar('ID')),
        networkId: nonNull(scalar()),
        role: nonNull(enumOf('NetworkDeviceRole')),
      },
    },
    removeDeviceProductNetwork: {
      type: object('DeviceProduct'),
      args: { productId: nonNull(scalar('ID')), networkId: nonNull(scalar()) },
    },
    setDeviceProductExit: {
      type: object('DeviceProduct'),
      args: { productId: nonNull(scalar('ID')), exit: scalar() },
    },
    addProxyProduct: { type: object('Proxy'), args: { proxy: nonNull(scalar()), productId: nonNull(scalar('ID')) } },
    removeProxyProduct: { type: object('Proxy'), args: { proxy: nonNull(scalar()), productId: nonNull(scalar('ID')) } },
  },
  Device: {
    id: { type: scalar() },
    product: { type: object('DeviceProduct') },
    productOrigin: { type: object('DeviceProduct') },
  },
  DeviceProduct: {
    id: { type: scalar('ID') },
    name: { type: scalar() },
    sync: { type: nonNull(scalar()) },
    settings: { type: list(object('DeviceProductSetting')) },
    networks: { type: list(object('DeviceProductNetwork')) },
    devices: { type: list(object('Device')) },
  },
  DeviceProductNetwork: {
    id: { type: scalar() },
    name: { type: scalar() },
    role: { type: enumOf('NetworkDeviceRole') },
  },
  DeviceProductPreview: {
    deviceId: { type: scalar() },
    name: { type: scalar() },
    added: { type: ITEM },
    locked: { type: ITEM },
    removed: { type: ITEM },
    unlocked: { type: ITEM },
    warning: { type: scalar() },
  },
  DeviceSetting: {
    name: { type: scalar() },
    fromProduct: { type: scalar('Boolean') },
    locked: { type: object('DeviceSettingLock') },
  },
  DeviceSettingLock: { by: { type: scalar() }, product: { type: scalar() }, level: { type: scalar() } },
  Tag: { name: { type: scalar() }, fromProduct: { type: scalar('Boolean') } },
  Service: { id: { type: scalar() }, fromProduct: { type: scalar('Boolean') } },
  Proxy: { id: { type: scalar() }, products: { type: list(object('DeviceProduct')) } },
}

// An API from before wave 4: none of it.
const OLDER: Desc = {
  Query: { devices: { type: list(object('Device')) } },
  Mutation: { addProxyProduct: { type: object('Proxy') } },
  Device: { id: { type: scalar() } },
  DeviceProduct: { id: { type: scalar('ID') }, lifecycle: { type: scalar() } },
  DeviceSetting: { name: { type: scalar() } },
  Tag: { name: { type: scalar() } },
  Service: { id: { type: scalar() } },
  Proxy: { id: { type: scalar() }, products: { type: list(object('DeviceProduct')) } },
}

const asked = (call: number) => request.mock.calls[call][0].data
const schemaReads = () => request.mock.calls.filter(([r]) => r.data.query.includes('ProductPolicySchema')).length

// Introspection for the types a probe names, from desc; anything else answered by `answer`.
function serve(desc: Desc, answer: (query: string, variables: any) => any = () => ({})) {
  request.mockImplementation(async ({ data }: any) => {
    if (data.query.includes('ProductPolicySchema')) {
      const types: Record<string, any> = {}
      for (const [, alias, name] of data.query.matchAll(/(t\d+): __type\(name: "(\w+)"\)/g)) {
        const fields = desc[name]
        types[alias] = fields
          ? {
              name,
              fields: Object.entries(fields).map(([field, { type, args = {} }]) => ({
                name: field,
                type,
                args: Object.entries(args).map(([arg, argType]) => ({ name: arg, type: argType })),
              })),
            }
          : null
      }
      return { data: { data: types }, headers: {} }
    }
    const result = answer(data.query, data.variables)
    return result && result.errors ? { data: result, headers: {} } : { data: { data: result }, headers: {} }
  })
}

beforeEach(() => {
  request.mockReset()
  uiSet.mockReset()
  resetProductPolicy()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('whether the API serves product policy', () => {
  it('an API without it: nothing served, nothing more read, and a setting asks for nothing more', async () => {
    serve(OLDER)
    expect(await productPolicyServed()).toEqual({
      device: false,
      product: false,
      settings: false,
      networks: false,
      exit: false,
      proxies: false,
      devices: false,
      bulk: false,
    })
    expect(await settingPolicyFields()).toBe('')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('wave 4’s API: each part served, the types its answers name read once beside, and not again', async () => {
    serve(WAVE4)
    expect(await productPolicyServed()).toEqual({
      device: true,
      product: true,
      settings: true,
      networks: true,
      exit: true,
      proxies: true,
      devices: true,
      bulk: true,
    })
    expect(schemaReads()).toBe(2)
    expect(asked(1).query).toMatch(/"DeviceProductPreview"[\s\S]*"DeviceProductNetwork"[\s\S]*"DeviceSettingLock"/)
    await productPolicyServed()
    await settingPolicyFields()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('a part graphql left out is not offered: a product’s networks without their mutations, devices without the list', async () => {
    const { networks: _n, devices: _d, ...product } = WAVE4.DeviceProduct
    const { removeDeviceProductNetwork: _r, setDevicesProduct: _s, ...mutations } = WAVE4.Mutation
    serve({ ...WAVE4, DeviceProduct: product, Mutation: mutations })
    const served = await productPolicyServed()
    expect(served).toMatchObject({ device: true, product: true, networks: false, devices: false, bulk: false })
  })

  it('a failed read is asked again', async () => {
    request.mockResolvedValueOnce({ data: { errors: [{ message: 'boom' }] }, headers: {} })
    expect((await productPolicyServed()).device).toBe(false)
    serve(WAVE4)
    expect((await productPolicyServed()).device).toBe(true)
    expect(uiSet).not.toHaveBeenCalled()
  })
})

describe('calls made as the schema declares them', () => {
  it('each argument typed as graphql types it; a variable it has no argument for is left out', async () => {
    serve(WAVE4, () => ({ addDeviceProductNetwork: { __typename: 'DeviceProduct' } }))
    expect(await graphQLAddDeviceProductNetwork('P1', 'N1', 'INITIATOR')).toBe(true)
    const call = asked(request.mock.calls.length - 1)
    expect(call.query).toContain(
      'mutation AddDeviceProductNetwork($productId: ID!, $networkId: String!, $role: NetworkDeviceRole!)'
    )
    expect(call.query).toContain(
      'addDeviceProductNetwork(productId: $productId, networkId: $networkId, role: $role) { __typename }'
    )
    expect(call.variables).toEqual({ productId: 'P1', networkId: 'N1', role: 'INITIATOR' })

    serve({
      ...WAVE4,
      Mutation: {
        ...WAVE4.Mutation,
        setDeviceProduct: { type: object('Device'), args: { deviceId: nonNull(scalar()), productId: scalar('ID') } },
      },
    })
    resetProductPolicy()
    await graphQLSetDeviceProduct('D1', null, true)
    const detach = asked(request.mock.calls.length - 1)
    expect(detach.query).toContain('mutation SetDeviceProduct($deviceId: String!, $productId: ID)')
    expect(detach.variables).toEqual({ deviceId: 'D1', productId: null })
  })

  it('an answer that is not an object is asked for nothing', async () => {
    serve(WAVE4, () => ({ setDevicesProduct: true }))
    expect(await graphQLSetDevicesProduct(['D1', 'D2'], 'P1', false)).toBe(true)
    const call = asked(request.mock.calls.length - 1)
    expect(call.query).toContain('$deviceIds: [String!]!')
    expect(call.query).toMatch(
      /setDevicesProduct\(deviceIds: \$deviceIds, productId: \$productId, confirm: \$confirm\)\s*}/
    )
  })

  it('a refusal comes back in graphql’s words, with no error banner', async () => {
    serve(WAVE4, () => ({
      errors: [
        {
          message: 'refused',
          extensions: { message: 'managed by product Pumps (enforced): detaching needs manage on it' },
        },
      ],
    }))
    expect(await graphQLSetDeviceProduct('D1', null, false)).toEqual({
      reason: 'Managed by product Pumps (enforced): detaching needs manage on it',
    })
    expect(await graphQLSetDeviceProductSync('P1', 'enforced', false)).toEqual({
      reason: 'Managed by product Pumps (enforced): detaching needs manage on it',
    })
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('a product’s setting, null unsetting it; its exit, null leaving it to each device', async () => {
    serve(WAVE4, () => ({ ok: true }))
    await graphQLSetDeviceProductSetting('P1', 'subnet', null)
    expect(asked(request.mock.calls.length - 1).variables).toEqual({ productId: 'P1', name: 'subnet', value: null })
    expect(asked(request.mock.calls.length - 1).query).toContain('$value: Any')
    await graphQLSetDeviceProductExit('P1', null)
    expect(asked(request.mock.calls.length - 1).variables).toEqual({ productId: 'P1', exit: null })
  })

  it('nothing is sent for a call the API does not have', async () => {
    serve(OLDER)
    expect(await graphQLSetDeviceProduct('D1', 'P1', false)).toBe('ERROR')
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('previews', () => {
  const preview = {
    deviceId: 'D1',
    name: 'pump-1',
    added: [{ kind: 'TAG', name: 'prod' }],
    locked: [{ kind: 'NETWORK', name: 'Plant' }],
    removed: [],
    unlocked: [],
    warning:
      'It will be removed at its next reboot or after 10 minutes offline, unless this machine re-registers itself',
  }

  it('a device’s: asked with the fields its type has, each item by kind and name', async () => {
    serve(WAVE4, () => ({ deviceProductPreview: preview }))
    const answer = await graphQLDeviceProductPreview('D1', 'P2')
    const call = asked(request.mock.calls.length - 1)
    expect(call.query).toContain('query DeviceProductPreview($deviceId: String!, $productId: ID)')
    expect(call.query).toContain(
      'deviceId name added { kind name } locked { kind name } removed { kind name } unlocked { kind name } warning'
    )
    expect(answer).toEqual({
      ...preview,
      added: [{ kind: 'tag', name: 'prod' }],
      locked: [{ kind: 'network', name: 'Plant' }],
    })
  })

  it('a field graphql left out is not asked for', async () => {
    const { unlocked: _u, warning: _w, ...fields } = WAVE4.DeviceProductPreview
    serve({ ...WAVE4, DeviceProductPreview: fields }, () => ({ deviceProductPreview: preview }))
    await graphQLDeviceProductPreview('D1', null)
    const call = asked(request.mock.calls.length - 1)
    expect(call.query).not.toContain('unlocked')
    expect(call.query).not.toContain('warning')
  })

  it('a product level’s: one per device, or one for them all', async () => {
    serve(WAVE4, () => ({ productSyncPreview: [preview, { ...preview, deviceId: 'D2' }] }))
    expect((await graphQLProductSyncPreview('P1', 'synced')) as any).toHaveLength(2)
    serve(WAVE4, () => ({ productSyncPreview: preview }))
    expect((await graphQLProductSyncPreview('P1', 'synced')) as any).toHaveLength(1)
  })

  it('items said as plain text are kept as names', () => {
    expect(previewOf({ removed: ['tag dev'] }).removed).toEqual([{ kind: '', name: 'tag dev' }])
    expect(previewOf({ device: { id: 'D9', name: 'nine' } })).toMatchObject({ deviceId: 'D9', name: 'nine' })
  })

  it('in brief: per kind, how many devices, and how many items among them', () => {
    const lose = (deviceId: string, tags: string[]) =>
      previewOf({ deviceId, removed: tags.map(name => ({ kind: 'tag', name })) })
    const previews = [lose('D1', ['a', 'b']), lose('D2', ['b', 'c']), previewOf({ deviceId: 'D3' })]
    expect(summarize(previews).removed).toEqual([{ kind: 'tag', devices: 2, items: 3 }])
    expect(removes(previews)).toBe(true)
    expect(removes([previewOf({ added: [{ kind: 'tag', name: 'a' }] })])).toBe(false)
  })
})

describe('reads', () => {
  it('a product: its level, settings, networks and devices', async () => {
    serve(WAVE4, () => ({
      login: {
        account: {
          deviceProducts: {
            items: [
              {
                id: 'P1',
                sync: 'SYNCED',
                settings: [{ name: 'exit', value: { via: 'xoffice' } }],
                networks: [{ id: 'N1', name: 'Plant', role: 'INITIATOR' }],
                devices: [{ id: 'D1', name: 'pump-1', state: 'active' }],
              },
            ],
          },
        },
      },
    }))
    const policy = await graphQLProductPolicy('P1', 'A1')
    const call = asked(request.mock.calls.length - 1)
    expect(call.query).toContain('sync settings { name value } networks { id name role } devices { id name state }')
    expect(call.variables).toEqual({ id: 'P1', accountId: 'A1' })
    expect(policy).toEqual({
      sync: 'synced',
      settings: [{ name: 'exit', value: { via: 'xoffice' } }],
      networks: [{ id: 'N1', name: 'Plant', role: 'INITIATOR' }],
      devices: [{ id: 'D1', name: 'pump-1', state: 'active' }],
    })
    expect(productExit((policy as any).settings)).toBe('xoffice')
    expect(productExit([{ name: 'exit', value: 'xpdx' }])).toBe('xpdx')
    expect(productExit([])).toBeNull()
  })

  it('a device: its product with its level and networks, where it came from, and what the product gives it', async () => {
    serve(WAVE4, () => ({
      login: {
        device: [
          {
            id: 'D1',
            product: {
              id: 'P1',
              name: 'Pumps',
              sync: 'enforced',
              networks: [{ id: 'N1', name: 'Plant', role: 'BOTH' }],
            },
            productOrigin: { id: 'P0', name: 'Pumps (staging)' },
            tags: [
              { name: 'prod', fromProduct: true },
              { name: 'mine', fromProduct: false },
            ],
            services: [
              { id: 'S1', fromProduct: true },
              { id: 'S2', fromProduct: null },
            ],
          },
        ],
      },
    }))
    const state = await graphQLDeviceProduct('D1', 'A1')
    const call = asked(request.mock.calls.length - 1)
    expect(call.query).toContain('product { id name sync networks { id name role } }')
    expect(call.query).toContain('productOrigin { id name }')
    expect(call.query).toContain('tags(accountId: $accountId) { name fromProduct }')
    expect(call.query).toContain('services { id fromProduct }')
    expect(state).toEqual({
      product: { id: 'P1', name: 'Pumps', sync: 'enforced', networks: [{ id: 'N1', name: 'Plant', role: 'BOTH' }] },
      origin: { id: 'P0', name: 'Pumps (staging)' },
      tags: ['prod'],
      services: ['S1'],
    })
  })

  it('a device with no product, its origin given as an id', async () => {
    serve({ ...WAVE4, Device: { ...WAVE4.Device, productOrigin: { type: scalar() } } }, () => ({
      login: { device: [{ id: 'D1', product: null, productOrigin: 'P0' }] },
    }))
    expect(await graphQLDeviceProduct('D1')).toMatchObject({ product: null, origin: { id: 'P0', name: null } })
    expect(asked(request.mock.calls.length - 1).query).toMatch(/productOrigin(?! \{)/)
  })

  it('the account’s proxies, and whether the product’s devices join each', async () => {
    serve(WAVE4, () => ({
      login: {
        account: {
          proxies: [
            { id: 'x1', name: 'Office', manage: true, products: [{ id: 'P1' }] },
            { id: 'x2', name: 'Lab', manage: true, products: [] },
            { id: 'x3', name: 'Theirs', manage: false, products: [] },
          ],
        },
      },
    }))
    expect(await graphQLProductProxies('P1', 'A1')).toEqual([
      { id: 'x1', name: 'Office', joined: true },
      { id: 'x2', name: 'Lab', joined: false },
    ])
  })

  it('a setting’s lock, as an object or as words', async () => {
    serve(WAVE4)
    expect(await settingPolicyFields()).toBe('fromProduct locked { by product level }')
    expect(lockOf({ by: 'product', product: 'Pumps', level: 'ENFORCED' })).toEqual({
      product: 'Pumps',
      level: 'enforced',
      text: null,
    })
    expect(lockOf('managed by product Pumps')).toEqual({ product: null, level: null, text: 'managed by product Pumps' })
    expect(lockOf(null)).toBeNull()
  })

  it('a network grant, flat or with its network inside', () => {
    expect(networkOf({ network: { id: 'N1', name: 'Plant' }, role: 'target' })).toEqual({
      id: 'N1',
      name: 'Plant',
      role: 'TARGET',
    })
  })
})
