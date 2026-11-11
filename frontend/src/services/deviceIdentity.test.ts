import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))
// Device disable's own probe is its own test's (deviceDisable.test.ts): here, a served one.
vi.mock('./deviceDisable', () => ({
  deviceDisableFields: vi.fn().mockResolvedValue('\n  disabled\n  disabledAt\n  disabledReason'),
  disabledAdaptor: (d: any) =>
    d.disabled === undefined
      ? {}
      : { disabled: !!d.disabled, disabledAt: d.disabledAt ? new Date(d.disabledAt) : undefined },
}))

import {
  deviceIdentityFields,
  deviceIdentityServed,
  graphQLAddDevice,
  graphQLAddDuplicateDevice,
  graphQLCreateDeviceJoinKey,
  graphQLDeviceJoinKeys,
  graphQLFetchCopiesOf,
  graphQLFetchDuplicateCopies,
  graphQLKeepDuplicate,
  graphQLKeepDuplicates,
  graphQLMakeOriginal,
  graphQLRevokeDeviceJoinKey,
  graphQLRevokeDeviceJoinKeys,
  groupCopies,
  identityAdaptor,
  madeDevice,
  requestCopiesOf,
  requestDuplicateCopies,
  copiesByOriginal,
  resetDeviceIdentity,
} from './deviceIdentity'

const scalar = (name: string) => ({ kind: 'SCALAR', name })
const object = (name: string, fields?: string[]) => ({ kind: 'OBJECT', name, fields: fields?.map(f => ({ name: f })) })
const nonNull = (ofType: any) => ({ kind: 'NON_NULL', name: null, ofType })
const list = (ofType: any) => ({ kind: 'LIST', name: null, ofType })
const arg = (name: string, type: any) => ({ name, type })
const named = (names: string[]) => names.map(name => ({ name, type: scalar('String') }))

const DEVICE_ID = arg('deviceId', nonNull(scalar('String')))
const NAME = arg('name', nonNull(scalar('String')))

// graphql's schema as its branch solo-identity builds it (b56ccc10): the contract's names, and a little more.
const MUTATIONS = [
  {
    name: 'createDeviceJoinKey',
    args: [DEVICE_ID, NAME, arg('expires', scalar('DateTime'))],
    type: nonNull(object('DeviceJoinKeyCreated')),
  },
  {
    name: 'revokeDeviceJoinKey',
    args: [DEVICE_ID, arg('id', nonNull(scalar('ID')))],
    type: nonNull(object('DeviceJoinKey')),
  },
  { name: 'revokeDeviceJoinKeys', args: [DEVICE_ID], type: nonNull(list(nonNull(object('DeviceJoinKey')))) },
  {
    name: 'addDevice',
    args: [
      NAME,
      arg('productId', scalar('String')),
      arg('freshBoot', scalar('Boolean')),
      arg('accountId', scalar('String')),
    ],
    type: nonNull(object('AddedDevice')),
  },
  {
    name: 'keepDuplicate',
    args: [DEVICE_ID, arg('fromOriginal', scalar('Boolean'))],
    type: nonNull(object('Device')),
  },
  {
    name: 'keepDuplicates',
    args: [arg('deviceIds', nonNull(list(nonNull(scalar('String')))))],
    type: nonNull(list(nonNull(object('Device')))),
  },
  { name: 'makeOriginal', args: [DEVICE_ID], type: nonNull(object('Device')) },
  { name: 'addDuplicateDevice', args: [DEVICE_ID, NAME], type: nonNull(object('AddedDevice')) },
]
const DEVICE = [
  { name: 'id', type: nonNull(scalar('String')) },
  { name: 'joinKeys', type: nonNull(list(nonNull(object('DeviceJoinKey')))) },
  { name: 'duplicateOf', type: object('Device') },
  { name: 'duplicate', type: object('DeviceDuplicate') },
  { name: 'copies', type: nonNull(list(nonNull(object('Device')))) },
]
const KEY = ['id', 'name', 'creator', 'created', 'expires', 'revoked', 'lastUsed', 'boots', 'inForce', 'stale']
const TYPES: ILookup<any[]> = {
  DeviceJoinKey: named(KEY),
  DeviceDuplicate: [
    ...named(['kind', 'since', 'seen', 'address', 'place']),
    { name: 'replacement', type: object('Device', ['id', 'name', 'state']) },
  ],
  DeviceJoinKeyCreated: [
    ...named(['id', 'name', 'key']),
    { name: 'joinKey', type: nonNull(object('DeviceJoinKey', KEY)) },
  ],
  AddedDevice: [
    { name: 'device', type: nonNull(object('Device', ['id', 'name', 'state'])) },
    { name: 'joinKey', type: object('DeviceJoinKeyCreated', ['id', 'name', 'key', 'joinKey']) },
  ],
}
// The contract's alone: what an API that serves only it is asked for.
const CONTRACT_TYPES: ILookup<any[]> = {
  DeviceJoinKey: named(['id', 'name', 'created', 'expires', 'revoked', 'lastUsed', 'boots', 'stale']),
  DeviceDuplicate: named(['kind', 'since', 'address']),
  DeviceJoinKeyCreated: named(['id', 'name', 'key']),
  AddedDevice: TYPES.AddedDevice,
}
const FIELDS = '\n  duplicateOf { id name }\n  duplicate { kind since seen address place replacement { id name } }'

