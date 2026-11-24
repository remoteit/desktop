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
  graphQLSetDeviceProductLifecycle,
  ProductLifecycle,
  ProductRegistrationService,
  ProductServiceInput,
} from '../services/graphQLDeviceProducts'
import { registrationCodesToRetire } from '../helpers/productCredentials'
import { rowSaid, selectRow } from '../selectors/accounts'
import { asRow, rowGone } from '../selectors/signIns'
import { RowKey, rowKey, withoutAccounts, withoutRows, rekeyed } from '../helpers/rowKey'
import { findElsewhere } from '../services/elsewhere'
import { State } from '../store'

export interface IProductService {
  id: string
  name: string
  type: { id: number; name: string } | null
  host: string | null
  port: number | null
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
  lifecycle?: ProductLifecycle
  tags?: string[]
  source?: string
  created: string
  updated: string
  services: IProductService[]
}

// What only the single-product read carries: the product's credentials, and its lifecycle — whether its devices register
// again with a join key at every boot. Every credential change reads them again, together, so the command, the codes,
// the keys and the warning never disagree.
const CREDENTIAL_FIELDS = [
  'registrationCode',
  'registrationCommand',
  'registrationCodes',
  'oneTimeCodes',
  'joinKeys',
  'registrationWarning',
  'lifecycle',
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

// By ROW (helpers/rowKey): an account's products as each sign-in that belongs to it is given them; beside the rows,
// `default` (what a row starts from).
type ProductsAccountState = {
  [row: string]: ProductsState
}

// The latest credential refresh asked for, per account and product: a response to an earlier one is superseded and
// dropped, so a read that started before a change cannot land after it and put the old credentials back.
const credentialRefreshes = new Map<string, number>()
let credentialRefreshCount = 0

const defaultAccountState: ProductsAccountState = {
  default: { ...defaultState },
}

// Helper to get product model for a specific account
// The product model of the row an account is looked at through (the selected row's where none is named), or of `row`.
export function getProductModel(state: State, accountId?: string, row?: RowKey): ProductsState {
  return state.products[row ?? selectRow(state, accountId)] || state.products.default || defaultState
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async fetch(_: void, state) {
      const { accountId, row } = rowSaid(state)
      dispatch.products.set({ fetching: true, accountId, row })
      const response = await graphQLDeviceProducts({ accountId }, asRow(row))
      if (response !== 'ERROR') {
        const products = response?.data?.data?.login?.account?.deviceProducts?.items || []
        console.log('LOADED PRODUCTS', products)
        dispatch.products.set({ all: products, initialized: true, accountId, row })
      }
      dispatch.products.set({ fetching: false, accountId, row })
    },

    async fetchIfEmpty(_: void, state) {
      const { accountId, row } = rowSaid(state)
      const productModel = getProductModel(state, accountId, row)
      // Only fetch if not initialized for this account
      if (!productModel.initialized) {
        await dispatch.products.fetch()
      }
    },

    async fetchSingle(id: string, state) {
      const { accountId, row } = rowSaid(state)
      dispatch.products.set({ fetching: true, accountId, row })
      const response = await graphQLDeviceProduct(id, accountId, asRow(row))
      if (response !== 'ERROR') {
        const items = response?.data?.data?.login?.account?.deviceProducts?.items || []
        const product = items[0]
        if (product) {
          const productModel = getProductModel(state, accountId, row)
          const exists = productModel.all.some(p => p.id === id)
          dispatch.products.set({
            all: exists
              ? productModel.all.map(p => (p.id === id ? product : p))
              : [...productModel.all, product],
            accountId,
            row,
          })
          dispatch.products.set({ fetching: false, accountId, row })
          return product
        }
        // Opened at its address, and not this row's: another sign-in's here to see, maybe — whose row is then
        // selected, and the product put in it (services/elsewhere).
        const found = await findElsewhere<IDeviceProduct>({
          ids: [id],
          asked: row,
          byAccount: true,
          read: async (of, requestFor) => {
            const answer = await graphQLDeviceProduct(id, of, requestFor)
            return answer === 'ERROR' ? undefined : answer?.data?.data?.login?.account?.deviceProducts?.items?.[0]
          },
        })
        if (found) {
          const theirs = rowKey(found.accountId, found.sub)
          const held = getProductModel(state, undefined, theirs).all
          dispatch.products.set({
            all: [...held.filter(p => p.id !== id), found.answer],
            accountId: found.accountId,
            row: theirs,
          })
          dispatch.products.set({ fetching: false, accountId, row })
          return found.answer
        }
      }
      dispatch.products.set({ fetching: false, accountId, row })
      return null
    },

    async create(input: { name: string; platform: string }, state) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLCreateDeviceProduct({ ...input, accountId })
      if (response !== 'ERROR') {
        const newProduct = response?.data?.data?.createDeviceProduct
        if (newProduct) {
          const productModel = getProductModel(state, accountId, row)
          dispatch.products.set({
            all: [...productModel.all, newProduct],
            accountId,
            row,
          })
          return newProduct
        }
      }
      return null
    },

    // The legacy portal keeps two codes in use. A product with join keys keeps its earlier reusable codes
    // until an admin explicitly revokes them.
    async rotateCode({ productId, revokePrevious }: { productId: string; revokePrevious?: boolean }, state) {
      const { accountId, row } = rowSaid(state)
      const product = getProductModel(state, accountId, row).all.find(p => p.id === productId)
      const retired = product ? registrationCodesToRetire(product, revokePrevious) : []
      const response = await graphQLRotateDeviceProductCode(productId)
      if (response === 'ERROR' || !response?.data?.data?.rotateDeviceProductCode) return false
      let revoked = true
      for (const { code } of retired) {
        const result = await graphQLRevokeDeviceProductCode(productId, code)
        if (result === 'ERROR' || !result?.data?.data?.revokeDeviceProductCode) revoked = false
      }
      await dispatch.products.refreshCredentials({ productId, accountId, row })
      return revoked
    },

    // A reusable code or a one-time code: graphql revokes either.
    async revokeCode({ productId, code }: { productId: string; code: string }, state) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLRevokeDeviceProductCode(productId, code)
      if (response === 'ERROR' || !response?.data?.data?.revokeDeviceProductCode) return false
      await dispatch.products.refreshCredentials({ productId, accountId, row })
      return true
    },

    // "Add one device": a code that registers one device within 24 hours. One-time codes stay readable in the product's
    // list, so the new one is also answered for the dialog that shows it.
    async createOneTimeCode(productId: string, state): Promise<IDeviceProductCode | undefined> {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLCreateDeviceProductOneTimeCode(productId)
      const code: IDeviceProductCode | undefined =
        response === 'ERROR' ? undefined : response?.data?.data?.createDeviceProductOneTimeCode
      if (!code) return undefined
      await dispatch.products.refreshCredentials({ productId, accountId, row })
      return code
    },

    // The key itself is answered to the caller alone, the dialog that shows it once: it goes into no action, no state
    // and no log. What the store keeps of the new key comes from the product's list, which never carries it.
    async createJoinKey(input: IJoinKeyInput, state): Promise<{ key?: string; reason?: string }> {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLCreateDeviceProductJoinKey(input)
      if (response === 'ERROR') return {}
      if ('reason' in response) return { reason: response.reason }
      const key: string | undefined = response?.data?.data?.createDeviceProductJoinKey?.key
      if (!key) return {}
      await dispatch.products.refreshCredentials({ productId: input.productId, accountId, row })
      return { key }
    },

    async revokeJoinKey({ productId, id }: { productId: string; id: string }, state) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLRevokeDeviceProductJoinKey(productId, id)
      if (response === 'ERROR' || !response?.data?.data?.revokeDeviceProductJoinKey) return false
      await dispatch.products.refreshCredentials({ productId, accountId, row })
      return true
    },

    // Persistent or ephemeral: refused, in graphql's words, while one of its devices runs a daemon that cannot keep its
    // identity in memory. Read again as a credential change is.
    async setLifecycle(
      { productId, lifecycle }: { productId: string; lifecycle: ProductLifecycle },
      state
    ): Promise<{ reason?: string }> {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLSetDeviceProductLifecycle(productId, lifecycle)
      if (response === 'ERROR') return { reason: '' }
      if ('reason' in response) return { reason: response.reason }
      await dispatch.products.refreshCredentials({ productId, accountId, row })
      return {}
    },

    // A product's credentials as graphql has them after one changed, in the account the change was made in: the active
    // account can change while the mutation runs. Only the credential fields are merged, into the store as it is when
    // the read returns (mergeCredentials), so a change made meanwhile is kept. When the read fails they are cleared
    // rather than left stale (a revoked code must not stay on screen as the one to register with); the settings page
    // reads them again.
    async refreshCredentials(
      { productId, accountId, row: said }: { productId: string; accountId: string; row?: RowKey },
      state
    ) {
      const row = said ?? selectRow(state, accountId)
      const key = `${row}:${productId}`
      const request = ++credentialRefreshCount
      credentialRefreshes.set(key, request)
      const response = await graphQLDeviceProduct(productId, accountId, asRow(row))
      if (credentialRefreshes.get(key) !== request) return
      const fresh = response !== 'ERROR' ? response?.data?.data?.login?.account?.deviceProducts?.items?.[0] : undefined
      dispatch.products.mergeCredentials({
        row,
        productId,
        credentials: Object.fromEntries(CREDENTIAL_FIELDS.map(field => [field, fresh?.[field]])) as IProductCredentials,
      })
    },

    async delete(id: string, state) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLDeleteDeviceProduct(id)
      if (response === 'ERROR') return false
      const productModel = getProductModel(state, accountId, row)
      dispatch.products.set({
        all: productModel.all.filter(p => p.id !== id),
        selected: productModel.selected.filter(s => s !== id),
        accountId,
        row,
      })
      return true
    },

    async deleteSelected(_: void, state) {
      const { accountId, row } = rowSaid(state)
      const productModel = getProductModel(state, accountId, row)
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
        row,
      })
    },

    select(id: string, state) {
      const { accountId, row } = rowSaid(state)
      const productModel = getProductModel(state, accountId, row)
      const { selected } = productModel
      if (selected.includes(id)) {
        dispatch.products.set({ selected: selected.filter(s => s !== id), accountId, row })
      } else {
        dispatch.products.set({ selected: [...selected, id], accountId, row })
      }
    },

    selectAll(checked: boolean, state) {
      const { accountId, row } = rowSaid(state)
      const productModel = getProductModel(state, accountId, row)
      dispatch.products.set({
        selected: checked ? productModel.all.map(p => p.id) : [],
        accountId,
        row,
      })
    },

    clearSelection(_: void, state) {
      const { accountId, row } = rowSaid(state)
      dispatch.products.set({ selected: [], accountId, row })
    },

    async addService(
      { productId, input }: { productId: string; input: ProductServiceInput },
      state
    ) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLAddDeviceProductService(productId, input)
      if (response !== 'ERROR') {
        const newService = response?.data?.data?.addDeviceProductService
        if (newService) {
          const productModel = getProductModel(state, accountId, row)
          dispatch.products.set({
            all: productModel.all.map(p =>
              p.id === productId ? { ...p, services: [...p.services, newService] } : p
            ),
            accountId,
            row,
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
        services: ProductRegistrationService[]
      },
      state
    ) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLCreateDeviceProductFromRegistration({ ...input, accountId })
      if (response !== 'ERROR') {
        const newProduct = response?.data?.data?.createDeviceProductFromRegistration
        if (newProduct) {
          const productModel = getProductModel(state, accountId, row)
          dispatch.products.set({
            all: [...productModel.all, newProduct],
            accountId,
            row,
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
      const { accountId, row } = rowSaid(state)
      const response = await graphQLUpdateDeviceProduct(id, input)
      if (response !== 'ERROR') {
        const updatedProduct = response?.data?.data?.updateDeviceProduct
        if (updatedProduct) {
          const productModel = getProductModel(state, accountId, row)
          dispatch.products.set({
            all: productModel.all.map(p => (p.id === id ? updatedProduct : p)),
            accountId,
            row,
          })
        }
        return updatedProduct
      }
      return null
    },

    async removeService({ productId, serviceId }: { productId: string; serviceId: string }, state) {
      const { accountId, row } = rowSaid(state)
      const response = await graphQLRemoveDeviceProductService(serviceId, productId)
      if (response !== 'ERROR') {
        const productModel = getProductModel(state, accountId, row)
        dispatch.products.set({
          all: productModel.all.map(p =>
            p.id === productId ? { ...p, services: p.services.filter(s => s.id !== serviceId) } : p
          ),
          accountId,
          row,
        })
        return true
      }
      return false
    },

    async transferProduct({ productId, email }: { productId: string; email: string }, state) {
      const { accountId, row } = rowSaid(state)
      const productModel = getProductModel(state, accountId, row)
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
          row,
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
    /* The one write of a row's products. `row` is the key (helpers/rowKey): the row said — the one an effect began in,
       or a read was made for — else the one the account (`accountId`, or the selected one) is looked at through. */
    async set(params: Partial<ProductsState> & { accountId?: string; row?: RowKey }, state) {
      const row = params.row ?? selectRow(state, params.accountId)
      // An answer for a row whose sign-in has left since it was asked: the row is gone, and is not put back.
      if (params.row && rowGone(state, params.row)) return
      const productState = { ...getProductModel(state, undefined, row) }

      Object.keys(params).forEach(key => {
        if (key !== 'accountId' && key !== 'row') {
          productState[key] = params[key]
        }
      })

      await dispatch.products.rootSet({ [row]: productState })
    },
  }),
  reducers: {
    reset(state: ProductsAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    /** An account's data dropped: its sign-in signed out, so it is no longer a row (models/accounts forgetData). */
    forget(state: ProductsAccountState, accountIds: string[]) {
      return withoutAccounts(state, accountIds)
    },
    forgetRows(state: ProductsAccountState, rows: string[]) {
      return withoutRows(state, rows)
    },
    rekey(state: ProductsAccountState, rows: ILookup<RowKey>) {
      return { default: state.default, ...rekeyed(state, rows) }
    },
    rootSet(state: ProductsAccountState, params: ProductsAccountState) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    mergeCredentials(
      state: ProductsAccountState,
      {
        row,
        productId,
        credentials,
      }: {
        row: RowKey
        productId: string
        credentials: IProductCredentials
      }
    ) {
      const model = state[row]
      const product = model?.all.find(p => p.id === productId)
      // Nothing to change keeps every object as it is, so nothing that watches the product runs again.
      if (!product || CREDENTIAL_FIELDS.every(field => product[field] === credentials[field])) return state
      return {
        ...state,
        [row]: { ...model, all: model.all.map(p => (p.id === productId ? { ...p, ...credentials } : p)) },
      }
    },
  },
})
