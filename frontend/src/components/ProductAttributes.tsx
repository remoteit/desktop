import React from 'react'
import { Chip, Typography } from '@mui/material'
import { Attribute } from './Attributes'
import { Timestamp } from './Timestamp'
import { IDeviceProduct } from '../models/products'

export class ProductAttribute extends Attribute {
  type: Attribute['type'] = 'DEVICE'
}

interface IProductOptions {
  product?: IDeviceProduct
}

export const productAttributes: ProductAttribute[] = [
  new ProductAttribute({
    id: 'productName',
    label: 'Name',
    required: true,
    defaultWidth: 300,
    value: ({ product }: IProductOptions) => (
      <Typography>{product?.name}</Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productPlatform',
    label: 'Platform',
    defaultWidth: 100,
    value: ({ product }: IProductOptions) => (
      <Typography variant="body2" color="grayDarker.main">
        {product?.platform?.name || product?.platform?.id}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productStatus',
    label: 'Status',
    defaultWidth: 100,
    value: ({ product }: IProductOptions) => (
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
    value: ({ product }: IProductOptions) => (
      <Typography variant="body2" color="grayDarker.main">
        {product?.services?.length || 0}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productCreated',
    label: 'Created',
    defaultWidth: 150,
    value: ({ product }: IProductOptions) =>
      product?.created && <Timestamp date={new Date(product.created)} />,
  }),
  new ProductAttribute({
    id: 'productUpdated',
    label: 'Updated',
    defaultWidth: 150,
    value: ({ product }: IProductOptions) =>
      product?.updated && <Timestamp date={new Date(product.updated)} />,
  }),
]

