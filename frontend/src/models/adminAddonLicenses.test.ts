import { describe, it, expect, vi, beforeEach } from 'vitest'

// The model touches nothing but the two request wrappers; stub those and drive the effects and
// reducers directly, the way chat.test.ts does.
const { graphQLAdminAddonProducts, graphQLAdminAddonCustomers } = vi.hoisted(() => ({
  graphQLAdminAddonProducts: vi.fn(),
  graphQLAdminAddonCustomers: vi.fn(),
}))
vi.mock('../services/graphQLRequest', () => ({ graphQLAdminAddonProducts, graphQLAdminAddonCustomers }))

import { adminAddonLicenses } from './adminAddonLicenses'

const model = adminAddonLicenses as any
const effectsFor = (dispatch: any) => model.effects(dispatch)
const makeDispatch = () => ({
  adminAddonLicenses: {
    setProducts: vi.fn(),
    setProductId: vi.fn(),
    setCustomers: vi.fn(),
    appendCustomers: vi.fn(),
    setLoading: vi.fn(),
    fetch: vi.fn(),
  },
})
const stateWith = (over: Record<string, unknown> = {}) => ({
  adminAddonLicenses: { ...model.state, ...over },
})
const page = (items: unknown[], total: number, hasMore: boolean) => ({
  data: { data: { admin: { addonCustomers: { items, total, hasMore } } } },
})
const holder = (userId: string) => ({ userId, email: `${userId}@example.com` })

beforeEach(() => {
  graphQLAdminAddonProducts.mockReset()
  graphQLAdminAddonCustomers.mockReset()
})

describe('adminAddonLicenses reducers', () => {
  it('a new product empties the list — the rows on screen belong to the old one', () => {
    const before = { ...model.state, productId: 'a', customers: [holder('u1')], total: 1, hasMore: true }
    const after = model.reducers.setProductId(before, 'b')
    expect(after).toMatchObject({ productId: 'b', customers: [], total: 0, hasMore: false })
  })

  it('re-selecting the current product keeps the state, identity included', () => {
    const before = { ...model.state, productId: 'a', customers: [holder('u1')], total: 1 }
    expect(model.reducers.setProductId(before, 'a')).toBe(before)
  })

  it('the product list marks itself loaded, empty or not', () => {
    expect(model.reducers.setProducts(model.state, [])).toMatchObject({ products: [], productsLoaded: true })
  })
})

describe('adminAddonLicenses effects', () => {
  it('fetchProducts stores what the API lists and ignores a refused request', async () => {
    const dispatch = makeDispatch()
    const products = [{ id: 'p1', name: 'ai-agent', description: 'AI Agent', enabled: true }]
    graphQLAdminAddonProducts.mockResolvedValueOnce({ data: { data: { admin: { addonProducts: products } } } })
    await effectsFor(dispatch).fetchProducts()
    expect(dispatch.adminAddonLicenses.setProducts).toHaveBeenCalledWith(products)

    graphQLAdminAddonProducts.mockResolvedValueOnce('ERROR')
    await effectsFor(dispatch).fetchProducts()
    expect(dispatch.adminAddonLicenses.setProducts).toHaveBeenCalledTimes(1)
  })

  it('select switches product and fetches; the product already on screen is a no-op', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).select('p2', stateWith({ productId: 'p1' }))
    expect(dispatch.adminAddonLicenses.setProductId).toHaveBeenCalledWith('p2')
    expect(dispatch.adminAddonLicenses.fetch).toHaveBeenCalledTimes(1)

    await effectsFor(dispatch).select('p1', stateWith({ productId: 'p1' }))
    expect(dispatch.adminAddonLicenses.setProductId).toHaveBeenCalledTimes(1)
    expect(dispatch.adminAddonLicenses.fetch).toHaveBeenCalledTimes(1)
  })

  it('fetch asks for the selected product with the committed search, and never without a product', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).fetch(undefined, stateWith({ productId: undefined }))
    expect(graphQLAdminAddonCustomers).not.toHaveBeenCalled()

    graphQLAdminAddonCustomers.mockResolvedValueOnce(page([holder('u1')], 7, true))
    await effectsFor(dispatch).fetch(undefined, stateWith({ productId: 'p1', pageSize: 50, searchValue: '  ann  ' }))
    expect(graphQLAdminAddonCustomers).toHaveBeenCalledWith('p1', { from: 0, size: 50 }, 'ann')
    expect(dispatch.adminAddonLicenses.setLoading).toHaveBeenCalledWith(true)
    expect(dispatch.adminAddonLicenses.setCustomers).toHaveBeenCalledWith({
      customers: [holder('u1')],
      total: 7,
      hasMore: true,
    })
  })

  it('a refused list clears the spinner and leaves the rows alone', async () => {
    const dispatch = makeDispatch()
    graphQLAdminAddonCustomers.mockResolvedValueOnce('ERROR')
    await effectsFor(dispatch).fetch(undefined, stateWith({ productId: 'p1' }))
    expect(dispatch.adminAddonLicenses.setCustomers).not.toHaveBeenCalled()
    expect(dispatch.adminAddonLicenses.setLoading).toHaveBeenLastCalledWith(false)
  })

  it('fetchMore pages from the rows already held and appends', async () => {
    const dispatch = makeDispatch()
    const held = [holder('u1'), holder('u2')]
    graphQLAdminAddonCustomers.mockResolvedValueOnce(page([holder('u3')], 3, false))
    await effectsFor(dispatch).fetchMore(
      undefined,
      stateWith({ productId: 'p1', customers: held, hasMore: true, pageSize: 2 })
    )
    expect(graphQLAdminAddonCustomers).toHaveBeenCalledWith('p1', { from: 2, size: 2 }, undefined)
    expect(dispatch.adminAddonLicenses.appendCustomers).toHaveBeenCalledWith({
      customers: [holder('u3')],
      total: 3,
      hasMore: false,
    })
  })

  it('fetchMore does nothing at the end of the list or while a page is loading', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).fetchMore(undefined, stateWith({ productId: 'p1', hasMore: false }))
    await effectsFor(dispatch).fetchMore(undefined, stateWith({ productId: 'p1', hasMore: true, loading: true }))
    expect(graphQLAdminAddonCustomers).not.toHaveBeenCalled()
  })
})
