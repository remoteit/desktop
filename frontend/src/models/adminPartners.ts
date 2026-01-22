import { createModel } from '@rematch/core'
import { graphQLAdminPartners, graphQLAdminPartner } from '../services/graphQLRequest'
import type { RootModel } from '.'

interface AdminPartner {
  id: string
  name: string
  deviceCount: number
  online: number
  active: number
  activated: number
  updated: string
  [key: string]: any
}

interface AdminPartnersState {
  partners: AdminPartner[]
  loading: boolean
  searchValue: string
  detailCache: { [partnerId: string]: AdminPartner }
}

const initialState: AdminPartnersState = {
  partners: [],
  loading: false,
  searchValue: '',
  detailCache: {}
}

export const adminPartners = createModel<RootModel>()({
  name: 'adminPartners',
  state: initialState,
  reducers: {
    setPartners: (state, partners: AdminPartner[]) => ({
      ...state,
      partners,
      loading: false
    }),
    setLoading: (state, loading: boolean) => ({
      ...state,
      loading
    }),
    setSearchValue: (state, searchValue: string) => ({
      ...state,
      searchValue
    }),
    cachePartnerDetail: (state, payload: { partnerId: string; partner: AdminPartner }) => ({
      ...state,
      detailCache: {
        ...state.detailCache,
        [payload.partnerId]: payload.partner
      }
    }),
    invalidatePartnerDetail: (state, partnerId: string) => {
      const newCache = { ...state.detailCache }
      delete newCache[partnerId]
      return {
        ...state,
        detailCache: newCache
      }
    },
    reset: () => initialState
  },
  effects: (dispatch) => ({
    async fetch() {
      dispatch.adminPartners.setLoading(true)

      const result = await graphQLAdminPartners()

      if (result !== 'ERROR' && result?.data?.data?.admin?.partners) {
        const partners = result.data.data.admin.partners
        dispatch.adminPartners.setPartners(partners)
        
        // Cache all partner details
        partners.forEach((partner: AdminPartner) => {
          dispatch.adminPartners.cachePartnerDetail({ partnerId: partner.id, partner })
        })
      } else {
        dispatch.adminPartners.setLoading(false)
      }
    },
    async fetchIfEmpty(_payload, rootState) {
      if (rootState.adminPartners.partners.length === 0) {
        await dispatch.adminPartners.fetch()
      }
    },
    async fetchPartnerDetail(partnerId: string, rootState) {
      // Check cache first
      const cached = rootState.adminPartners.detailCache[partnerId]
      if (cached) {
        return cached
      }

      // Fetch from API
      const result = await graphQLAdminPartner(partnerId)
      if (result !== 'ERROR' && result?.data?.data?.admin?.partners?.[0]) {
        const partner = result.data.data.admin.partners[0]
        dispatch.adminPartners.cachePartnerDetail({ partnerId, partner })
        return partner
      }
      return null
    }
  })
})
