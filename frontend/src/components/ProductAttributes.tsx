import { Chip, Typography } from '@mui/material'
import React from 'react'
import { IDeviceProduct, IProductService } from '../models/products'
import { Attribute } from './Attributes'
import { ProductStatusChip } from './ProductStatusChip'
import { Timestamp } from './Timestamp'

export type ProductAttributeOptions = {
  product?: IDeviceProduct
}

export class ProductAttribute extends Attribute<IDataOptions> {
  type: Attribute['type'] = 'DEVICE'
}

export type ProductDetailAttributeOptions = {
  product?: IDeviceProduct
}

export class ProductDetailAttribute extends Attribute<IDataOptions> {
  type: Attribute['type'] = 'DEVICE'
}

export type ProductServiceAttributeOptions = {
  product?: IDeviceProduct
  productService?: IProductService
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
    value: ({ product }: ProductAttributeOptions) => <ProductStatusChip status={product?.status} />,
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

export const productDetailAttributes: ProductDetailAttribute[] = [
  new ProductDetailAttribute({
    id: 'productPlatformDetail',
    label: 'Platform',
    value: ({ product }: ProductDetailAttributeOptions) => product?.platform?.name || product?.platform?.id,
  }),
  new ProductDetailAttribute({
    id: 'productStatusDetail',
    label: 'Status',
    value: ({ product }: ProductDetailAttributeOptions) => <ProductStatusChip status={product?.status} />,
  }),
  new ProductDetailAttribute({
    id: 'productServicesDetail',
    label: 'Services',
    value: ({ product }: ProductDetailAttributeOptions) => product?.services?.length || 0,
  }),
  new ProductDetailAttribute({
    id: 'productCreatedDetail',
    label: 'Created',
    value: ({ product }: ProductDetailAttributeOptions) => product?.created && <Timestamp date={new Date(product.created)} />,
  }),
  new ProductDetailAttribute({
    id: 'productUpdatedDetail',
    label: 'Updated',
    value: ({ product }: ProductDetailAttributeOptions) => product?.updated && <Timestamp date={new Date(product.updated)} />,
  }),
  new ProductDetailAttribute({
    id: 'productIdDetail',
    label: 'Product ID',
    copyable: true,
    value: ({ product }: ProductDetailAttributeOptions) => product?.id,
  }),
]

export const productServiceDetailAttributes: ProductServiceAttribute[] = [
  new ProductServiceAttribute({
    id: 'productServiceTypeDetail',
    label: 'Service Type',
    value: ({ productService }: ProductServiceAttributeOptions) => productService?.type?.name || 'Unknown',
  }),
  new ProductServiceAttribute({
    id: 'productServicePortDetail',
    label: 'Port',
    value: ({ productService }: ProductServiceAttributeOptions) => productService?.port,
  }),
  new ProductServiceAttribute({
    id: 'productServiceStatusDetail',
    label: 'Status',
    value: ({ productService }: ProductServiceAttributeOptions) =>
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
    value: ({ productService }: ProductServiceAttributeOptions) => productService?.id,
  }),
]
