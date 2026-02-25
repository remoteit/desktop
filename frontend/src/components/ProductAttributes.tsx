import { Chip,Typography } from '@mui/material'
import React from 'react'
import { IDeviceProduct } from '../models/products'
import { Attribute } from './Attributes'
import { Timestamp } from './Timestamp'

export type ProductAttributeOptions = {
  product?: IDeviceProduct
}

export class ProductAttribute extends Attribute<ProductAttributeOptions> {
  type: Attribute['type'] = 'DEVICE'
}

export const productAttributes: ProductAttribute[] = [
  new ProductAttribute({
    id: 'productName',
    label: 'Name',
    required: true,
    defaultWidth: 300,
    value: ({ product }: ProductAttributeOptions) => (
      <Typography noWrap>{product?.name}</Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productPlatform',
    label: 'Platform',
    defaultWidth: 100,
    value: ({ product }: ProductAttributeOptions) => (
      <Typography variant="body2" color="grayDarker.main" noWrap>
        {product?.platform?.name || product?.platform?.id}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productStatus',
    label: 'Status',
    defaultWidth: 100,
    value: ({ product }: ProductAttributeOptions) => (
      <Chip
        size="small"
        label={product?.status === 'LOCKED' ? 'Locked' : 'Draft'}
        color={product?.status === 'LOCKED' ? 'primary' : 'default'}
        variant={product?.status === 'LOCKED' ? 'filled' : 'outlined'}
      />
    ),
  }),
  new ProductAttribute({
    id: 'productServices',
    label: 'Services',
    defaultWidth: 80,
    value: ({ product }: ProductAttributeOptions) => (
      <Typography variant="body2" color="grayDarker.main" noWrap>
        {product?.services?.length || 0}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productCreated',
    label: 'Created',
    defaultWidth: 150,
    value: ({ product }: ProductAttributeOptions) =>
      product?.created && (
        <Typography variant="body2" color="grayDarker.main" noWrap>
          <Timestamp date={new Date(product.created)} />
        </Typography>
      ),
  }),
  new ProductAttribute({
    id: 'productUpdated',
    label: 'Updated',
    defaultWidth: 150,
    value: ({ product }: ProductAttributeOptions) =>
      product?.updated && (
        <Typography variant="body2" color="grayDarker.main" noWrap>
          <Timestamp date={new Date(product.updated)} />
        </Typography>
      ),
  }),
]
