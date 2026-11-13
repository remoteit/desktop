import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  graphQLDeleteDeviceProduct,
  graphQLRemoveDeviceProductService,
  graphQLRevokeDeviceProductCode,
  graphQLRotateDeviceProductCode,
  graphQLTransferDeviceProduct,
} = vi.hoisted(() => ({
  graphQLDeleteDeviceProduct: vi.fn(),
  graphQLRemoveDeviceProductService: vi.fn(),
  graphQLRevokeDeviceProductCode: vi.fn(),
  graphQLRotateDeviceProductCode: vi.fn(),
  graphQLTransferDeviceProduct: vi.fn(),
}))
vi.mock('../services/graphQLDeviceProducts', () => ({
  graphQLDeleteDeviceProduct,
  graphQLRemoveDeviceProductService,
  graphQLRevokeDeviceProductCode,
  graphQLRotateDeviceProductCode,
  graphQLTransferDeviceProduct,
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'acct' }))

import products from './products'

const pump = { id: 'p1', name: 'Pump', services: [{ id: 's1' }] }
const valve = { id: 'p2', name: 'Valve', services: [] }
const state = { products: { acct: { initialized: true, fetching: false, all: [pump, valve], selected: ['p1', 'p2'] } } }
const ok = { data: { data: {} } }

let dispatch: {
  products: { set: ReturnType<typeof vi.fn>; refreshCodes: ReturnType<typeof vi.fn> }
  ui: { set: ReturnType<typeof vi.fn> }
}
const effects = () => (products as any).effects(dispatch)

beforeEach(() => {
  vi.resetAllMocks()
  dispatch = { products: { set: vi.fn(), refreshCodes: vi.fn() }, ui: { set: vi.fn() } }
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
    expect(dispatch.products.set).toHaveBeenCalledWith({ all: [pump], selected: [], accountId: 'acct' })
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
    expect(dispatch.products.refreshCodes).toHaveBeenCalledWith({ productId: 'p3', accountId: 'acct' })
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
