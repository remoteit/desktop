import { describe, it, expect, vi, beforeEach } from 'vitest'

const { graphQLDeleteDeviceProduct, graphQLRemoveDeviceProductService, graphQLTransferDeviceProduct } = vi.hoisted(
  () => ({
    graphQLDeleteDeviceProduct: vi.fn(),
    graphQLRemoveDeviceProductService: vi.fn(),
    graphQLTransferDeviceProduct: vi.fn(),
  })
)
vi.mock('../services/graphQLDeviceProducts', () => ({
  graphQLDeleteDeviceProduct,
  graphQLRemoveDeviceProductService,
  graphQLTransferDeviceProduct,
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'acct' }))

import products from './products'

const pump = { id: 'p1', name: 'Pump', services: [{ id: 's1' }] }
const valve = { id: 'p2', name: 'Valve', services: [] }
const state = { products: { acct: { initialized: true, fetching: false, all: [pump, valve], selected: ['p1', 'p2'] } } }
const ok = { data: { data: {} } }

let dispatch: { products: { set: ReturnType<typeof vi.fn> }; ui: { set: ReturnType<typeof vi.fn> } }
const effects = () => (products as any).effects(dispatch)

beforeEach(() => {
  vi.resetAllMocks()
  dispatch = { products: { set: vi.fn() }, ui: { set: vi.fn() } }
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
