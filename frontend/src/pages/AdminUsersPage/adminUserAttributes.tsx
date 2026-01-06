import React from 'react'
import { Attribute } from '../../components/Attributes'

class AdminUserAttribute extends Attribute {
  type: Attribute['type'] = 'MASTER'
}

export const adminUserAttributes: Attribute[] = [
  new AdminUserAttribute({
    id: 'userId',
    label: 'User ID',
    defaultWidth: 320,
    value: ({ user }: { user: any }) => user.id,
  }),
  new AdminUserAttribute({
    id: 'email',
    label: 'Email',
    defaultWidth: 250,
    required: true,
    value: ({ user }: { user: any }) => user.email || '-',
  }),
  new AdminUserAttribute({
    id: 'devices',
    label: 'Devices',
    defaultWidth: 100,
    value: ({ user }: { user: any }) => user.info?.devices?.total || 0,
  }),
  new AdminUserAttribute({
    id: 'license',
    label: 'License',
    defaultWidth: 120,
    value: ({ user }: { user: any }) => {
      // TODO: Get license info from user data
      return <span>-</span>
    },
  }),
  new AdminUserAttribute({
    id: 'created',
    label: 'Created',
    defaultWidth: 150,
    value: ({ user }: { user: any }) => {
      if (!user.created) return '-'
      return new Date(user.created).toLocaleDateString()
    },
  }),
]
