import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  graphQLDeleteDeviceProduct,
  graphQLRemoveDeviceProductService,
  graphQLRevokeDeviceProductCode,
  graphQLRotateDeviceProductCode,
  graphQLTransferDeviceProduct,
  graphQLDeviceProduct,
  graphQLCreateDeviceProductJoinKey,
  graphQLRevokeDeviceProductJoinKey,
  graphQLCreateDeviceProductOneTimeCode,
  graphQLSetDeviceProductLifecycle,
} = vi.hoisted(() => ({
  graphQLDeleteDeviceProduct: vi.fn(),
  graphQLRemoveDeviceProductService: vi.fn(),
  graphQLRevokeDeviceProductCode: vi.fn(),
  graphQLRotateDeviceProductCode: vi.fn(),
  graphQLTransferDeviceProduct: vi.fn(),
  graphQLDeviceProduct: vi.fn(),
  graphQLCreateDeviceProductJoinKey: vi.fn(),
  graphQLRevokeDeviceProductJoinKey: vi.fn(),
  graphQLCreateDeviceProductOneTimeCode: vi.fn(),
  graphQLSetDeviceProductLifecycle: vi.fn(),
}))
vi.mock('../services/graphQLDeviceProducts', () => ({
  graphQLDeleteDeviceProduct,
  graphQLRemoveDeviceProductService,
  graphQLRevokeDeviceProductCode,
  graphQLRotateDeviceProductCode,
  graphQLTransferDeviceProduct,
  graphQLDeviceProduct,
  graphQLCreateDeviceProductJoinKey,
  graphQLRevokeDeviceProductJoinKey,
  graphQLCreateDeviceProductOneTimeCode,
  graphQLSetDeviceProductLifecycle,
}))
vi.mock('../selectors/accounts', () => ({
  selectActiveAccountId: () => 'acct',
  // One sign-in: a row is its account's own id.
  selectRow: (_state: unknown, accountId?: string) => accountId || 'acct',
  rowSaid: (_state: unknown, of?: any) => {
    const accountId = (typeof of === 'string' ? of : of?.accountId) || 'acct'
    return { accountId, row: of?.row ?? accountId }
  },
}))

import products from './products'

const pump = { id: 'p1', name: 'Pump', services: [{ id: 's1' }] }
const valve = { id: 'p2', name: 'Valve', services: [] }
const state = { products: { acct: { initialized: true, fetching: false, all: [pump, valve], selected: ['p1', 'p2'] } } }
const ok = { data: { data: {} } }

let dispatch: {
  products: Record<'set' | 'refreshCredentials' | 'mergeCredentials', ReturnType<typeof vi.fn>>
  ui: { set: ReturnType<typeof vi.fn> }
}
const effects = () => (products as any).effects(dispatch)
const reducers = (products as any).reducers

const SECRET = 'r3jk_AAAA.c2VjcmV0LXNlZWQ'
const joinKey = {
  id: 'AAAA',
  name: 'Fleet',
  created: '2026-11-06T10:00:00Z',
  joins: 0,
  joinRate: 10,
  inForce: true,
  unused: false,
}
const credentials = {
  registrationCode: null,
  registrationCommand: null,
  registrationCodes: [],
  oneTimeCodes: [{ code: 'OTC-1', created: '2026-11-06T10:00:00Z', expires: '2026-11-07T10:00:00Z', used: 0 }],
  joinKeys: [joinKey],
  registrationWarning: null,
  lifecycle: 'persistent',
}
const productRead = (fields: object) => ({
  data: { data: { login: { account: { deviceProducts: { items: [{ id: 'p1', ...fields }] } } } } },
})

beforeEach(() => {
  vi.resetAllMocks()
  dispatch = {
    products: { set: vi.fn(), refreshCredentials: vi.fn(), mergeCredentials: vi.fn() },
    ui: { set: vi.fn() },
  }
})

