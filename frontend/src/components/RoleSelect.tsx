import React from 'react'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { TextField, TextFieldProps, MenuItem, Divider } from '@material-ui/core'

type Props = {
  size?: TextFieldProps['size']
  roleId: IOrganizationRoleIdType
  license: ILicenseTypes
  onSelect: (roleId: string) => void
}

export const RoleSelect: React.FC<Props> = ({ roleId, license, size = 'small', onSelect }) => {
  const roles = useSelector((state: ApplicationState) => state.organization.roles)
  const disabled = roleId === 'OWNER' || license !== 'LICENSED'
  const resultRoleId = license === 'UNLICENSED' ? 'MEMBER' : roleId

  return (
    <TextField
      select
      size={size}
      label={size === 'small' ? undefined : 'Role'}
      hiddenLabel={size === 'small'}
      disabled={disabled}
      value={resultRoleId}
      variant="filled"
      onChange={e => onSelect(e.target.value)}
    >
      {roles.map(r => (
        <MenuItem key={r.id} value={r.id} disabled={!!r.disabled} dense>
          {r.name}
        </MenuItem>
      ))}
      <Divider />
      <MenuItem key="custom" dense onClick={() => {}}>
        Custom...
      </MenuItem>
    </TextField>
  )
}
