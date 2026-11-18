import { createModel } from '@rematch/core'
import { latestWins } from '../helpers/latestWins'
import { graphQLAdminAddonCustomers, graphQLAdminAddonProducts } from '../services/graphQLRequest'
import { getApiURL } from '../helpers/apiHelper'
import type { RootModel } from '.'

/* Admin grants of ADD-ON licences (graphql-api docs/AI-AGENT-LICENSE.md) — generic over add-on
   products, of which ai-agent is the first. An add-on product has one entitled plan and no default
   plan: holding the licence row IS the entitlement, so the list is every holder and the two
   actions are grant / revoke. Same shape as adminEnterpriseLicenses plus the product the page is
   looking at; a future add-on is a product row on the API and nothing here. */

export interface AdminAddonProduct {
  id: string
  name: string
  description?: string | null
  /* The kill switch: a disabled add-on still lists (and lets an admin revoke) its residual
     grants, but the API refuses new ones. */
  enabled: boolean
}

export interface AdminAddonCustomer {
  productId: string
  userId: string
  email: string
  name: string
  deviceCount: number
  memberCount: number
  licenseId: string
  created: string
  /* Set when the grant is time-boxed; the licence stops counting the moment it passes. */
  expiration?: string | null
}

/* Where a request stands, kept apart from what it last delivered. `idle` = never asked; `failed` =
   the last ask got no usable answer (offline, no auth header yet, a refused query) — whatever was
   delivered before is kept, so the page decides what to show from the status AND the rows, never
   from an empty array alone: "empty because nobody holds it" and "empty because nothing has
   answered yet" are different screens. */
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'failed'

interface AdminAddonLicensesState {
  products: AdminAddonProduct[]
  productsStatus: LoadStatus
  productId?: string
  /* The API target (graphql URL) the rows were fetched from. Part of the list's identity with the
     product: Test Settings switches the target without a reload, a product id is the same on every
     stage, and rows from the other stage must not sit on screen — interactive — behind the same id. */
  target?: string
  customers: AdminAddonCustomer[]
  total: number
  hasMore: boolean
  listStatus: LoadStatus
  pageSize: number
  searchValue: string
}

const initialState: AdminAddonLicensesState = {
  products: [],
  productsStatus: 'idle',
  productId: undefined,
  target: undefined,
  customers: [],
  total: 0,
  hasMore: false,
  listStatus: 'idle',
  pageSize: 50,
  searchValue: '',
}

type Page = { customers: AdminAddonCustomer[]; total: number; hasMore: boolean }

/* Latest-wins tickets. Every request takes one before its await and writes only if it is still
   the newest when the response lands; every event that makes an in-flight page meaningless — a
   product switch, a new search, sign-out — and every newer request takes the next number. One
   ticket covers the whole list, first page and Load More alike, because they invalidate each
   other: a refresh that lands under a Load More would otherwise be appended to by rows paged off
   the list it replaced. (Comparing the response's product and search to the store at resolve time
   would let exactly that through — they still match.) The product list has its own, invalidated
   only by sign-out: it is not scoped to a selection, and two of its responses say the same thing. */
const listRequest = latestWins()
const productsRequest = latestWins()

const emptiedList = { customers: [], total: 0, hasMore: false, listStatus: 'idle' as const }

