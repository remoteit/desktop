import { useState } from 'react'
import { useSelector } from 'react-redux'
import { IDeviceProduct } from '../models/products'
import { ProductOverview } from '../helpers/productStatus'
import { graphQLProductsOverview } from '../services/productMaxDevices'
import { selectActiveAccountId } from '../selectors/accounts'
import { useReadEffect } from './useReadAgain'

export function useProductsOverview(products: IDeviceProduct[]): Record<string, ProductOverview> | undefined {
  const accountId = useSelector(selectActiveAccountId)
  const [overview, setOverview] = useState<Record<string, ProductOverview>>()
  const key = products.map(product => `${product.id}:${product.updated}`).join(',')

  useReadEffect(
    again => {
      if (!products.length) return
      let current = true
      graphQLProductsOverview(accountId).then(result => {
        if (!current) return
        if (result !== 'ERROR') setOverview(result)
        else if (again) setOverview(undefined)
      })
      return () => {
        current = false
      }
    },
    [accountId, key]
  )

  return overview
}
