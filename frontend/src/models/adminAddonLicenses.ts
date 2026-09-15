import { createModel } from '@rematch/core'
import { graphQLAdminAddonCustomers, graphQLAdminAddonProducts } from '../services/graphQLRequest'
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

interface AdminAddonLicensesState {
  products: AdminAddonProduct[]
  productsLoaded: boolean
  productId?: string
  customers: AdminAddonCustomer[]
  total: number
  hasMore: boolean
  loading: boolean
  pageSize: number
  searchValue: string
}

const initialState: AdminAddonLicensesState = {
  products: [],
  productsLoaded: false,
  productId: undefined,
  customers: [],
  total: 0,
  hasMore: false,
  loading: false,
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
let listRequest = 0
let productsRequest = 0

export const adminAddonLicenses = createModel<RootModel>()({
  name: 'adminAddonLicenses',
  state: initialState,
  reducers: {
    setProducts: (state, products: AdminAddonProduct[]) => ({ ...state, products, productsLoaded: true }),
    // Switching product empties the list: the rows on screen belong to the old one.
    setProductId: (state, productId?: string) =>
      productId === state.productId ? state : { ...state, productId, customers: [], total: 0, hasMore: false },
    setCustomers: (state, payload: Page) => ({
      ...state,
      customers: payload.customers,
      total: payload.total,
      hasMore: payload.hasMore,
      loading: false,
    }),
    appendCustomers: (state, payload: Page) => ({
      ...state,
      customers: [...state.customers, ...payload.customers],
      total: payload.total,
      hasMore: payload.hasMore,
      loading: false,
    }),
    setLoading: (state, loading: boolean) => ({ ...state, loading }),
    setSearchValue: (state, searchValue: string) => ({ ...state, searchValue }),
    resetState: () => initialState,
  },
  effects: dispatch => ({
    async fetchProducts() {
      const ticket = ++productsRequest
      const result = await graphQLAdminAddonProducts()
      if (ticket !== productsRequest || result === 'ERROR') return
      // No response at all (offline, no auth header yet) is not an empty list: the products already
      // held stay, and the page is not told there are none. Only an answer marks the list loaded.
      const products: AdminAddonProduct[] | undefined = result?.data?.data?.admin?.addonProducts
      if (!Array.isArray(products)) return
      dispatch.adminAddonLicenses.setProducts(products)
    },

    /* The page's selection. The list belongs to one product, so a new product fetches afresh —
       and its request's ticket retires whatever the old product still had in flight. Re-selecting
       the current one is a no-op (the URL effect fires on every render of the route). */
    async select(productId: string, rootState) {
      if (rootState.adminAddonLicenses.productId === productId) return
      dispatch.adminAddonLicenses.setProductId(productId)
      await dispatch.adminAddonLicenses.fetch()
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
      const ticket = ++listRequest
      dispatch.adminAddonLicenses.setLoading(true)

      const result = await graphQLAdminAddonCustomers(
        state.productId,
        { from: 0, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

      // Superseded: a newer request, or an event that retired this one, owns the list (and the
      // spinner) now — this response describes a list nobody is looking at.
      if (ticket !== listRequest) return

      if (result !== 'ERROR' && result?.data?.data?.admin?.addonCustomers) {
        const data = result.data.data.admin.addonCustomers
        dispatch.adminAddonLicenses.setCustomers({
          customers: data.items || [],
          total: data.total || 0,
          hasMore: !!data.hasMore,
        })
      } else {
        dispatch.adminAddonLicenses.setLoading(false)
      }
    },

    async fetchMore(_: void, rootState) {
      const state = rootState.adminAddonLicenses
      if (!state.productId || !state.hasMore || state.loading) return
      const ticket = ++listRequest
      dispatch.adminAddonLicenses.setLoading(true)

      const result = await graphQLAdminAddonCustomers(
        state.productId,
        { from: state.customers.length, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

      if (ticket !== listRequest) return

      if (result !== 'ERROR' && result?.data?.data?.admin?.addonCustomers) {
        const data = result.data.data.admin.addonCustomers
        dispatch.adminAddonLicenses.appendCustomers({
          customers: data.items || [],
          total: data.total || 0,
          hasMore: !!data.hasMore,
        })
      } else {
        dispatch.adminAddonLicenses.setLoading(false)
      }
    },

    // Sign-out: nothing in flight may land in the next session's state.
    async reset() {
      ++listRequest
      ++productsRequest
      dispatch.adminAddonLicenses.resetState()
    },
  }),
})
