import { createModel } from '@rematch/core'
import { RootModel } from '.'
import {
  graphQLDeviceProducts,
  graphQLCreateDeviceProduct,
  graphQLDeleteDeviceProduct,
  graphQLUpdateDeviceProductSettings,
  graphQLAddDeviceProductService,
  graphQLRemoveDeviceProductService,
} from '../services/graphQLDeviceProducts'
import { graphQLGetErrors } from '../services/graphQL'

export interface IProductService {
  id: string
  name: string
  type: { id: number; name: string } | null
  port: number
  enabled: boolean
  platformCode: string
}

export interface IDeviceProduct {
  id: string
  name: string
  platform: string
  scope: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  status: 'NEW' | 'LOCKED'
  hidden: boolean
  created: string
  updated: string
  services: IProductService[]
}

type ProductsState = {
  initialized: boolean
  fetching: boolean
  all: IDeviceProduct[]
  selected: string[]
  showHidden: boolean
}

const defaultState: ProductsState = {
  initialized: false,
  fetching: false,
  all: [],
  selected: [],
  showHidden: false,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_: void, state) {
      dispatch.products.set({ fetching: true })
      const response = await graphQLDeviceProducts({ includeHidden: true })
      if (!graphQLGetErrors(response)) {
        const products = response?.data?.data?.deviceProducts?.items || []
        console.log('LOADED PRODUCTS', products)
        dispatch.products.set({ all: products, initialized: true })
      }
      dispatch.products.set({ fetching: false })
    },

    async fetchIfEmpty(_: void, state) {
      if (!state.products.initialized) {
        await dispatch.products.fetch()
      }
    },

    async create(input: { name: string; platform: string }, state) {
      const response = await graphQLCreateDeviceProduct(input)
      if (!graphQLGetErrors(response)) {
        const newProduct = response?.data?.data?.createDeviceProduct
        if (newProduct) {
          dispatch.products.set({
            all: [...state.products.all, newProduct],
          })
          return newProduct
        }
      }
      return null
    },

    async delete(id: string, state) {
      const response = await graphQLDeleteDeviceProduct(id)
      if (!graphQLGetErrors(response)) {
        dispatch.products.set({
          all: state.products.all.filter(p => p.id !== id),
          selected: state.products.selected.filter(s => s !== id),
        })
      }
      return !graphQLGetErrors(response)
    },

    async deleteSelected(_: void, state) {
      const { selected, all } = state.products
      if (!selected.length) return

      const results = await Promise.all(
        selected.map(id => graphQLDeleteDeviceProduct(id))
      )

      const successIds = selected.filter((id, i) => !graphQLGetErrors(results[i]))
      
      dispatch.products.set({
        all: all.filter(p => !successIds.includes(p.id)),
        selected: [],
      })
    },

    select(id: string, state) {
      const { selected } = state.products
      if (selected.includes(id)) {
        dispatch.products.set({ selected: selected.filter(s => s !== id) })
      } else {
        dispatch.products.set({ selected: [...selected, id] })
      }
    },

    selectAll(checked: boolean, state) {
      const { all, showHidden } = state.products
      const visibleProducts = showHidden ? all : all.filter(p => !p.hidden)
      dispatch.products.set({
        selected: checked ? visibleProducts.map(p => p.id) : [],
      })
    },

    clearSelection() {
      dispatch.products.set({ selected: [] })
    },

    toggleShowHidden(_: void, state) {
      dispatch.products.set({
        showHidden: !state.products.showHidden,
        selected: [],
      })
    },

    async updateSettings({ id, input }: { id: string; input: { lock?: boolean; hidden?: boolean } }, state) {
      const response = await graphQLUpdateDeviceProductSettings(id, input)
      if (!graphQLGetErrors(response)) {
        const updatedProduct = response?.data?.data?.updateDeviceProductSettings
        if (updatedProduct) {
          dispatch.products.set({
            all: state.products.all.map(p => (p.id === id ? updatedProduct : p)),
          })
        }
        return updatedProduct
      }
      return null
    },

    async addService(
      { productId, input }: { productId: string; input: { name: string; type: string; port: number; enabled: boolean } },
      state
    ) {
      const response = await graphQLAddDeviceProductService(productId, input)
      if (!graphQLGetErrors(response)) {
        const newService = response?.data?.data?.addDeviceProductService
        if (newService) {
          dispatch.products.set({
            all: state.products.all.map(p =>
              p.id === productId ? { ...p, services: [...p.services, newService] } : p
            ),
          })
        }
        return newService
      }
      return null
    },

    async removeService({ productId, serviceId }: { productId: string; serviceId: string }, state) {
      const response = await graphQLRemoveDeviceProductService(serviceId)
      if (!graphQLGetErrors(response)) {
        dispatch.products.set({
          all: state.products.all.map(p =>
            p.id === productId ? { ...p, services: p.services.filter(s => s.id !== serviceId) } : p
          ),
        })
        return true
      }
      return false
    },
  }),
  reducers: {
    reset(state) {
      state = { ...defaultState }
      return state
    },
    set(state, params: Partial<ProductsState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

