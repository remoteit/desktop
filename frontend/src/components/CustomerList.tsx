import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { customerAttributes } from './CustomerAttributes'
import { MOBILE_WIDTH } from '../constants'
import { removeObject } from '../helpers/utilHelper'
import { useMediaQuery, Box } from '@mui/material'
import { CustomerListItem } from './CustomerListItem'
import { GridList } from './GridList'
import { Avatar } from './Avatar'

export interface DeviceListProps {
  customers: ICustomer[]
  disabled?: boolean
}

export const CustomerList: React.FC<DeviceListProps> = ({ customers = [], disabled }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(customerAttributes, a => a.required === true)

  return (
    <GridList {...{ attributes, required, columnWidths, mobile }}>
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
