import React from 'react'
import { currencyFormatter } from '../helpers/utilHelper'
import { ColorChip } from './ColorChip'
import { Attribute } from './Attributes'
import { Avatar } from './Avatar'

class CustomerAttribute extends Attribute {
  type: Attribute['type'] = 'CUSTOMER'
}

export const customerAttributes: CustomerAttribute[] = [
  new CustomerAttribute({
    id: 'customerEmail',
    label: 'Email',
    required: true,
    defaultWidth: 250,
    value: ({ customer }) => <>{customer?.email}</>,
  }),
  new CustomerAttribute({
    id: 'customerPlan',
    label: 'Plan',
    defaultWidth: 100,
    value: ({ customer }) => (
      <ColorChip
        label={customer?.license?.plan.description || 'Personal'}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    ),
  }),
  new CustomerAttribute({
    id: 'customerQuantity',
    label: 'Quantity',
    defaultWidth: 100,
    value: ({ customer }) => <>{customer?.license?.quantity || '–'}</>,
  }),
  new CustomerAttribute({
    id: 'customerPrice',
    label: 'Price',
    defaultWidth: 74,
    value: ({ customer }) => {
      const price = customer?.license?.subscription?.price
      return currencyFormatter(price?.currency, price?.amount)
    },
  }),
  new CustomerAttribute({
    id: 'customerReseller',
    label: 'Rep',
    defaultWidth: 74,
    value: ({ customer }) => <Avatar email={customer?.reseller} size={28} tooltip />,
  }),
]
