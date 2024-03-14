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
    value: ({ customer }) => <>{customer?.email}</>,
    defaultWidth: 250,
    required: true,
  }),
  new CustomerAttribute({
    id: 'customerPlan',
    label: 'Plan',
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
    value: ({ customer }) => <>{customer?.license?.quantity || '–'}</>,
    defaultWidth: 100,
  }),
  new CustomerAttribute({
    id: 'customerPrice',
    label: 'Price',
    value: ({ customer }) => {
      const price = customer?.license?.subscription?.price
      return currencyFormatter(price?.currency, price?.amount)
    },
  }),
  new CustomerAttribute({
    id: 'customerReseller',
    label: 'Rep',
    value: ({ customer }) => <Avatar email={customer?.reseller} size={28} tooltip />,
    defaultWidth: 100,
  }),
]
