import { Attribute } from '../../components/Attributes'

export type AdminAdminAttributeOptions = {
  admin?: AdminAdminRow
}

export type AdminAdminRow = {
  id: string
  email?: string
  created?: string
  admin?: boolean
}

export class AdminAdminAttribute extends Attribute<AdminAdminAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

export const adminAdminAttributes: AdminAdminAttribute[] = [
  new AdminAdminAttribute({
    id: 'email',
    label: 'Email',
    defaultWidth: 300,
    required: true,
    value: ({ admin }: AdminAdminAttributeOptions) => admin?.email || '-',
  }),
  new AdminAdminAttribute({
    id: 'userId',
    label: 'User ID',
    defaultWidth: 320,
    value: ({ admin }: AdminAdminAttributeOptions) => admin?.id,
  }),
  new AdminAdminAttribute({
    id: 'created',
    label: 'Created',
    defaultWidth: 150,
    value: ({ admin }: AdminAdminAttributeOptions) => {
      if (!admin?.created) return '-'
      return new Date(admin.created).toLocaleDateString()
    },
  }),
]
