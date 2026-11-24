import { createSelector } from 'reselect'
import { State } from '../store'
import { selectRow } from './accounts'
import { RowKey } from '../helpers/rowKey'
import { defaultState, IDeviceProduct, ProductsState } from '../models/products'

const getProductsState = (state: State) => state.products

// `row`: the key the store keeps a row's products by (helpers/rowKey).
export function getProductModelFn(products: State['products'], row: RowKey): ProductsState {
  return products[row] || products.default || defaultState
}

// The products of the row an account is looked at through: the selected row's where none is named.
export const getProductModel = createSelector([getProductsState, selectRow], (products, row) =>
  getProductModelFn(products, row)
)

export const getProducts = createSelector(
  [getProductsState, selectRow],
  (products, row): IDeviceProduct[] => getProductModelFn(products, row).all || []
)

export const getHasProducts = createSelector([getProducts], products => products.length > 0)

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

