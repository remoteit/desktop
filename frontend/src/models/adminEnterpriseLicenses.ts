import { createModel } from '@rematch/core'
import { graphQLAdminEnterpriseCustomers } from '../services/graphQLRequest'
import type { RootModel } from '.'

export interface AdminEnterpriseCustomer {
  userId: string
  email: string
  name: string
  deviceCount: number
  memberCount: number
  licenseId: string
  created: string
}

interface AdminEnterpriseLicensesState {
  customers: AdminEnterpriseCustomer[]
  total: number
  hasMore: boolean
  loading: boolean
  page: number
  pageSize: number
  searchValue: string
}

const initialState: AdminEnterpriseLicensesState = {
  customers: [],
  total: 0,
  hasMore: false,
  loading: false,
  page: 1,
  pageSize: 50,
  searchValue: '',
}

export const adminEnterpriseLicenses = createModel<RootModel>()({
  name: 'adminEnterpriseLicenses',
  state: initialState,
  reducers: {
    setCustomers: (state, payload: { customers: AdminEnterpriseCustomer[]; total: number; hasMore: boolean }) => ({
      ...state,
      customers: payload.customers,
      total: payload.total,
      hasMore: payload.hasMore,
      loading: false,
    }),
    appendCustomers: (state, payload: { customers: AdminEnterpriseCustomer[]; total: number; hasMore: boolean }) => ({
      ...state,
      customers: [...state.customers, ...payload.customers],
      total: payload.total,
      hasMore: payload.hasMore,
      loading: false,
    }),
    setLoading: (state, loading: boolean) => ({
      ...state,
      loading,
    }),
    setSearch: (state, searchValue: string) => ({
      ...state,
      searchValue,
      page: 1,
    }),
    reset: () => initialState,
  },
  effects: dispatch => ({
    async fetch(_: void, rootState) {
      const state = rootState.adminEnterpriseLicenses
      dispatch.adminEnterpriseLicenses.setLoading(true)

      const result = await graphQLAdminEnterpriseCustomers(
        { from: 0, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

      if (result !== 'ERROR' && result?.data?.data?.admin?.enterpriseCustomers) {
        const data = result.data.data.admin.enterpriseCustomers
        dispatch.adminEnterpriseLicenses.setCustomers({
          customers: data.items || [],
          total: data.total || 0,
          hasMore: !!data.hasMore,
        })
      } else {
        dispatch.adminEnterpriseLicenses.setLoading(false)
      }
    },
    async fetchMore(_: void, rootState) {
      const state = rootState.adminEnterpriseLicenses
      if (!state.hasMore || state.loading) return

      dispatch.adminEnterpriseLicenses.setLoading(true)

      const result = await graphQLAdminEnterpriseCustomers(
        { from: state.customers.length, size: state.pageSize },
        state.searchValue.trim() || undefined
      )

      if (result !== 'ERROR' && result?.data?.data?.admin?.enterpriseCustomers) {
        const data = result.data.data.admin.enterpriseCustomers
        dispatch.adminEnterpriseLicenses.appendCustomers({
          customers: data.items || [],
          total: data.total || 0,
          hasMore: !!data.hasMore,
        })
      } else {
        dispatch.adminEnterpriseLicenses.setLoading(false)
      }
    },
    async fetchIfEmpty(_: void, rootState) {
      if (rootState.adminEnterpriseLicenses.customers.length === 0) {
        await dispatch.adminEnterpriseLicenses.fetch()
      }
    },
  }),
})
