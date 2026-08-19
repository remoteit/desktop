import { createModel } from '@rematch/core'
import type { RootModel } from '.'
import { graphQLAdminDevice, graphQLAdminDevices } from '../services/graphQLRequest'

export interface AdminDevice {
  id: string
  name?: string
  state?: string
  created?: string
  owner?: {
    id?: string
    email?: string
  }
  [key: string]: any
}

// 'name' is an index-fast prefix match, 'contains' is the full substring search (slower,
// server scans every device name), 'deviceId' matches device/hardware address exact or
// prefix, 'email' scopes to an owner, 'all' lets the server route the term.
export type AdminDeviceSearchType = 'all' | 'name' | 'contains' | 'deviceId' | 'email'

interface AdminDevicesState {
  devices: AdminDevice[]
  total: number
  hasMore: boolean
  loading: boolean
  page: number
  pageSize: number
  searchValue: string
  searchType: AdminDeviceSearchType
  detailCache: { [deviceId: string]: AdminDevice }
}

const initialState: AdminDevicesState = {
  devices: [],
  total: 0,
  hasMore: false,
  loading: false,
  page: 1,
  pageSize: 50,
  searchValue: '',
  searchType: 'name',
  detailCache: {},
}

function searchFilters(searchValue: string, searchType: AdminDeviceSearchType) {
  const trimmed = searchValue.trim()
  if (!trimmed) return undefined

  switch (searchType) {
    case 'name':
      return { name: trimmed }
    case 'contains':
      return { nameContains: trimmed }
    case 'deviceId':
      return { deviceId: trimmed }
    case 'email':
      return { email: trimmed }
    case 'all':
    default:
      return { search: trimmed }
  }
}

export const adminDevices = createModel<RootModel>()({
  name: 'adminDevices',
  state: initialState,
  reducers: {
    setDevices: (state, payload: { devices: AdminDevice[]; total: number; hasMore: boolean }) => ({
      ...state,
      devices: payload.devices,
      total: payload.total,
      hasMore: payload.hasMore,
      loading: false,
    }),
    appendDevices: (state, payload: { devices: AdminDevice[]; total: number; hasMore: boolean }) => ({
      ...state,
      devices: [...state.devices, ...payload.devices],
      total: payload.total,
      hasMore: payload.hasMore,
      loading: false,
    }),
    setLoading: (state, loading: boolean) => ({
      ...state,
      loading,
    }),
    setPage: (state, page: number) => ({
      ...state,
      page,
    }),
    setSearch: (state, payload: { searchValue: string; searchType: AdminDeviceSearchType }) => ({
      ...state,
      searchValue: payload.searchValue,
      searchType: payload.searchType,
      page: 1, // Reset to first page on new search
    }),
    cacheDeviceDetail: (state, payload: { deviceId: string; device: AdminDevice }) => {
      // Merge so the sparse list row (name/state/owner) doesn't clobber detail-only fields
      // already cached (services, endpoint, access, ...).
      const existing = state.detailCache[payload.deviceId]
      return {
        ...state,
        detailCache: {
          ...state.detailCache,
          [payload.deviceId]: existing ? { ...existing, ...payload.device } : payload.device,
        },
      }
    },
    reset: () => initialState,
  },
  effects: dispatch => ({
    async fetch(_: void, rootState) {
      const state = rootState.adminDevices
      dispatch.adminDevices.setLoading(true)

      const result = await graphQLAdminDevices(
        { from: (state.page - 1) * state.pageSize, size: state.pageSize },
        searchFilters(state.searchValue, state.searchType),
        'name'
      )

      if (result !== 'ERROR' && result?.data?.data?.admin?.devices) {
        const data = result.data.data.admin.devices
        dispatch.adminDevices.setDevices({
          devices: data.items || [],
          total: data.total || 0,
          hasMore: !!data.hasMore,
        })
      } else {
        dispatch.adminDevices.setLoading(false)
      }
    },
    async fetchMore(_: void, rootState) {
      const state = rootState.adminDevices
      if (!state.hasMore || state.loading) return

      dispatch.adminDevices.setLoading(true)

      const result = await graphQLAdminDevices(
        { from: state.devices.length, size: state.pageSize },
        searchFilters(state.searchValue, state.searchType),
        'name'
      )

      if (result !== 'ERROR' && result?.data?.data?.admin?.devices) {
        const data = result.data.data.admin.devices
        dispatch.adminDevices.appendDevices({
          devices: data.items || [],
          total: data.total || 0,
          hasMore: !!data.hasMore,
        })
      } else {
        dispatch.adminDevices.setLoading(false)
      }
    },
    async fetchIfEmpty(_: void, rootState) {
      if (rootState.adminDevices.devices.length === 0) {
        await dispatch.adminDevices.fetch(undefined)
      }
    },
    async fetchDeviceDetail(payload: string | { deviceId: string; force?: boolean }, rootState) {
      const { deviceId, force } = typeof payload === 'string' ? { deviceId: payload, force: false } : payload

      // Serve from cache unless a forced refresh is requested; on force we keep the existing
      // entry visible and overwrite it when fresh data lands (cacheDeviceDetail merges).
      const cached = rootState.adminDevices.detailCache[deviceId]
      if (cached?.services && !force) return cached

      const result = await graphQLAdminDevice(deviceId)
      const device = result !== 'ERROR' ? result?.data?.data?.admin?.devices?.items?.[0] : undefined

      if (device) {
        dispatch.adminDevices.cacheDeviceDetail({ deviceId, device })
        return device
      }
      return cached || null
    },
  }),
})
