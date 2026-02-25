import { Checkbox,useMediaQuery } from '@mui/material'
import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { IDeviceProduct } from '../models/products'
import { GridList } from './GridList'
import { Icon } from './Icon'
import { ProductAttribute } from './ProductAttributes'
import { ProductListItem } from './ProductListItem'

export interface ProductListProps {
  attributes: ProductAttribute[]
  required?: ProductAttribute
  columnWidths: ILookup<number>
  fetching?: boolean
  products?: IDeviceProduct[]
  select?: boolean
  selected?: string[]
  activeProductId?: string
  onSelect?: (id: string) => void
  onSelectAll?: (checked: boolean) => void
}

export const ProductList: React.FC<ProductListProps> = ({
  attributes,
  required,
  products = [],
  columnWidths,
  fetching,
  select,
  selected = [],
  activeProductId,
  onSelect,
  onSelectAll,
}) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const allSelected = products.length > 0 && selected.length === products.length
  const someSelected = selected.length > 0 && selected.length < products.length

  const headerIcon = select ? (
    <Checkbox
      checked={allSelected}
      indeterminate={someSelected}
      onChange={e => onSelectAll?.(e.target.checked)}
      onClick={e => e.stopPropagation()}
      checkedIcon={<Icon name="check-square" size="md" type="solid" />}
      indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
      icon={<Icon name="square" size="md" type="light" />}
      color="primary"
    />
  ) : (
    true
  )

  return (
    <GridList {...{ attributes, required, fetching, columnWidths, mobile, headerIcon }}>
      {products?.map(product => (
        <ProductListItem
          key={product.id}
          product={product}
          required={required}
          attributes={attributes}
          mobile={mobile}
          select={select}
          selected={selected.includes(product.id)}
          active={product.id === activeProductId}
          onSelect={onSelect}
        />
      ))}
    </GridList>
  )
}
