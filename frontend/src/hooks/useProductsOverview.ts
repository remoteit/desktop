import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { IDeviceProduct } from '../models/products'
import { ProductOverview } from '../helpers/productStatus'
import { graphQLProductsOverview } from '../services/productMaxDevices'
import { selectActiveAccountId } from '../selectors/accounts'

export function useProductsOverview(products: IDeviceProduct[]): Record<string, ProductOverview> | undefined {
  const accountId = useSelector(selectActiveAccountId)
  const [overview, setOverview] = useState<Record<string, ProductOverview>>()
  const key = products.map(product => `${product.id}:${product.updated}`).join(',')

  useEffect(() => {
    if (!products.length) return
    let current = true
    graphQLProductsOverview(accountId).then(result => {
      if (current && result !== 'ERROR') setOverview(result)
    })
    return () => {
      current = false
    }
  }, [accountId, key])

  return overview
}
