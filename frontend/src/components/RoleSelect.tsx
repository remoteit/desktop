import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { TextField, MenuItem } from '@material-ui/core'

type Props = { member: IOrganizationMember }

export const RoleSelect: React.FC<Props> = ({ member }) => {
  const roles = useSelector((state: ApplicationState) => state.organization.roles)
  const dispatch = useDispatch<Dispatch>()
  const disabled = member.roleId === 'OWNER' || member.license !== 'LICENSED'
  const roleId = member.license === 'UNLICENSED' ? 'MEMBER' : member.roleId

  const handleSelect = (roleId: string) => {
    dispatch.organization.setMembers([{ ...member, roleId }])
  }

  return (
    <TextField
      select
      hiddenLabel
      size="small"
      disabled={disabled}
      value={roleId}
      variant="filled"
      onChange={e => handleSelect(e.target.value)}
    >
      {roles.map(r => (
        <MenuItem key={r.id} value={r.id} disabled={!!r.disabled} dense>
          {r.name}
        </MenuItem>
      ))}
    </TextField>
  )
}
