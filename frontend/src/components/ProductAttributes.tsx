import { Chip, Typography } from '@mui/material'
import React from 'react'
import { Attribute } from './Attributes'
import { ProductStatusChip } from './ProductStatusChip'
import { Timestamp } from './Timestamp'

export class ProductAttribute extends Attribute<IDataOptions> {
  type: Attribute['type'] = 'DEVICE'
}

export class ProductDetailAttribute extends Attribute<IDataOptions> {
  type: Attribute['type'] = 'DEVICE'
}

export class ProductServiceAttribute extends Attribute<IDataOptions> {
  type: Attribute['type'] = 'SERVICE'
}

export const productAttributes: ProductAttribute[] = [
  new ProductAttribute({
    id: 'productName',
    label: 'Name',
    required: true,
    defaultWidth: 300,
    value: ({ product }: IDataOptions) => (
      <Typography noWrap>{product?.name}</Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productPlatform',
    label: 'Platform',
    defaultWidth: 100,
    value: ({ product }: IDataOptions) => (
      <Typography variant="body2" color="grayDarker.main" noWrap>
        {product?.platform?.name || product?.platform?.id}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productStatus',
    label: 'Status',
    defaultWidth: 100,
    value: ({ product }: IDataOptions) => <ProductStatusChip status={product?.status} />,
  }),
  new ProductAttribute({
    id: 'productServices',
    label: 'Services',
    defaultWidth: 80,
    value: ({ product }: IDataOptions) => (
      <Typography variant="body2" color="grayDarker.main" noWrap>
        {product?.services?.length || 0}
      </Typography>
    ),
  }),
  new ProductAttribute({
    id: 'productCreated',
    label: 'Created',
    defaultWidth: 150,
    value: ({ product }: IDataOptions) =>
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
    value: ({ product }: IDataOptions) =>
      product?.updated && (
        <Typography variant="body2" color="grayDarker.main" noWrap>
          <Timestamp date={new Date(product.updated)} />
        </Typography>
      ),
  }),
]

export const productDetailAttributes: ProductDetailAttribute[] = [
  new ProductDetailAttribute({
    id: 'productPlatformDetail',
    label: 'Platform',
    value: ({ product }: IDataOptions) => product?.platform?.name || product?.platform?.id,
  }),
  new ProductDetailAttribute({
    id: 'productStatusDetail',
    label: 'Status',
    value: ({ product }: IDataOptions) => <ProductStatusChip status={product?.status} />,
  }),
  new ProductDetailAttribute({
    id: 'productServicesDetail',
    label: 'Services',
    value: ({ product }: IDataOptions) => product?.services?.length || 0,
  }),
  new ProductDetailAttribute({
    id: 'productCreatedDetail',
    label: 'Created',
    value: ({ product }: IDataOptions) => product?.created && <Timestamp date={new Date(product.created)} />,
  }),
  new ProductDetailAttribute({
    id: 'productUpdatedDetail',
    label: 'Updated',
    value: ({ product }: IDataOptions) => product?.updated && <Timestamp date={new Date(product.updated)} />,
  }),
  new ProductDetailAttribute({
    id: 'productIdDetail',
    label: 'Product ID',
    copyable: true,
    value: ({ product }: IDataOptions) => product?.id,
  }),
]

export const productServiceDetailAttributes: ProductServiceAttribute[] = [
  new ProductServiceAttribute({
    id: 'productServiceTypeDetail',
    label: 'Service Type',
    value: ({ productService }: IDataOptions) => productService?.type?.name || 'Unknown',
  }),
  new ProductServiceAttribute({
    id: 'productServicePortDetail',
    label: 'Port',
    value: ({ productService }: IDataOptions) => productService?.port,
  }),
  new ProductServiceAttribute({
    id: 'productServiceStatusDetail',
    label: 'Status',
    value: ({ productService }: IDataOptions) =>
      productService ? (
        <Chip
          size="small"
          label={productService.enabled ? 'Enabled' : 'Disabled'}
          color={productService.enabled ? 'success' : 'default'}
          variant={productService.enabled ? 'filled' : 'outlined'}
        />
      ) : undefined,
  }),
  new ProductServiceAttribute({
    id: 'productServiceIdDetail',
    label: 'Service ID',
    copyable: true,
    value: ({ productService }: IDataOptions) => productService?.id,
  }),
]