describe('a failed product request is not treated as a success', () => {
  it('delete keeps the product and reports failure', async () => {
    graphQLDeleteDeviceProduct.mockResolvedValue('ERROR')
    expect(await effects().delete('p1', state)).toBe(false)
    expect(dispatch.products.set).not.toHaveBeenCalled()
  })

  it('deleteSelected removes only the products whose delete succeeded', async () => {
    graphQLDeleteDeviceProduct.mockImplementation(async (id: string) => (id === 'p1' ? 'ERROR' : ok))
    await effects().deleteSelected(undefined, state)
    expect(dispatch.products.set).toHaveBeenCalledWith({ all: [pump], selected: [], accountId: 'acct', row: 'acct' })
  })

  it('removeService keeps the service and reports failure', async () => {
    graphQLRemoveDeviceProductService.mockResolvedValue('ERROR')
    expect(await effects().removeService({ productId: 'p1', serviceId: 's1' }, state)).toBe(false)
    expect(dispatch.products.set).not.toHaveBeenCalled()
  })

  it('transferProduct keeps the product, shows no success and clears transferring', async () => {
    graphQLTransferDeviceProduct.mockResolvedValue('ERROR')
    expect(await effects().transferProduct({ productId: 'p1', email: 'a@example.com' }, state)).toBe(false)
    expect(dispatch.products.set).not.toHaveBeenCalled()
    expect(dispatch.ui.set.mock.calls).toEqual([[{ transferring: true }], [{ transferring: false }]])
  })

  it('revokeJoinKey reports failure and reads nothing again', async () => {
    graphQLRevokeDeviceProductJoinKey.mockResolvedValue('ERROR')
    expect(await effects().revokeJoinKey({ productId: 'p1', id: 'AAAA' }, state)).toBe(false)
    expect(dispatch.products.refreshCredentials).not.toHaveBeenCalled()
  })
})

describe('join keys', () => {
  it('answers the new key to the caller alone, and reads the credentials again', async () => {
    graphQLCreateDeviceProductJoinKey.mockResolvedValue({
      data: { data: { createDeviceProductJoinKey: { key: SECRET, joinKey: { id: 'AAAA' } } } },
    })
    const input = { productId: 'p1', name: 'Fleet', joinRate: 5 }
    expect(await effects().createJoinKey(input, state)).toEqual({ key: SECRET })
    expect(graphQLCreateDeviceProductJoinKey).toHaveBeenCalledWith(input)
    expect(dispatch.products.refreshCredentials).toHaveBeenCalledWith({
      productId: 'p1',
      accountId: 'acct',
      row: 'acct',
    })
    // Nothing the store is given carries the key.
    expect(
      JSON.stringify([dispatch.products, dispatch.ui].map(group => Object.values(group).map(fn => fn.mock.calls)))
    ).not.toContain('c2VjcmV0')
  })

  it("passes graphql's refusal back for the form, and reads nothing again", async () => {
    graphQLCreateDeviceProductJoinKey.mockResolvedValue({ reason: 'A time in the future' })
    expect(await effects().createJoinKey({ productId: 'p1', name: 'Fleet' }, state)).toEqual({
      reason: 'A time in the future',
    })
    expect(dispatch.products.refreshCredentials).not.toHaveBeenCalled()
  })

  it('answers nothing when the request failed', async () => {
    graphQLCreateDeviceProductJoinKey.mockResolvedValue('ERROR')
    expect(await effects().createJoinKey({ productId: 'p1', name: 'Fleet' }, state)).toEqual({})
  })

  it('reads the credentials again after a revocation', async () => {
    graphQLRevokeDeviceProductJoinKey.mockResolvedValue({
      data: { data: { revokeDeviceProductJoinKey: { id: 'AAAA' } } },
    })
    expect(await effects().revokeJoinKey({ productId: 'p1', id: 'AAAA' }, state)).toBe(true)
    expect(graphQLRevokeDeviceProductJoinKey).toHaveBeenCalledWith('p1', 'AAAA')
    expect(dispatch.products.refreshCredentials).toHaveBeenCalledWith({
      productId: 'p1',
      accountId: 'acct',
      row: 'acct',
    })
  })
})

