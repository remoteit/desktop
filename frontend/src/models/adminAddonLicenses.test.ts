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
// refresh dispatches fetchProducts and fetch through the model; the fake routes those to the
// real effects so a refresh test exercises the whole way in.
const withRealEffects = (dispatch: any, state: Record<string, unknown> = {}) => {
  const effects = effectsFor(dispatch)
  dispatch.adminAddonLicenses.fetchProducts = () => effects.fetchProducts()
  dispatch.adminAddonLicenses.fetch = vi.fn(() => effects.fetch(undefined, stateWith(state)))
  return effects
}
const catalogue = (...ids: string[]) => ({
  data: { data: { admin: { addonProducts: ids.map(id => ({ id, name: id, enabled: true })) } } },
})
const makeDispatch = () => ({
  adminAddonLicenses: {
    setProducts: vi.fn(),
    setProductId: vi.fn(),
    setCustomers: vi.fn(),
    appendCustomers: vi.fn(),
    setProductsStatus: vi.fn(),
    setListStatus: vi.fn(),
    setSearchValue: vi.fn(),
    resetState: vi.fn(),
    fetch: vi.fn(),
  },
})
// A request the test resolves by hand, to interleave events with a page in flight.
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}
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
    expect(model.reducers.setProducts(model.state, [])).toMatchObject({ products: [], productsStatus: 'loaded' })
  })

  it('a new product resets the list to never-asked, so the page shows loading rather than empty', () => {
    const before = { ...model.state, productId: 'a', listStatus: 'loaded' }
    expect(model.reducers.setProductId(before, 'b')).toMatchObject({ listStatus: 'idle', customers: [] })
  })
})

