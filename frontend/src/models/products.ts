import { createModel } from '@rematch/core'
import { RootModel } from '.'
import {
  graphQLDeviceProducts,
  graphQLDeviceProduct,
  graphQLCreateDeviceProduct,
  graphQLDeleteDeviceProduct,
  graphQLAddDeviceProductService,
  graphQLRemoveDeviceProductService,
  graphQLTransferDeviceProduct,
  graphQLCreateDeviceProductFromRegistration,
  graphQLUpdateDeviceProduct,
  graphQLRotateDeviceProductCode,
  graphQLRevokeDeviceProductCode,
} from '../services/graphQLDeviceProducts'
import { selectActiveAccountId } from '../selectors/accounts'
import { State } from '../store'

export interface IProductService {
  id: string
  name: string
  type: { id: number; name: string } | null
  port: number
  enabled: boolean
}

export interface IDeviceProductCode {
  code: string
  created: string
  revoked?: string | null
}

export interface IDeviceProduct {
  id: string
  name: string
  platform: { id: number; name: string | null } | null
  status: 'NEW' | 'LOCKED'
  registrationCode?: string
  registrationCommand?: string
  registrationCodes?: IDeviceProductCode[]
  tags?: string[]
  source?: string
  created: string
  updated: string
  services: IProductService[]
}

export type ProductsState = {
  initialized: boolean
  fetching: boolean
  all: IDeviceProduct[]
  selected: string[]
}

export const defaultState: ProductsState = {
  initialized: false,
  fetching: false,
  all: [],
  selected: [],
}

type ProductsAccountState = {
  [accountId: string]: ProductsState
}

const defaultAccountState: ProductsAccountState = {
  default: { ...defaultState },
}

