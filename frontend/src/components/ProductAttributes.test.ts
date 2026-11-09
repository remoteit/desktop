import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))

import '../store'
import { productServiceDetailAttributes } from './ProductAttributes'
import { IProductService } from '../models/products'

const shown = (productService: Partial<IProductService>) =>
  Object.fromEntries(
    productServiceDetailAttributes
      .filter(attribute => ['productServiceHostDetail', 'productServicePortDetail'].includes(attribute.id))
      .map(attribute => [attribute.label, attribute.value({ productService } as IDataOptions) ?? null])
  )

describe("a product service's target on its detail page", () => {
  it('shows the host and port to those the API shows them to', () => {
    expect(shown({ host: '192.168.1.50', port: 8080 })).toEqual({ 'Service Host': '192.168.1.50', Port: 8080 })
  })

  it('shows a service with no host as targeting the device itself', () => {
    expect(shown({ host: null, port: 22 })).toEqual({ 'Service Host': '127.0.0.1', Port: 22 })
  })

  it('leaves out both when the API withholds them', () => {
    expect(shown({ host: null, port: null })).toEqual({ 'Service Host': null, Port: null })
  })
})
