import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { customerAttributes } from './CustomerAttributes'
import { MOBILE_WIDTH } from '../constants'
import { removeObject } from '../helpers/utilHelper'
import { useMediaQuery, Stack, Typography } from '@mui/material'
import { CustomerListItem } from './CustomerListItem'
import { GridList } from './GridList'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export interface CustomerListProps {
  customers: ICustomer[]
  disabled?: boolean
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers = [], disabled }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(customerAttributes, a => a.required === true)

  return (
    <GridList {...{ attributes, required, columnWidths, mobile }}>
      {!customers.length && (
        <Stack marginY={8} width="100%" alignItems="center">
          <Icon name="address-book" type="light" fontSize={48} color="gray" />
          <Typography variant="caption" sx={{ marginTop: 2 }}>
            You have no customers yet.
          </Typography>
        </Stack>
      )}
      {customers.map(customer => (
        <CustomerListItem
          key={customer.id}
          icon={<Avatar email={customer.email} size={28} />}
          {...{ disabled, mobile, required, attributes, customer }}
        />
      ))}
    </GridList>
  )
}