describe('one-time codes', () => {
  it('answers the new code and reads the credentials again', async () => {
    const code = { code: 'OTC-1', created: '2026-11-06T10:00:00Z', expires: '2026-11-07T10:00:00Z', used: 0 }
    graphQLCreateDeviceProductOneTimeCode.mockResolvedValue({
      data: { data: { createDeviceProductOneTimeCode: code } },
    })
    expect(await effects().createOneTimeCode('p1', state)).toEqual(code)
    expect(dispatch.products.refreshCredentials).toHaveBeenCalledWith({
      productId: 'p1',
      accountId: 'acct',
      row: 'acct',
    })
  })

  it('answers nothing when the request failed', async () => {
    graphQLCreateDeviceProductOneTimeCode.mockResolvedValue('ERROR')
    expect(await effects().createOneTimeCode('p1', state)).toBeUndefined()
    expect(dispatch.products.refreshCredentials).not.toHaveBeenCalled()
  })
})

describe('lifecycle', () => {
  it('changed, it is read again with the credentials', async () => {
    graphQLSetDeviceProductLifecycle.mockResolvedValue({
      data: { data: { setDeviceProductLifecycle: { id: 'p1', lifecycle: 'ephemeral' } } },
    })
    expect(await effects().setLifecycle({ productId: 'p1', lifecycle: 'ephemeral' }, state)).toEqual({})
    expect(graphQLSetDeviceProductLifecycle).toHaveBeenCalledWith('p1', 'ephemeral')
    expect(dispatch.products.refreshCredentials).toHaveBeenCalledWith({
      productId: 'p1',
      accountId: 'acct',
      row: 'acct',
    })
  })

  it("refused, graphql's words are answered and nothing is read again; a failed request has none", async () => {
    graphQLSetDeviceProductLifecycle.mockResolvedValue({ reason: '2 devices run a daemon that cannot' })
    expect(await effects().setLifecycle({ productId: 'p1', lifecycle: 'ephemeral' }, state)).toEqual({
      reason: '2 devices run a daemon that cannot',
    })
    graphQLSetDeviceProductLifecycle.mockResolvedValue('ERROR')
    expect(await effects().setLifecycle({ productId: 'p1', lifecycle: 'ephemeral' }, state)).toEqual({ reason: '' })
    expect(dispatch.products.refreshCredentials).not.toHaveBeenCalled()
  })
})

describe('refreshCredentials', () => {
  it('merges every credential field the product read carries, and nothing else', async () => {
    graphQLDeviceProduct.mockResolvedValue(productRead({ ...credentials, name: 'Renamed' }))
    await effects().refreshCredentials({ productId: 'p1', accountId: 'org' })
    // Asked as the row's sign-in, and kept under the row (one sign-in: the account's own id).
    expect(graphQLDeviceProduct).toHaveBeenCalledWith('p1', 'org', { sub: '', row: true })
    expect(dispatch.products.mergeCredentials).toHaveBeenCalledWith({ row: 'org', productId: 'p1', credentials })
  })

  it('clears the credentials when the read fails, rather than leave them stale', async () => {
    graphQLDeviceProduct.mockResolvedValue('ERROR')
    await effects().refreshCredentials({ productId: 'p1', accountId: 'org' })
    const [[{ credentials: cleared }]] = dispatch.products.mergeCredentials.mock.calls
    expect(Object.keys(cleared).sort()).toEqual(Object.keys(credentials).sort())
    expect(Object.values(cleared).every(value => value === undefined)).toBe(true)
  })

  it('drops a read superseded by a later one', async () => {
    let answerFirst: (value: unknown) => void = () => {}
    graphQLDeviceProduct
      .mockReturnValueOnce(new Promise(resolve => (answerFirst = resolve)))
      .mockResolvedValueOnce(productRead(credentials))
    const first = effects().refreshCredentials({ productId: 'p1', accountId: 'org' })
    await effects().refreshCredentials({ productId: 'p1', accountId: 'org' })
    answerFirst(productRead({ ...credentials, joinKeys: [] }))
    await first
    expect(dispatch.products.mergeCredentials).toHaveBeenCalledTimes(1)
    expect(dispatch.products.mergeCredentials.mock.calls[0][0].credentials.joinKeys).toEqual([joinKey])
  })
})

