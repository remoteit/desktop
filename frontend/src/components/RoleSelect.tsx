import React from 'react'
import { TextField, TextFieldProps, MenuItem } from '@material-ui/core'

type Props = {
  size?: TextFieldProps['size']
  roles: IOrganizationRole[]
  roleId: IOrganizationRoleIdType
  license: ILicenseTypes
  onSelect: (roleId: string) => void
}

export const RoleSelect: React.FC<Props> = ({ roleId, roles, license, size = 'small', onSelect }) => {
  const disabled = roleId === 'OWNER' || license !== 'LICENSED'

  return (
    <TextField
      select
      size={size}
      label={size === 'small' ? undefined : 'Role'}
      hiddenLabel={size === 'small'}
      disabled={disabled}
      value={roleId}
      variant="filled"
      onChange={e => onSelect(e.target.value)}
    >
      {roles.map(r => (
        <MenuItem key={r.id} value={r.id} disabled={!!r.disabled} dense>
          {r.name}
        </MenuItem>
      ))}
    </TextField>
  )
}
