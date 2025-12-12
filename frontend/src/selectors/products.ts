import { createSelector } from 'reselect'
import { State } from '../store'
import { selectActiveAccountId } from './accounts'
import { defaultState, IDeviceProduct, ProductsState } from '../models/products'

const getProductsState = (state: State) => state.products

export function getProductModelFn(
  products: State['products'],
  activeAccountId: string,
  accountId?: string
): ProductsState {
  return products[accountId || activeAccountId] || products.default || defaultState
}

export const getProductModel = createSelector(
  [getProductsState, selectActiveAccountId],
  (products, activeAccountId) => getProductModelFn(products, activeAccountId)
)

export const getProducts = createSelector(
  [getProductsState, selectActiveAccountId],
  (products, activeAccountId): IDeviceProduct[] => getProductModelFn(products, activeAccountId).all || []
)

export const getProductsFetching = createSelector(
  [getProductModel],
  productModel => productModel.fetching
)

export const getProductsInitialized = createSelector(
  [getProductModel],
  productModel => productModel.initialized
)

export const getProductsSelected = createSelector(
  [getProductModel],
  productModel => productModel.selected
)

