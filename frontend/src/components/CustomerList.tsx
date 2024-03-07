import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { customerAttributes } from './CustomerAttributes'
import { MOBILE_WIDTH } from '../constants'
import { removeObject } from '../helpers/utilHelper'
import { useMediaQuery } from '@mui/material'
import { CustomerListItem } from './CustomerListItem'
import { GridList } from './GridList'
import { Gutters } from './Gutters'
import { Avatar } from './Avatar'

export interface DeviceListProps {
  customers: any[]
}

export const CustomerList: React.FC<DeviceListProps> = ({ customers = [] }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(customerAttributes, a => a.required === true)

  return (
    <Gutters>
      <GridList {...{ attributes, required, columnWidths, mobile }}>
        {customers.map(customer => (
          <CustomerListItem
            key={customer.id}
            required={required}
            attributes={attributes}
            data={{ customer, mobile }}
            icon={<Avatar email={customer.email} size={28} />}
          />
        ))}
      </GridList>
    </Gutters>
  )
}
