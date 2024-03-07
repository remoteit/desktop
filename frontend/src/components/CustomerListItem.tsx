import React from 'react'
import { Attribute } from './Attributes'
import { AttributeValue } from './AttributeValue'
import { Box, ListItemButtonProps } from '@mui/material'
import { GridListItem } from './GridListItem'

type Props = ListItemButtonProps & {
  data?: any
  icon?: React.ReactElement
  required?: Attribute
  attributes: Attribute[]
  mobile?: boolean
}

export const CustomerListItem: React.FC<Props> = ({ data, required, attributes, mobile, icon, ...props }) => {
  return (
    <GridListItem icon={icon} required={<AttributeValue attribute={required} {...data} />} {...props} disableGutters>
      {attributes.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue attribute={attribute} {...data} />
        </Box>
      ))}
    </GridListItem>
  )
}
