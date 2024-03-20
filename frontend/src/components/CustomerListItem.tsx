import React from 'react'
import { Attribute } from './Attributes'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from './AttributeValue'
import { Box, ListItemButtonProps } from '@mui/material'
import { GridListItem } from './GridListItem'

type Props = ListItemButtonProps & {
  customer: ICustomer
  icon?: React.ReactElement
  required?: Attribute
  attributes: Attribute[]
  mobile?: boolean
}

export const CustomerListItem: React.FC<Props> = ({ customer, required, attributes, mobile, icon, ...props }) => {
  const history = useHistory()
  return (
    <GridListItem
      icon={icon}
      mobile={mobile}
      required={<AttributeValue attribute={required} customer={customer} mobile={mobile} />}
      onClick={() => history.push(`/organization/customer/${customer.id}`)}
      disableGutters
      {...props}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue attribute={attribute} customer={customer} mobile={mobile} />
        </Box>
      ))}
    </GridListItem>
  )
}
