import React from 'react'
import { Attribute } from '../../components/Attributes'

export type AdminUserAttributeOptions = {
  user?: AdminUserRow
}

export type AdminUserRow = {
  id: string
  email?: string
  created?: string
  info?: {
    devices?: {
      total?: number
    }
  }
}

export class AdminUserAttribute extends Attribute<AdminUserAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

export const adminUserAttributes: AdminUserAttribute[] = [
  new AdminUserAttribute({
    id: 'userId',
    label: 'User ID',
    defaultWidth: 320,
    value: ({ user }: AdminUserAttributeOptions) => user?.id,
  }),
  new AdminUserAttribute({
    id: 'email',
    label: 'Email',
    defaultWidth: 250,
    required: true,
    value: ({ user }: AdminUserAttributeOptions) => user?.email || '-',
  }),
  new AdminUserAttribute({
    id: 'devices',
    label: 'Devices',
    defaultWidth: 100,
    value: ({ user }: AdminUserAttributeOptions) => user?.info?.devices?.total || 0,
  }),
  new AdminUserAttribute({
    id: 'license',
    label: 'License',
    defaultWidth: 120,
    value: () => {
      // TODO: Get license info from user data
      return <span>-</span>
    },
  }),
  new AdminUserAttribute({
    id: 'created',
    label: 'Created',
    defaultWidth: 150,
    value: ({ user }: AdminUserAttributeOptions) => {
      if (!user?.created) return '-'
      return new Date(user.created).toLocaleDateString()
    },
  }),
]
