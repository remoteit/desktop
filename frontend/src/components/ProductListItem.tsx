import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box } from '@mui/material'
import { GridListItem } from './GridListItem'
import { Attribute } from './Attributes'
import { Icon } from './Icon'
import { IDeviceProduct } from '../models/products'
import { Dispatch } from '../store'

interface Props {
  product: IDeviceProduct
  required?: Attribute
  attributes: Attribute[]
  mobile?: boolean
  select?: boolean
  selected?: boolean
  active?: boolean
  onSelect?: (id: string) => void
}

export const ProductListItem: React.FC<Props> = ({
  product,
  required,
  attributes,
  mobile,
  select,
  selected,
  active,
  onSelect,
}) => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const handleClick = () => {
    if (select && onSelect) {
      onSelect(product.id)
    } else {
      const to = `/products/${product.id}`
      dispatch.ui.setDefaultSelected({ key: '/products', value: to })
      history.push(to)
    }
  }

  return (
    <GridListItem
      onClick={handleClick}
      selected={selected || active}
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
          <Icon platform={product.platform?.id} platformIcon size="md" />
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