export const adminAddonLicenses = createModel<RootModel>()({
  name: 'adminAddonLicenses',
  state: initialState,
  reducers: {
    setProductsStatus: (state, productsStatus: LoadStatus) => ({ ...state, productsStatus }),
    setProducts: (state, products: AdminAddonProduct[]) => ({ ...state, products, productsStatus: 'loaded' as const }),
    // Switching product or target empties the list: the rows on screen belong to the old one.
    setProductId: (state, productId?: string) =>
      productId === state.productId ? state : { ...state, productId, ...emptiedList },
    setTarget: (state, target?: string) => (target === state.target ? state : { ...state, target, ...emptiedList }),
    setListStatus: (state, listStatus: LoadStatus) => ({ ...state, listStatus }),
    setCustomers: (state, payload: Page) => ({
      ...state,
      customers: payload.customers,
      total: payload.total,
      hasMore: payload.hasMore,
      listStatus: 'loaded' as const,
    }),
    appendCustomers: (state, payload: Page) => ({
      ...state,
      customers: [...state.customers, ...payload.customers],
      total: payload.total,
      hasMore: payload.hasMore,
      listStatus: 'loaded' as const,
    }),
    setSearchValue: (state, searchValue: string) => ({ ...state, searchValue }),
    resetState: () => initialState,
  },
  effects: dispatch => {
    // One page of the current product's customers: `from` 0 replaces the list, anything else appends.
    const loadPage = async (state: AdminAddonLicensesState, from: number) => {
      const isLatest = listRequest.take()
      dispatch.adminAddonLicenses.setListStatus('loading')

      const result = await graphQLAdminAddonCustomers(
        state.productId!,
        { from, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

      // Superseded: a newer request, or an event that retired this one, owns the list (and its
      // status) now — this response describes a list nobody is looking at.
      if (!isLatest()) return

      const data = result === 'ERROR' ? undefined : result?.data?.data?.admin?.addonCustomers
      if (!data) {
        // On a later page the rows held stay; the page keeps its Load More for another try.
        dispatch.adminAddonLicenses.setListStatus('failed')
        return
      }
      const page = { customers: data.items || [], total: data.total || 0, hasMore: !!data.hasMore }
      if (from) dispatch.adminAddonLicenses.appendCustomers(page)
      else dispatch.adminAddonLicenses.setCustomers(page)
    }

    return {
      /* The product catalogue. Resolves to the fresh list, or undefined when nothing answered — the
       products held stay, marked failed. */
      async fetchProducts(): Promise<AdminAddonProduct[] | undefined> {
        const isLatest = productsRequest.take()
        dispatch.adminAddonLicenses.setProductsStatus('loading')
        const result = await graphQLAdminAddonProducts()
        if (!isLatest()) return undefined

        // No response at all (offline, no auth header yet) is not an empty list.
        const products: AdminAddonProduct[] | undefined =
          result === 'ERROR' ? undefined : result?.data?.data?.admin?.addonProducts
        if (!Array.isArray(products)) {
          dispatch.adminAddonLicenses.setProductsStatus('failed')
          return undefined
        }

        dispatch.adminAddonLicenses.setProducts(products)
        return products
      },

      /* The ONE way in — the page on mount and on every move of the URL's product, and the refresh
       button: the catalogue first, then the selection checked against it (the URL's product when it
       names one that exists, else the one held if it still exists, else none — a product the API
       no longer lists cannot stay selected, or every list request for it is refused; clearing it
       hands the choice back to the page, which redirects to one that exists), then that product's
       list, fetched AFRESH. Always afresh: the page can remount over rows from another API target
       (Test Settings switches the stage without reloading, and cloudSync.all() knows nothing of
       this model), and a product id is the same on every stage — so the target is checked FIRST,
       before anything is awaited: rows from another target leave the screen at once rather than
       staying interactive until (or beyond, if it fails) the new answer. A switch's request retires
       whatever the old product still had in flight (the tickets above). */
      async refresh(preferredProductId: string | undefined, rootState) {
        const target = getApiURL()
        // A page still in flight from the other target is retired with its rows — it would otherwise
        // pass the ticket check and refill the emptied list while the catalogue is awaited.
        if (target !== rootState.adminAddonLicenses.target) listRequest.invalidate()
        dispatch.adminAddonLicenses.setTarget(target)
        const products = await dispatch.adminAddonLicenses.fetchProducts()
        if (!products) return

        // The selection: the URL's product when the catalogue lists it, else the one held, else the
        // first add-on — chosen HERE so one refresh both selects and loads; the page then aligns the
        // URL to the choice rather than asking for the catalogue a second time.
        const held = rootState.adminAddonLicenses.productId
        const listed = (id?: string) => !!id && products.some(p => p.id === id)
        const productId = listed(preferredProductId) ? preferredProductId : listed(held) ? held : products[0]?.id
        dispatch.adminAddonLicenses.setProductId(productId)
        if (productId) await dispatch.adminAddonLicenses.fetch()
      },

      /* A committed search term: the list is refetched for it, which retires the page in flight for
       the old term. */
      async setSearch(searchValue: string) {
        dispatch.adminAddonLicenses.setSearchValue(searchValue)
        await dispatch.adminAddonLicenses.fetch()
      },

      async fetch(_: void, rootState) {
        const state = rootState.adminAddonLicenses
        if (!state.productId) return
        await loadPage(state, 0)
      },

      async fetchMore(_: void, rootState) {
        const state = rootState.adminAddonLicenses
        if (!state.productId || !state.hasMore || state.listStatus === 'loading') return
        await loadPage(state, state.customers.length)
      },

      // Sign-out: nothing in flight may land in the next session's state.
      async reset() {
        listRequest.invalidate()
        productsRequest.invalidate()
        dispatch.adminAddonLicenses.resetState()
      },
    }
  },
})
