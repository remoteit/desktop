import React from 'react'
import { Box, TextField, TextFieldProps, MenuItem } from '@mui/material'
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
          <Box sx={{ color: r.system ? 'primary.main' : undefined, display: 'flex', alignItems: 'center' }}>
            {r.system && <Icon name="lock" size="xxxs" type="solid" inlineLeft />}
            {r.name}
          </Box>
        </MenuItem>
      ))}
    </TextField>
  )
}