describe('mergeCredentials', () => {
  const store = { org: { initialized: true, fetching: false, all: [pump, valve], selected: [] } }

  it('merges the credentials into the one product', () => {
    const next = reducers.mergeCredentials(store, { row: 'org', productId: 'p1', credentials })
    expect(next.org.all[0]).toEqual({ ...pump, ...credentials })
    expect(next.org.all[1]).toBe(valve)
  })

  it('leaves the state as it is when nothing changes', () => {
    const merged = reducers.mergeCredentials(store, { row: 'org', productId: 'p1', credentials })
    expect(reducers.mergeCredentials(merged, { row: 'org', productId: 'p1', credentials })).toBe(merged)
  })
})

describe('replacing a registration code keeps at most two in use', () => {
  const coded = {
    id: 'p3',
    name: 'Gateway',
    services: [],
    registrationCodes: [
      { code: 'C3', created: '2026-11-13T03:00:00Z', revoked: null },
      { code: 'C2', created: '2026-11-13T02:00:00Z', revoked: null },
      { code: 'C1', created: '2026-11-13T01:00:00Z', revoked: null },
      { code: 'C0', created: '2026-11-13T00:00:00Z', revoked: '2026-11-13T00:30:00Z' },
    ],
  }
  const codedState = { products: { acct: { initialized: true, fetching: false, all: [coded], selected: [] } } }
  const rotated = { data: { data: { rotateDeviceProductCode: { code: 'C4' } } } }
  const revoked = { data: { data: { revokeDeviceProductCode: { code: 'C' } } } }

  it('keeps the replaced code and revokes the older ones the API would keep', async () => {
    graphQLRotateDeviceProductCode.mockResolvedValue(rotated)
    graphQLRevokeDeviceProductCode.mockResolvedValue(revoked)

    expect(await effects().rotateCode({ productId: 'p3' }, codedState)).toBe(true)
    expect(graphQLRevokeDeviceProductCode.mock.calls).toEqual([
      ['p3', 'C2'],
      ['p3', 'C1'],
    ])
    expect(dispatch.products.refreshCredentials).toHaveBeenCalledWith({
      productId: 'p3',
      accountId: 'acct',
      row: 'acct',
    })
  })

  it('revokes the replaced code too with revokePrevious', async () => {
    graphQLRotateDeviceProductCode.mockResolvedValue(rotated)
    graphQLRevokeDeviceProductCode.mockResolvedValue(revoked)

    await effects().rotateCode({ productId: 'p3', revokePrevious: true }, codedState)

    expect(graphQLRevokeDeviceProductCode.mock.calls.map(([, code]) => code)).toEqual(['C3', 'C2', 'C1'])
  })

  it('revokes nothing when the new code was not issued', async () => {
    graphQLRotateDeviceProductCode.mockResolvedValue('ERROR')

    expect(await effects().rotateCode({ productId: 'p3', revokePrevious: true }, codedState)).toBe(false)
    expect(graphQLRevokeDeviceProductCode).not.toHaveBeenCalled()
  })
})

describe('rotating a product with join keys leaves earlier reusable codes active', () => {
  const registrationCodes = ['C3', 'C2', 'C1'].map(code => ({ code, created: '2026-11-13T00:00:00Z' }))
  const codedState = {
    products: { acct: { ...state.products.acct, all: [{ ...pump, registrationCodes, joinKeys: [joinKey] }] } },
  }

  it('keeps every earlier code active by default', async () => {
    graphQLRotateDeviceProductCode.mockResolvedValue({ data: { data: { rotateDeviceProductCode: { code: 'C4' } } } })

    expect(await effects().rotateCode({ productId: pump.id }, codedState)).toBe(true)
    expect(graphQLRevokeDeviceProductCode).not.toHaveBeenCalled()
    expect(dispatch.products.refreshCredentials).toHaveBeenCalledWith({
      productId: pump.id,
      accountId: 'acct',
      row: 'acct',
    })
  })

  it('revokes just the current code when selected', async () => {
    graphQLRotateDeviceProductCode.mockResolvedValue({ data: { data: { rotateDeviceProductCode: { code: 'C4' } } } })
    graphQLRevokeDeviceProductCode.mockResolvedValue({ data: { data: { revokeDeviceProductCode: { code: 'C3' } } } })

    expect(await effects().rotateCode({ productId: pump.id, revokePrevious: true }, codedState)).toBe(true)
    expect(graphQLRevokeDeviceProductCode.mock.calls).toEqual([[pump.id, 'C3']])
  })
})
