import React from 'react'
import { TextField, TextFieldProps, MenuItem } from '@mui/material'
import { Icon } from './Icon'

type Props = Omit<TextFieldProps, 'onSelect'> & {
  roles: IOrganizationRole[]
  roleId: IOrganizationRoleIdType
  onSelect: (roleId: string) => void
}

export const RoleSelect: React.FC<Props> = ({ roleId, roles, size = 'small', onSelect, ...props }) => {
  const disabled = roleId === 'OWNER'

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
      {...props}
    >
      {roles.map(r => (
        <MenuItem key={r.id} value={r.id} disabled={!!r.disabled} dense>
          {r.name}
          {r.system && <Icon name="lock" size="xxxs" type="solid" color="gray" inline />}
        </MenuItem>
      ))}
    </TextField>
  )
}