describe('adminAddonLicenses effects', () => {
  it('fetchProducts stores what the API lists and resolves to it', async () => {
    const dispatch = makeDispatch()
    const products = [{ id: 'p1', name: 'ai-agent', description: 'AI Agent', enabled: true }]
    graphQLAdminAddonProducts.mockResolvedValueOnce({ data: { data: { admin: { addonProducts: products } } } })
    await expect(effectsFor(dispatch).fetchProducts()).resolves.toEqual(products)
    expect(dispatch.adminAddonLicenses.setProductsStatus).toHaveBeenCalledWith('loading')
    expect(dispatch.adminAddonLicenses.setProducts).toHaveBeenCalledWith(products)
  })

  it('a refused or missing response (offline, no auth yet) is not an empty product list — the list held stays, marked failed', async () => {
    const dispatch = makeDispatch()
    for (const answer of ['ERROR', undefined, { data: { data: { admin: {} } } }]) {
      graphQLAdminAddonProducts.mockResolvedValueOnce(answer)
      await expect(effectsFor(dispatch).fetchProducts()).resolves.toBeUndefined()
    }
    expect(dispatch.adminAddonLicenses.setProducts).not.toHaveBeenCalled()
    expect(
      dispatch.adminAddonLicenses.setProductsStatus.mock.calls.filter((call: unknown[]) => call[0] === 'failed')
    ).toHaveLength(3)
  })

  it("refresh takes the URL's product when the catalogue lists it, and fetches its list afresh", async () => {
    const dispatch = makeDispatch()
    const effects = withRealEffects(dispatch, { productId: 'B' })
    graphQLAdminAddonProducts.mockResolvedValueOnce(catalogue('A', 'B'))
    graphQLAdminAddonCustomers.mockResolvedValueOnce(page([holder('b1')], 1, false))
    await effects.refresh('B', stateWith({ productId: 'A', customers: [holder('a1')] }))
    expect(dispatch.adminAddonLicenses.setProductId).toHaveBeenCalledWith('B')
    expect(dispatch.adminAddonLicenses.fetch).toHaveBeenCalledTimes(1)
    expect(graphQLAdminAddonCustomers).toHaveBeenCalledWith('B', { from: 0, size: 50 }, undefined)
  })

  it('refresh keeps the product held when the URL names none, and refetches even a loaded list (another API target may have filled it)', async () => {
    const dispatch = makeDispatch()
    const effects = withRealEffects(dispatch, { productId: 'A' })
    graphQLAdminAddonProducts.mockResolvedValueOnce(catalogue('A'))
    graphQLAdminAddonCustomers.mockResolvedValueOnce(page([], 0, false))
    await effects.refresh(undefined, stateWith({ productId: 'A', customers: [holder('stale')], listStatus: 'loaded' }))
    expect(dispatch.adminAddonLicenses.setProductId).toHaveBeenCalledWith('A')
    expect(dispatch.adminAddonLicenses.fetch).toHaveBeenCalledTimes(1)
  })

  it('refresh clears a selection the catalogue no longer lists and asks for no list — the page picks a product that exists', async () => {
    const dispatch = makeDispatch()
    const effects = withRealEffects(dispatch, { productId: 'gone' })
    graphQLAdminAddonProducts.mockResolvedValueOnce(catalogue('A'))
    await effects.refresh('gone', stateWith({ productId: 'gone' }))
    expect(dispatch.adminAddonLicenses.setProductId).toHaveBeenCalledWith(undefined)
    expect(dispatch.adminAddonLicenses.fetch).not.toHaveBeenCalled()
    expect(graphQLAdminAddonCustomers).not.toHaveBeenCalled()
  })

  it('refresh touches neither the selection nor the list when the catalogue did not answer', async () => {
    const dispatch = makeDispatch()
    const effects = withRealEffects(dispatch, { productId: 'A' })
    graphQLAdminAddonProducts.mockResolvedValueOnce(undefined)
    await effects.refresh('A', stateWith({ productId: 'A' }))
    expect(dispatch.adminAddonLicenses.setProductId).not.toHaveBeenCalled()
    expect(dispatch.adminAddonLicenses.fetch).not.toHaveBeenCalled()
  })

  it('fetch asks for the selected product with the committed search, and never without a product', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).fetch(undefined, stateWith({ productId: undefined }))
    expect(graphQLAdminAddonCustomers).not.toHaveBeenCalled()

    graphQLAdminAddonCustomers.mockResolvedValueOnce(page([holder('u1')], 7, true))
    await effectsFor(dispatch).fetch(undefined, stateWith({ productId: 'p1', pageSize: 50, searchValue: '  ann  ' }))
    expect(graphQLAdminAddonCustomers).toHaveBeenCalledWith('p1', { from: 0, size: 50 }, 'ann')
    expect(dispatch.adminAddonLicenses.setListStatus).toHaveBeenCalledWith('loading')
    expect(dispatch.adminAddonLicenses.setCustomers).toHaveBeenCalledWith({
      customers: [holder('u1')],
      total: 7,
      hasMore: true,
    })
  })

  it('a refused or missing list marks the list failed and leaves the rows alone', async () => {
    const dispatch = makeDispatch()
    for (const answer of ['ERROR', undefined]) {
      graphQLAdminAddonCustomers.mockResolvedValueOnce(answer)
      await effectsFor(dispatch).fetch(undefined, stateWith({ productId: 'p1' }))
      expect(dispatch.adminAddonLicenses.setListStatus).toHaveBeenLastCalledWith('failed')
    }
    expect(dispatch.adminAddonLicenses.setCustomers).not.toHaveBeenCalled()
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
    await effectsFor(dispatch).fetchMore(
      undefined,
      stateWith({ productId: 'p1', hasMore: true, listStatus: 'loading' })
    )
    expect(graphQLAdminAddonCustomers).not.toHaveBeenCalled()
  })

  it('setSearch commits the term and refetches for it', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).setSearch('ann')
    expect(dispatch.adminAddonLicenses.setSearchValue).toHaveBeenCalledWith('ann')
    expect(dispatch.adminAddonLicenses.fetch).toHaveBeenCalledTimes(1)
  })

  it('reset clears the state', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).reset()
    expect(dispatch.adminAddonLicenses.resetState).toHaveBeenCalledTimes(1)
  })
})

