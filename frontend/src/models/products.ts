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
  graphQLCreateDeviceProductOneTimeCode,
  graphQLCreateDeviceProductJoinKey,
  graphQLRevokeDeviceProductJoinKey,
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

// A reusable code (registrationCodes) or a one-time code (oneTimeCodes, which carry an expiry and a use).
export interface IDeviceProductCode {
  code: string
  created: string
  revoked?: string | null
  expires?: string | null
  used?: number
  lastUsed?: string | null
}

// A join key as the product lists it: never the key itself, which only its creation answers.
export interface IDeviceProductJoinKey {
  id: string
  name: string
  creator?: { id: string; email?: string | null } | null
  created: string
  expires?: string | null
  revoked?: string | null
  lastUsed?: string | null
  joins: number
  maxJoins?: number | null
  joinRate: number
  inForce: boolean
  unused: boolean
  suggestion?: string | null
}

export interface IDeviceProduct {
  id: string
  name: string
  platform: { id: number; name: string | null } | null
  status: 'NEW' | 'LOCKED'
  registrationCode?: string | null
  registrationCommand?: string | null
  registrationCodes?: IDeviceProductCode[]
  oneTimeCodes?: IDeviceProductCode[]
  joinKeys?: IDeviceProductJoinKey[]
  registrationWarning?: string | null
  tags?: string[]
  source?: string
  created: string
  updated: string
  services: IProductService[]
}

// What only the single-product read carries: the product's credentials. Every credential change reads them again,
// together, so the command, the codes, the keys and the warning never disagree.
const CREDENTIAL_FIELDS = [
  'registrationCode',
  'registrationCommand',
  'registrationCodes',
  'oneTimeCodes',
  'joinKeys',
  'registrationWarning',
] as const

export type IProductCredentials = Pick<IDeviceProduct, (typeof CREDENTIAL_FIELDS)[number]>

export type IJoinKeyInput = {
  productId: string
  name: string
  expires?: string
  joinRate?: number
  maxJoins?: number
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

// The latest credential refresh asked for, per account and product: a response to an earlier one is superseded and
// dropped, so a read that started before a change cannot land after it and put the old credentials back.
const credentialRefreshes = new Map<string, number>()
let credentialRefreshCount = 0

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
    // again after every credential change, so its command and its lists come from graphql together.
    async rotateCode(productId: string, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLRotateDeviceProductCode(productId)
      if (response === 'ERROR' || !response?.data?.data?.rotateDeviceProductCode) return false
      await dispatch.products.refreshCredentials({ productId, accountId })
      return true
    },

    // A reusable code or a one-time code: graphql revokes either.
    async revokeCode({ productId, code }: { productId: string; code: string }, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLRevokeDeviceProductCode(productId, code)
      if (response === 'ERROR' || !response?.data?.data?.revokeDeviceProductCode) return false
      await dispatch.products.refreshCredentials({ productId, accountId })
      return true
    },

    // "Add one device": a code that registers one device within 24 hours. One-time codes stay readable in the product's
    // list, so the new one is also answered for the dialog that shows it.
    async createOneTimeCode(productId: string, state): Promise<IDeviceProductCode | undefined> {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLCreateDeviceProductOneTimeCode(productId)
      const code: IDeviceProductCode | undefined =
        response === 'ERROR' ? undefined : response?.data?.data?.createDeviceProductOneTimeCode
      if (!code) return undefined
      await dispatch.products.refreshCredentials({ productId, accountId })
      return code
    },

    // The key itself is answered to the caller alone, the dialog that shows it once: it goes into no action, no state
    // and no log. What the store keeps of the new key comes from the product's list, which never carries it.
    async createJoinKey(input: IJoinKeyInput, state): Promise<{ key?: string; reason?: string }> {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLCreateDeviceProductJoinKey(input)
      if (response === 'ERROR') return {}
      if ('reason' in response) return { reason: response.reason }
      const key: string | undefined = response?.data?.data?.createDeviceProductJoinKey?.key
      if (!key) return {}
      await dispatch.products.refreshCredentials({ productId: input.productId, accountId })
      return { key }
    },

    async revokeJoinKey({ productId, id }: { productId: string; id: string }, state) {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLRevokeDeviceProductJoinKey(productId, id)
      if (response === 'ERROR' || !response?.data?.data?.revokeDeviceProductJoinKey) return false
      await dispatch.products.refreshCredentials({ productId, accountId })
      return true
    },

    // A product's credentials as graphql has them after one changed, in the account the change was made in: the active
    // account can change while the mutation runs. Only the credential fields are merged, into the store as it is when
    // the read returns (mergeCredentials), so a change made meanwhile is kept. When the read fails they are cleared
    // rather than left stale (a revoked code must not stay on screen as the one to register with); the settings page
    // reads them again.
    async refreshCredentials({ productId, accountId }: { productId: string; accountId: string }) {
      const key = `${accountId}:${productId}`
      const request = ++credentialRefreshCount
      credentialRefreshes.set(key, request)
      const response = await graphQLDeviceProduct(productId, accountId)
      if (credentialRefreshes.get(key) !== request) return
      const fresh = response !== 'ERROR' ? response?.data?.data?.login?.account?.deviceProducts?.items?.[0] : undefined
      dispatch.products.mergeCredentials({
        accountId,
        productId,
        credentials: Object.fromEntries(CREDENTIAL_FIELDS.map(field => [field, fresh?.[field]])) as IProductCredentials,
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
    mergeCredentials(
      state: ProductsAccountState,
      {
        accountId,
        productId,
        credentials,
      }: {
        accountId: string
        productId: string
        credentials: IProductCredentials
      }
    ) {
      const model = state[accountId]
      const product = model?.all.find(p => p.id === productId)
      // Nothing to change keeps every object as it is, so nothing that watches the product runs again.
      if (!product || CREDENTIAL_FIELDS.every(field => product[field] === credentials[field])) return state
      return {
        ...state,
        [accountId]: { ...model, all: model.all.map(p => (p.id === productId ? { ...p, ...credentials } : p)) },
      }
    },
  },
})