type Schema = { mutations?: any[]; device?: any[]; types?: ILookup<any[]> }
let schema: Schema
let answer: (query: string, variables: any) => any
const calls = () => request.mock.calls.map(call => call[0].data)
const called = (name: string) => calls().filter(data => data.query.includes(name))

beforeEach(() => {
  request.mockReset()
  resetDeviceIdentity()
  schema = { mutations: MUTATIONS, device: DEVICE, types: TYPES }
  answer = () => ({ data: {} })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  request.mockImplementation(async ({ data }: any) => {
    if (data.query.includes('DeviceIdentityFields'))
      return {
        data: {
          data: {
            mutation: { fields: schema.mutations || [] },
            device: { fields: schema.device || [] },
          },
        },
      }
    if (data.query.includes('DeviceIdentityTypes')) {
      const read: ILookup<any> = {}
      for (const [, alias, name] of data.query.matchAll(/(t\d+): __type\(name: "(\w+)"\)/g))
        read[alias] = schema.types?.[name] ? { fields: schema.types[name] } : null
      return { data: { data: read } }
    }
    return { data: answer(data.query, data.variables) }
  })
})

describe('device identity: what the API serves', () => {
  it('an older API has none: device queries add nothing, and the probe is read once', async () => {
    schema = { mutations: [{ name: 'deleteDevice', args: [], type: scalar('Boolean') }], device: [DEVICE[0]] }
    expect(await deviceIdentityServed()).toEqual({
      joinKeys: false,
      addDevice: false,
      duplicates: false,
      copyCount: false,
      keepDuplicate: false,
      keepDuplicates: false,
      makeOriginal: false,
      addDuplicateDevice: false,
    })
    expect(await deviceIdentityFields()).toBe('')
    expect(await graphQLDeviceJoinKeys('D1')).toBeNull()
    // No type is read where none is served.
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('serves each part where the API has it', async () => {
    const served = await deviceIdentityServed()
    expect(served).toEqual({
      joinKeys: true,
      addDevice: true,
      duplicates: true,
      copyCount: false,
      keepDuplicate: true,
      keepDuplicates: true,
      makeOriginal: true,
      addDuplicateDevice: true,
    })
    expect(await deviceIdentityFields()).toBe(FIELDS)
    // The probe, then the types the calls select from: two reads, kept.
    await deviceIdentityServed()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('join keys need Device.joinKeys and all three mutations; duplicates need Device.duplicateOf', async () => {
    schema.mutations = MUTATIONS.filter(m => m.name !== 'revokeDeviceJoinKeys')
    expect((await deviceIdentityServed()).joinKeys).toBe(false)
    resetDeviceIdentity()
    schema = { mutations: MUTATIONS, device: DEVICE.filter(f => f.name !== 'duplicateOf'), types: TYPES }
    const served = await deviceIdentityServed()
    expect(served.joinKeys).toBe(true)
    expect(served.duplicates).toBe(false)
    expect(served.keepDuplicate).toBe(false)
    expect(await deviceIdentityFields()).toBe('\n  duplicate { kind since seen address place replacement { id name } }')
  })

  it("counts each device's copies where the API has Device.copyCount beside Device.copies", async () => {
    schema.device = [...DEVICE, { name: 'copyCount', type: nonNull(scalar('Int')) }]
    expect((await deviceIdentityServed()).copyCount).toBe(true)
    expect(await deviceIdentityFields()).toBe(`${FIELDS}\n  copyCount`)
    resetDeviceIdentity()
    schema.device = [...DEVICE.filter(f => f.name !== 'copies'), { name: 'copyCount', type: nonNull(scalar('Int')) }]
    expect((await deviceIdentityServed()).copyCount).toBe(false)
    expect(await deviceIdentityFields()).toBe(FIELDS)
  })

  it("asks only for the contract's fields where the API has no more", async () => {
    schema.types = CONTRACT_TYPES
    expect(await deviceIdentityFields()).toBe('\n  duplicateOf { id name }\n  duplicate { kind since address }')
  })

  it("duplicateOf is asked as given where it is the original's id, not a device", async () => {
    schema.device = [DEVICE[0], { name: 'duplicateOf', type: scalar('String') }]
    expect(await deviceIdentityFields()).toBe('\n  duplicateOf')
  })

  it('a failed probe is asked again', async () => {
    request.mockRejectedValueOnce(new Error('offline'))
    expect((await deviceIdentityServed()).joinKeys).toBe(false)
    expect((await deviceIdentityServed()).joinKeys).toBe(true)
  })
})

describe('identityAdaptor', () => {
  it('reads how many copies wait under a device', () => {
    expect(identityAdaptor({ copyCount: 3 })).toEqual({ copyCount: 3 })
    expect(identityAdaptor({ copyCount: null })).toEqual({ copyCount: 0 })
  })

  it('reads the original as a device or as its id, and a duplicate flag in either spelling', () => {
    expect(identityAdaptor({})).toEqual({})
    expect(identityAdaptor({ duplicateOf: null, duplicate: null })).toEqual({
      duplicateOf: undefined,
      duplicate: undefined,
    })
    expect(identityAdaptor({ duplicateOf: { id: 'X', name: 'Pump' } }).duplicateOf).toEqual({ id: 'X', name: 'Pump' })
    expect(identityAdaptor({ duplicateOf: 'X' }).duplicateOf).toEqual({ id: 'X' })
    const flag = identityAdaptor({
      duplicate: { kind: 'DEVICE_JOIN_KEY', since: '2026-11-09T10:00:00Z', address: '203.0.113.7' },
    }).duplicate!
    expect(flag.kind).toBe('device-join-key')
    expect(flag.since?.toISOString()).toBe('2026-11-09T10:00:00.000Z')
    expect(flag.address).toBe('203.0.113.7')
    expect(identityAdaptor({ duplicate: { kind: 'key' } }).duplicate).toEqual({
      kind: 'key',
      since: undefined,
      seen: undefined,
      address: undefined,
      place: undefined,
      replacement: undefined,
    })
    const waiting = identityAdaptor({
      duplicate: {
        kind: 'device-join-key',
        seen: '2026-11-09T11:00:00Z',
        place: 'Portland, OR',
        replacement: { id: 'D2', name: 'Kiosk (copy)' },
      },
    }).duplicate!
    expect(waiting.seen?.toISOString()).toBe('2026-11-09T11:00:00.000Z')
    expect(waiting.place).toBe('Portland, OR')
    expect(waiting.replacement).toEqual({ id: 'D2', name: 'Kiosk (copy)' })
  })
})

describe('join keys', () => {
  it('lists a device’s keys with the fields the API has', async () => {
    answer = () => ({
      data: {
        login: {
          device: [
            {
              id: 'D1',
              joinKeys: [
                {
                  id: 'k2',
                  name: 'USB stick',
                  created: '2026-11-09T10:00:00Z',
                  expires: null,
                  revoked: null,
                  lastUsed: '2026-11-09T11:00:00Z',
                  boots: 3,
                  inForce: true,
                  stale: false,
                },
                { id: 'k1', name: 'Image', created: '2026-09-01T10:00:00Z', stale: true },
              ],
            },
          ],
        },
      },
    })
    const keys = await graphQLDeviceJoinKeys('D1')
    expect(keys).toEqual([
      {
        id: 'k2',
        name: 'USB stick',
        created: '2026-11-09T10:00:00Z',
        expires: null,
        revoked: null,
        lastUsed: '2026-11-09T11:00:00Z',
        boots: 3,
        stale: false,
        inForce: true,
      },
      {
        id: 'k1',
        name: 'Image',
        created: '2026-09-01T10:00:00Z',
        expires: null,
        revoked: null,
        lastUsed: null,
        boots: 0,
        stale: true,
        inForce: undefined,
      },
    ])
    const [read] = called('DeviceJoinKeys')
    expect(read.query).toMatch(/joinKeys \{ id name created expires revoked lastUsed boots stale inForce \}/)
    expect(read.variables).toEqual({ id: ['D1'] })
  })

  it('a device that cannot be read has none to show', async () => {
    answer = () => ({ data: { login: { device: [] } } })
    expect(await graphQLDeviceJoinKeys('D1')).toBeNull()
  })

  it('issues a key typed as the API declares it, answering the key once; an expiry only where given', async () => {
    answer = () => ({ data: { createDeviceJoinKey: { id: 'k3', name: 'Rack', key: 'r3dk_AAAA.c2VlZA' } } })
    expect(await graphQLCreateDeviceJoinKey('D1', 'Rack')).toEqual({ key: 'r3dk_AAAA.c2VlZA' })
    const [first] = called('createDeviceJoinKey')
    expect(first.query).toMatch(/mutation CreateDeviceJoinKey\(\$deviceId: String!, \$name: String!\)/)
    expect(first.query).toMatch(
      /createDeviceJoinKey\(deviceId: \$deviceId, name: \$name\) \{ id name key joinKey \{ id name \} \}/
    )
    expect(first.variables).toEqual({ deviceId: 'D1', name: 'Rack' })

    await graphQLCreateDeviceJoinKey('D1', 'Rack', '2027-01-01T00:00:00.000Z')
    const second = called('createDeviceJoinKey')[1]
    expect(second.query).toMatch(/\$expires: DateTime/)
    expect(second.variables.expires).toBe('2027-01-01T00:00:00.000Z')
  })

  it("a refusal comes back in graphql's words", async () => {
    answer = () => ({ errors: [{ message: 'two keys are in force: revoke one first' }] })
    expect(await graphQLCreateDeviceJoinKey('D1', 'Third')).toEqual({
      reason: 'Two keys are in force: revoke one first',
    })
    answer = () => ({ errors: [{ message: 'a device join key needs a Control Link device' }] })
    expect(await graphQLRevokeDeviceJoinKey('D1', 'k1')).toBe('A device join key needs a Control Link device')
  })

  it('revokes one key, or every one; nothing said where it went through', async () => {
    answer = () => ({
      data: {
        revokeDeviceJoinKey: { __typename: 'DeviceJoinKey' },
        revokeDeviceJoinKeys: [{ __typename: 'DeviceJoinKey' }],
      },
    })
    expect(await graphQLRevokeDeviceJoinKey('D1', 'k1')).toBeUndefined()
    expect(await graphQLRevokeDeviceJoinKeys('D1')).toBeUndefined()
    const [one] = called('revokeDeviceJoinKey(')
    expect(one.query).toMatch(/\$id: ID!/)
    expect(one.query).toMatch(/\{ __typename \}/)
    expect(one.variables).toEqual({ deviceId: 'D1', id: 'k1' })
    const [all] = called('revokeDeviceJoinKeys')
    expect(all.query).toMatch(/revokeDeviceJoinKeys\(deviceId: \$deviceId\) \{ __typename \}/)
  })

  it('a scalar answer is asked for as it is', async () => {
    schema.mutations = MUTATIONS.map(m =>
      m.name === 'revokeDeviceJoinKeys' ? { ...m, type: nonNull(scalar('Int')) } : m
    )
    answer = () => ({ data: { revokeDeviceJoinKeys: 2 } })
    expect(await graphQLRevokeDeviceJoinKeys('D1')).toBeUndefined()
    expect(called('revokeDeviceJoinKeys')[0].query).not.toMatch(/\{ __typename \}/)
  })
})

describe('a device added ahead, and a duplicate kept as a new device', () => {
  it('addDevice passes what it is given and answers the device and its key once', async () => {
    answer = () => ({
      data: {
        addDevice: {
          device: { id: 'D9', name: 'Kiosk 4' },
          joinKey: { id: 'k1', name: 'first key', key: 'r3dk_BBBB.c2VlZA' },
        },
      },
    })
    expect(await graphQLAddDevice({ name: 'Kiosk 4', productId: 'P1', freshBoot: true })).toEqual({
      deviceId: 'D9',
      name: 'Kiosk 4',
      key: 'r3dk_BBBB.c2VlZA',
    })
    const [add] = called('addDevice')
    expect(add.query).toMatch(/\$name: String!, \$productId: String, \$freshBoot: Boolean\)/)
    expect(add.query).toMatch(/\{ device \{ id name \} joinKey \{ id name key \} \}/)
    expect(add.variables).toEqual({ name: 'Kiosk 4', productId: 'P1', freshBoot: true })

    // With no product, the account it is added to.
    answer = () => ({ data: { addDevice: { device: { id: 'D10', name: 'Kiosk 5' }, joinKey: null } } })
    expect(await graphQLAddDevice({ name: 'Kiosk 5', freshBoot: false, accountId: 'ORG' })).toEqual({
      deviceId: 'D10',
      name: 'Kiosk 5',
      key: undefined,
    })
    expect(called('addDevice')[1].query).toMatch(/\$accountId: String/)
    expect(called('addDevice')[1].variables).toEqual({ name: 'Kiosk 5', freshBoot: false, accountId: 'ORG' })
  })

  it('an API with no accountId is not sent one', async () => {
    schema.mutations = MUTATIONS.map(m =>
      m.name === 'addDevice' ? { ...m, args: m.args.filter(a => a.name !== 'accountId') } : m
    )
    answer = () => ({ data: { addDevice: { device: { id: 'D10', name: 'Kiosk 5' } } } })
    await graphQLAddDevice({ name: 'Kiosk 5', freshBoot: false, accountId: 'ORG' })
    expect(called('addDevice')[0].variables).toEqual({ name: 'Kiosk 5', freshBoot: false })
  })

  it('the answer read wherever graphql puts the device and the key', () => {
    expect(madeDevice({ id: 'D9', name: 'Kiosk', key: 'r3dk_x' })).toEqual({
      deviceId: 'D9',
      name: 'Kiosk',
      key: 'r3dk_x',
    })
    expect(madeDevice({ deviceId: 'D9', joinKey: { key: 'r3dk_x' } })).toEqual({
      deviceId: 'D9',
      name: undefined,
      key: 'r3dk_x',
    })
    expect(madeDevice('D9')).toEqual({ deviceId: 'D9' })
    expect(madeDevice('r3dk_x')).toEqual({ key: 'r3dk_x' })
    expect(madeDevice(null)).toEqual({})
  })

  it('keeps one copy, from its original’s setup or not; several; makes one the original', async () => {
    answer = () => ({ data: {} })
    expect(await graphQLKeepDuplicate('Y1', false)).toBeUndefined()
    expect(called('keepDuplicate(')[0].variables).toEqual({ deviceId: 'Y1', fromOriginal: false })
    await graphQLKeepDuplicates(['Y1', 'Y2'])
    expect(called('keepDuplicates')[0].query).toMatch(/\$deviceIds: \[String!\]!/)
    expect(called('keepDuplicates')[0].variables).toEqual({ deviceIds: ['Y1', 'Y2'] })
    await graphQLMakeOriginal('Y1')
    expect(called('makeOriginal')[0].variables).toEqual({ deviceId: 'Y1' })
  })

  it('addDuplicateDevice answers the new device and its key', async () => {
    answer = () => ({
      data: { addDuplicateDevice: { device: { id: 'D10', name: 'Pump (copy)' }, joinKey: { key: 'r3dk_C' } } },
    })
    expect(await graphQLAddDuplicateDevice('X1', 'Pump (copy)')).toEqual({
      deviceId: 'D10',
      name: 'Pump (copy)',
      key: 'r3dk_C',
    })
    expect(called('addDuplicateDevice')[0].variables).toEqual({ deviceId: 'X1', name: 'Pump (copy)' })
  })

  it('a mutation the API lacks is not sent', async () => {
    schema.mutations = MUTATIONS.filter(m => m.name !== 'makeOriginal')
    expect(await graphQLMakeOriginal('Y1')).toBe('')
    expect(called('makeOriginal')).toHaveLength(0)
  })
})

describe('the copies awaiting a decision', () => {
  const copy = (id: string, of?: string, disabled = true) => ({
    id,
    name: id,
    platform: 1072,
    permissions: ['VIEW', 'MANAGE'],
    owner: { id: 'U1', email: 'a@example.com' },
    disabled,
    disabledAt: '2026-11-09T10:00:00Z',
    duplicateOf: of ? { id: of, name: `${of} name` } : null,
  })

  it('reads the disabled devices page by page, keeping those split off another device', async () => {
    const pages = [
      { total: 101, items: [copy('Y1', 'X1'), copy('Z1'), ...Array.from({ length: 98 }, (_, i) => copy(`N${i}`))] },
      { total: 101, items: [copy('Y2', 'X1')] },
    ]
    let page = 0
    answer = () => ({ data: { login: { account: { devices: pages[page++] } } } })
    const found = await graphQLFetchDuplicateCopies('A1')
    expect(found === 'ERROR' ? [] : found.map(c => c.id)).toEqual(['Y1', 'Y2'])
    const reads = called('DuplicateCopies')
    expect(reads).toHaveLength(2)
    expect(reads[0].query).toMatch(/devices\(disabled: true/)
    expect(reads[0].query).toMatch(/duplicateOf \{ id name \}/)
    expect(reads[1].variables).toEqual({ accountId: 'A1', size: 100, from: 100 })
    const groups = groupCopies(found === 'ERROR' ? [] : found)
    expect([...groups.keys()]).toEqual(['X1'])
    expect(groups.get('X1')!.map(c => c.id)).toEqual(['Y1', 'Y2'])
  })

  it('none where the API has no duplicates', async () => {
    schema.device = [DEVICE[0]]
    expect(await graphQLFetchDuplicateCopies('A1')).toEqual([])
    expect(called('DuplicateCopies')).toHaveLength(0)
  })

  describe("where the API counts each device's copies", () => {
    beforeEach(() => {
      schema.device = [...DEVICE, { name: 'copyCount', type: nonNull(scalar('Int')) }]
    })

    it('reads the copies of the devices asked for in one query, each from its own', async () => {
      answer = () => ({
        data: {
          login: {
            device: [
              { id: 'X1', copies: [copy('Y1', 'X1'), copy('Y2', 'X1'), copy('Y3', 'X1', false)] },
              { id: 'X2', copies: [] },
            ],
          },
        },
      })
      const found = await graphQLFetchCopiesOf(['X1', 'X2'])
      expect(found === 'ERROR' ? 'ERROR' : [...found.entries()].map(([id, list]) => [id, list.map(c => c.id)])).toEqual(
        [
          ['X1', ['Y1', 'Y2']],
          ['X2', []],
        ]
      )
      const reads = called('CopiesOf')
      expect(reads).toHaveLength(1)
      expect(reads[0].variables).toEqual({ ids: ['X1', 'X2'] })
      expect(reads[0].query).toMatch(/device\(id: \$ids\) \{\s+id\s+copies \{/)
    })

    it('each device once unless asked again, and again for every device read once its copies are decided on', async () => {
      let read = 0
      answer = (_query, variables) => {
        read++
        return {
          data: {
            login: { device: variables.ids.map((id: string) => ({ id, copies: read === 1 ? [copy('Y1', id)] : [] })) },
          },
        }
      }
      await requestCopiesOf(['X1'])
      await requestCopiesOf(['X1'])
      expect(called('CopiesOf')).toHaveLength(1)
      expect(
        copiesByOriginal()
          .get('X1')!
          .map(c => c.id)
      ).toEqual(['Y1'])
      // Kept or removed: the account's copies asked again reads these devices', not the account's disabled devices.
      await requestDuplicateCopies('A1', true)
      expect(called('CopiesOf')).toHaveLength(2)
      expect(called('DuplicateCopies')).toHaveLength(0)
      expect(copiesByOriginal().get('X1')).toEqual([])
    })
  })
})
