import React from 'react'
import { useHistory } from 'react-router-dom'
import { Box } from '@mui/material'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { Icon } from './Icon'
import { IDeviceProduct } from '../models/products'

interface Props {
  product: IDeviceProduct
  required?: Attribute
  attributes: Attribute[]
  mobile?: boolean
  select?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
}

export const ProductListItem: React.FC<Props> = ({
  product,
  required,
  attributes,
  mobile,
  select,
  selected,
  onSelect,
}) => {
  const history = useHistory()

  const handleClick = () => {
    if (select && onSelect) {
      onSelect(product.id)
    } else {
      history.push(`/products/${product.id}`)
    }
  }

  return (
    <GridListItem
      onClick={handleClick}
      selected={selected}
      mobile={mobile}
      disableGutters
      icon={
        select ? (
          selected ? (
            <Icon name="check-square" size="md" type="solid" color="primary" />
          ) : (
            <Icon name="square" size="md" />
          )
        ) : (
          <Icon name="box" size="md" color="grayDark" />
        )
      }
      required={required?.value({ product })}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id} className="attribute">
          {attribute.value({ product })}
        </Box>
      ))}
    </GridListItem>
  )
}