/* The races: a page that lands after the list it was fetched for has been superseded — by a
   newer request, a product switch, a new search term or sign-out — must not be written. */
describe('adminAddonLicenses stale responses', () => {
  it("a product switch retires the old product's page: it never lands under the new product", async () => {
    const dispatch = makeDispatch()
    const effects = effectsFor(dispatch)
    const a = deferred<unknown>()
    const b = deferred<unknown>()
    graphQLAdminAddonCustomers.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)

    const forA = effects.fetch(undefined, stateWith({ productId: 'A' }))
    const forB = effects.fetch(undefined, stateWith({ productId: 'B' })) // what refresh(B) issues
    b.resolve(page([holder('b1')], 1, false))
    a.resolve(page([holder('a1')], 1, false)) // A's answer arrives last
    await Promise.all([forA, forB])

    expect(dispatch.adminAddonLicenses.setCustomers).toHaveBeenCalledTimes(1)
    expect(dispatch.adminAddonLicenses.setCustomers).toHaveBeenCalledWith({
      customers: [holder('b1')],
      total: 1,
      hasMore: false,
    })
  })

  it('a refresh that lands under a Load More retires it: the paged rows are not appended to the new list', async () => {
    const dispatch = makeDispatch()
    const effects = effectsFor(dispatch)
    const more = deferred<unknown>()
    const fresh = deferred<unknown>()
    graphQLAdminAddonCustomers.mockReturnValueOnce(more.promise).mockReturnValueOnce(fresh.promise)

    const paging = effects.fetchMore(undefined, stateWith({ productId: 'A', customers: [holder('a1')], hasMore: true }))
    const refreshing = effects.fetch(undefined, stateWith({ productId: 'A', customers: [holder('a1')] }))
    fresh.resolve(page([holder('a1')], 1, false))
    more.resolve(page([holder('a2')], 2, false))
    await Promise.all([paging, refreshing])

    expect(dispatch.adminAddonLicenses.setCustomers).toHaveBeenCalledTimes(1)
    expect(dispatch.adminAddonLicenses.appendCustomers).not.toHaveBeenCalled()
  })

  it("a superseded request leaves the list's status to the request that owns it", async () => {
    const dispatch = makeDispatch()
    const effects = effectsFor(dispatch)
    const first = deferred<unknown>()
    graphQLAdminAddonCustomers.mockReturnValueOnce(first.promise).mockResolvedValueOnce(page([], 0, false))

    const stale = effects.fetch(undefined, stateWith({ productId: 'A' }))
    await effects.fetch(undefined, stateWith({ productId: 'A' }))
    dispatch.adminAddonLicenses.setListStatus.mockClear()
    first.resolve('ERROR') // a refused stale request must not mark the newer one's list failed either
    await stale

    expect(dispatch.adminAddonLicenses.setListStatus).not.toHaveBeenCalled()
  })

  it('sign-out retires every request in flight, the product list included', async () => {
    const dispatch = makeDispatch()
    const effects = effectsFor(dispatch)
    const list = deferred<unknown>()
    const products = deferred<unknown>()
    graphQLAdminAddonCustomers.mockReturnValueOnce(list.promise)
    graphQLAdminAddonProducts.mockReturnValueOnce(products.promise)

    const listing = effects.fetch(undefined, stateWith({ productId: 'A' }))
    const loadingProducts = effects.fetchProducts()
    await effects.reset()
    list.resolve(page([holder('a1')], 1, false))
    products.resolve({ data: { data: { admin: { addonProducts: [{ id: 'A', name: 'a', enabled: true }] } } } })
    await Promise.all([listing, loadingProducts])

    expect(dispatch.adminAddonLicenses.setCustomers).not.toHaveBeenCalled()
    expect(dispatch.adminAddonLicenses.setProducts).not.toHaveBeenCalled()
  })
})
