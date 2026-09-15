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
    setSearch: (state, searchValue: string) => ({ ...state, searchValue }),
    reset: () => initialState,
  },
  effects: dispatch => ({
    async fetchProducts() {
      const result = await graphQLAdminAddonProducts()
      if (result === 'ERROR') return
      const products: AdminAddonProduct[] = result?.data?.data?.admin?.addonProducts || []
      dispatch.adminAddonLicenses.setProducts(products)
    },

    /* The page's selection. The list belongs to one product, so a new product fetches afresh;
       re-selecting the current one is a no-op (the URL effect fires on every render of the route). */
    async select(productId: string, rootState) {
      if (rootState.adminAddonLicenses.productId === productId) return
      dispatch.adminAddonLicenses.setProductId(productId)
      await dispatch.adminAddonLicenses.fetch()
    },

    async fetch(_: void, rootState) {
      const state = rootState.adminAddonLicenses
      if (!state.productId) return
      dispatch.adminAddonLicenses.setLoading(true)

      const result = await graphQLAdminAddonCustomers(
        state.productId,
        { from: 0, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

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
      dispatch.adminAddonLicenses.setLoading(true)

      const result = await graphQLAdminAddonCustomers(
        state.productId,
        { from: state.customers.length, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

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
  }),
})
