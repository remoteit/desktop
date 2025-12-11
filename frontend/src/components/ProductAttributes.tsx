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
      <Typography sx={{ opacity: product?.hidden ? 0.5 : 1 }}>
        {product?.name}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productPlatform',
    label: 'Platform',
    defaultWidth: 100,
    value: ({ product }: IProductOptions) => (
      <Typography variant="body2" color="grayDarker.main">
        {product?.platform}
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
    id: 'productScope',
    label: 'Scope',
    defaultWidth: 90,
    value: ({ product }: IProductOptions) => (
      <Chip
        size="small"
        label={product?.scope.toLowerCase()}
        color={product?.scope === 'PRIVATE' ? 'secondary' : 'default'}
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
    id: 'productHidden',
    label: 'Hidden',
    defaultWidth: 80,
    value: ({ product }: IProductOptions) =>
      product?.hidden ? (
        <Chip size="small" label="Hidden" variant="outlined" />
      ) : null,
  }),
  new ProductAttribute({
    id: 'productUpdated',
    label: 'Updated',
    defaultWidth: 150,
    value: ({ product }: IProductOptions) =>
      product?.updated && <Timestamp date={new Date(product.updated)} />,
  }),
]

