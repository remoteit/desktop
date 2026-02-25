import { createModel } from '@rematch/core'
import type { RootModel } from '.'
import { graphQLAdminUser,graphQLAdminUsers } from '../services/graphQLRequest'

interface AdminUser {
  id: string
  email: string
  created: string
  lastLogin?: string
  [key: string]: any
}

interface AdminUsersState {
  users: AdminUser[]
  total: number
  loading: boolean
  page: number
  pageSize: number
  searchValue: string
  searchType: 'all' | 'email' | 'userId'
  detailCache: { [userId: string]: AdminUser }
}

const initialState: AdminUsersState = {
  users: [],
  total: 0,
  loading: false,
  page: 1,
  pageSize: 50,
  searchValue: '',
  searchType: 'email',
  detailCache: {}
}

export const adminUsers = createModel<RootModel>()({
  name: 'adminUsers',
  state: initialState,
  reducers: {
    setUsers: (state, payload: { users: AdminUser[]; total: number }) => ({
      ...state,
      users: payload.users,
      total: payload.total,
      loading: false
    }),
    setLoading: (state, loading: boolean) => ({
      ...state,
      loading
    }),
    setPage: (state, page: number) => ({
      ...state,
      page
    }),
    setSearch: (state, payload: { searchValue: string; searchType: 'all' | 'email' | 'userId' }) => ({
      ...state,
      searchValue: payload.searchValue,
      searchType: payload.searchType,
      page: 1 // Reset to first page on new search
    }),
    cacheUserDetail: (state, payload: { userId: string; user: AdminUser }) => ({
      ...state,
      detailCache: {
        ...state.detailCache,
        [payload.userId]: payload.user
      }
    }),
    invalidateUserDetail: (state, userId: string) => {
      const newCache = { ...state.detailCache }
      delete newCache[userId]
      return {
        ...state,
        detailCache: newCache
      }
    },
    reset: () => initialState
  },
  effects: (dispatch) => ({
    async fetch(_: void, rootState) {
      const state = rootState.adminUsers
      dispatch.adminUsers.setLoading(true)

      // Build filters based on search type
      const filters: { search?: string; email?: string; accountId?: string } = {}
      const trimmedValue = state.searchValue.trim()

      if (trimmedValue) {
        switch (state.searchType) {
          case 'email':
            filters.email = trimmedValue
            break
          case 'userId':
            filters.accountId = trimmedValue
            break
          case 'all':
          default:
            filters.search = trimmedValue
            break
        }
      }

      const result = await graphQLAdminUsers(
        { from: (state.page - 1) * state.pageSize, size: state.pageSize },
        Object.keys(filters).length > 0 ? filters : undefined,
        'email'
      )

      if (result !== 'ERROR' && result?.data?.data?.admin?.users) {
        const data = result.data.data.admin.users
        const users = data.items || []
        dispatch.adminUsers.setUsers({
          users,
          total: data.total || 0
        })

        // Cache user details for users in the list
        users.forEach((user: AdminUser) => {
          dispatch.adminUsers.cacheUserDetail({ userId: user.id, user })
        })
      } else {
        dispatch.adminUsers.setLoading(false)
      }
    },
    async fetchIfEmpty(_: void, rootState) {
      if (rootState.adminUsers.users.length === 0) {
        await dispatch.adminUsers.fetch(undefined)
      }
    },
    async fetchUserDetail(userId: string, rootState) {
      // Check cache first
      const cached = rootState.adminUsers.detailCache[userId]
      if (cached) {
        return cached
      }

      // Fetch from API
      const result = await graphQLAdminUser(userId)
      if (result !== 'ERROR' && result?.data?.data?.admin?.users?.items?.[0]) {
        const user = result.data.data.admin.users.items[0]
        dispatch.adminUsers.cacheUserDetail({ userId, user })
        return user
      }
      return null
    }
  })
})