// Helper to get product model for a specific account
export function getProductModel(state: State, accountId?: string): ProductsState {
  const activeAccountId = selectActiveAccountId(state)
  return state.products[accountId || activeAccountId] || state.products.default || defaultState
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async fetch(_: void, state) {
      const accountId = selectActiveAccountId(state)
      dispatch.products.set({ fetching: true, accountId })
      const response = await graphQLDeviceProducts({ accountId })
      if (response !== 'ERROR') {
        const products = response?.data?.data?.login?.account?.deviceProducts?.items || []
        console.log('LOADED PRODUCTS', products)
        dispatch.products.set({ all: products, initialized: true, accountId })
      }
      dispatch.products.set({ fetching: false, accountId })
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = selectActiveAccountId(state)
      const productModel = getProductModel(state, accountId)
      // Only fetch if not initialized for this account
      if (!productModel.initialized) {
        await dispatch.products.fetch()
      }
    },

    async fetchSingle(id: string, state) {
      const accountId = selectActiveAccountId(state)
      dispatch.products.set({ fetching: true, accountId })
      const response = await graphQLDeviceProduct(id, accountId)
      if (response !== 'ERROR') {
        const items = response?.data?.data?.login?.account?.deviceProducts?.items || []
        const product = items[0]
        if (product) {
          const productModel = getProductModel(state, accountId)
          const exists = productModel.all.some(p => p.id === id)
          dispatch.products.set({
            all: exists
              ? productModel.all.map(p => (p.id === id ? product : p))
              : [...productModel.all, product],
            accountId,
          })
          dispatch.products.set({ fetching: false, accountId })
          return product
        }
      }
      dispatch.products.set({ fetching: false, accountId })
      return null
    },

    async create(input: { name: string; platform: string }, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLCreateDeviceProduct({ ...input, accountId })
      if (response !== 'ERROR') {
        const newProduct = response?.data?.data?.createDeviceProduct
        if (newProduct) {
          const productModel = getProductModel(state, accountId)
          dispatch.products.set({
            all: [...productModel.all, newProduct],
            accountId,
          })
          return newProduct
        }
      }
      return null
    },

    // A new code becomes the product's current one; the earlier codes keep working until revoked. The product is read
    // again after either change, so its command and its list of codes come from graphql together.
    async rotateCode(productId: string, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLRotateDeviceProductCode(productId)
      if (response === 'ERROR' || !response?.data?.data?.rotateDeviceProductCode) return false
      await dispatch.products.refreshCodes({ productId, accountId })
      return true
    },

    async revokeCode({ productId, code }: { productId: string; code: string }, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLRevokeDeviceProductCode(productId, code)
      if (response === 'ERROR' || !response?.data?.data?.revokeDeviceProductCode) return false
      await dispatch.products.refreshCodes({ productId, accountId })
      return true
    },

    // A product's codes as graphql has them after a code changed, in the account the change was made in: the active
    // account can change while the mutation runs. Only the code fields are merged, into the store as it is when the read
    // returns (mergeCodes), so a change made meanwhile is kept. When the read fails they are cleared rather than left
    // stale (a revoked code must not stay on screen as the one to register with); the settings page reads them again.
    async refreshCodes({ productId, accountId }: { productId: string; accountId: string }) {
      const response = await graphQLDeviceProduct(productId, accountId)
      const fresh = response !== 'ERROR' ? response?.data?.data?.login?.account?.deviceProducts?.items?.[0] : undefined
      dispatch.products.mergeCodes({
        accountId,
        productId,
        codes: {
          registrationCode: fresh?.registrationCode,
          registrationCommand: fresh?.registrationCommand,
          registrationCodes: fresh?.registrationCodes,
        },
      })
    },

    async delete(id: string, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLDeleteDeviceProduct(id)
      if (response === 'ERROR') return false
      const productModel = getProductModel(state, accountId)
      dispatch.products.set({
        all: productModel.all.filter(p => p.id !== id),
        selected: productModel.selected.filter(s => s !== id),
        accountId,
      })
      return true
    },

    async deleteSelected(_: void, state) {
      const accountId = selectActiveAccountId(state)
      const productModel = getProductModel(state, accountId)
      const { selected, all } = productModel
      if (!selected.length) return

      const results = await Promise.all(
        selected.map(id => graphQLDeleteDeviceProduct(id))
      )

      const successIds = selected.filter((_id, i) => results[i] !== 'ERROR')

      dispatch.products.set({
        all: all.filter(p => !successIds.includes(p.id)),
        selected: [],
        accountId,
      })
    },

    select(id: string, state) {
      const accountId = selectActiveAccountId(state)
      const productModel = getProductModel(state, accountId)
      const { selected } = productModel
      if (selected.includes(id)) {
        dispatch.products.set({ selected: selected.filter(s => s !== id), accountId })
      } else {
        dispatch.products.set({ selected: [...selected, id], accountId })
      }
    },

    selectAll(checked: boolean, state) {
      const accountId = selectActiveAccountId(state)
      const productModel = getProductModel(state, accountId)
      dispatch.products.set({
        selected: checked ? productModel.all.map(p => p.id) : [],
        accountId,
      })
    },

    clearSelection(_: void, state) {
      const accountId = selectActiveAccountId(state)
      dispatch.products.set({ selected: [], accountId })
    },

    async addService(
      { productId, input }: { productId: string; input: { name: string; type: string; port: number; enabled: boolean } },
      state
    ) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLAddDeviceProductService(productId, input)
      if (response !== 'ERROR') {
        const newService = response?.data?.data?.addDeviceProductService
        if (newService) {
          const productModel = getProductModel(state, accountId)
          dispatch.products.set({
            all: productModel.all.map(p =>
              p.id === productId ? { ...p, services: [...p.services, newService] } : p
            ),
            accountId,
          })
        }
        return newService
      }
      return null
    },

    async createFromRegistration(
      input: {
        platform: number
        tags?: string[]
        services: { application: number; name?: string; port?: number; enabled?: boolean }[]
      },
      state
    ) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLCreateDeviceProductFromRegistration({ ...input, accountId })
      if (response !== 'ERROR') {
        const newProduct = response?.data?.data?.createDeviceProductFromRegistration
        if (newProduct) {
          const productModel = getProductModel(state, accountId)
          dispatch.products.set({
            all: [...productModel.all, newProduct],
            accountId,
          })
          return newProduct
        }
      }
      return null
    },

    async updateProduct(
      { id, input }: { id: string; input: { name?: string; platform?: number; tags?: string[] } },
      state
    ) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLUpdateDeviceProduct(id, input)
      if (response !== 'ERROR') {
        const updatedProduct = response?.data?.data?.updateDeviceProduct
        if (updatedProduct) {
          const productModel = getProductModel(state, accountId)
          dispatch.products.set({
            all: productModel.all.map(p => (p.id === id ? updatedProduct : p)),
            accountId,
          })
        }
        return updatedProduct
      }
      return null
    },

    async removeService({ productId, serviceId }: { productId: string; serviceId: string }, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLRemoveDeviceProductService(serviceId)
      if (response !== 'ERROR') {
        const productModel = getProductModel(state, accountId)
        dispatch.products.set({
          all: productModel.all.map(p =>
            p.id === productId ? { ...p, services: p.services.filter(s => s.id !== serviceId) } : p
          ),
          accountId,
        })
        return true
      }
      return false
    },

    async transferProduct({ productId, email }: { productId: string; email: string }, state) {
      const accountId = selectActiveAccountId(state)
      const productModel = getProductModel(state, accountId)
      const product = productModel.all.find(p => p.id === productId)

      if (!product) return false

      dispatch.ui.set({ transferring: true })
      const response = await graphQLTransferDeviceProduct(productId, email)

      if (response !== 'ERROR') {
        // Remove product from local state
        dispatch.products.set({
          all: productModel.all.filter(p => p.id !== productId),
          selected: productModel.selected.filter(s => s !== productId),
          accountId,
        })
        dispatch.ui.set({
          successMessage: `"${product.name}" was successfully transferred to ${email}.`,
        })
        dispatch.ui.set({ transferring: false })
        return true
      }

      dispatch.ui.set({ transferring: false })
      return false
    },

    // Set effect that updates state for a specific account
    async set(params: Partial<ProductsState> & { accountId?: string }, state) {
      const accountId = params.accountId || selectActiveAccountId(state)
      const productState = { ...getProductModel(state, accountId) }

      Object.keys(params).forEach(key => {
        if (key !== 'accountId') {
          productState[key] = params[key]
        }
      })

      await dispatch.products.rootSet({ [accountId]: productState })
    },
  }),
  reducers: {
    reset(state: ProductsAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    rootSet(state: ProductsAccountState, params: ProductsAccountState) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    mergeCodes(
      state: ProductsAccountState,
      {
        accountId,
        productId,
        codes,
      }: {
        accountId: string
        productId: string
        codes: Pick<IDeviceProduct, 'registrationCode' | 'registrationCommand' | 'registrationCodes'>
      }
    ) {
      const model = state[accountId]
      const product = model?.all.find(p => p.id === productId)
      // Nothing to change keeps every object as it is, so nothing that watches the product runs again.
      if (!product || (Object.keys(codes) as (keyof typeof codes)[]).every(key => product[key] === codes[key])) return state
      return {
        ...state,
        [accountId]: { ...model, all: model.all.map(p => (p.id === productId ? { ...p, ...codes } : p)) },
      }
    },
  },
})
