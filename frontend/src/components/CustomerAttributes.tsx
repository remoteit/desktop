import React from 'react'
import { Attribute } from './Attributes'

class CustomerAttribute extends Attribute {
  type: Attribute['type'] = 'CUSTOMER'
}

export const customerAttributes: CustomerAttribute[] = [
  new CustomerAttribute({
    id: 'customerEmail',
    label: 'Name',
    value: ({ customer }) => <>{customer?.email}</>,
    defaultWidth: 250,
    required: true,
  }),
  new CustomerAttribute({
    id: 'customerQuantity',
    label: 'Quantity',
    value: ({ customer }) => <>{customer?.license?.quantity}</>,
    defaultWidth: 100,
  }),
  new CustomerAttribute({
    id: 'customerPlan',
    label: 'Plan',
    value: ({ customer }) => <>{customer?.license?.quantity}</>,
  }),
  new CustomerAttribute({
    id: 'customerPrice',
    label: 'Price',
    value: ({ customer }) => <>{customer?.license?.subscription?.price}</>,
  }),
]
