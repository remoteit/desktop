import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { TextField, MenuItem } from '@material-ui/core'
import { ROLE } from '../models/organization'

type Props = { member: IOrganizationMember }

export const RoleSelect: React.FC<Props> = ({ member }) => {
  const roles = useSelector((state: ApplicationState) => state.organization.roles)
  const dispatch = useDispatch<Dispatch>()
  const disabled = member.role === 'OWNER' || member.license !== 'LICENSED'
  const role = member.license === 'UNLICENSED' ? 'MEMBER' : member.role

  const handleSelect = (role: IOrganizationRoleType) => {
    dispatch.organization.setMembers([{ ...member, role }])
  }

  return (
    <TextField
      select
      hiddenLabel
      size="small"
      disabled={disabled}
      value={role}
      variant="filled"
      onChange={e => handleSelect(e.target.value as IOrganizationRoleType)}
    >
      <MenuItem dense value="OWNER" disabled>
        {ROLE.OWNER}
      </MenuItem>
      {/* <MenuItem dense value="ADMIN">
        {ROLE.ADMIN}
      </MenuItem>
      <MenuItem dense value="MEMBER">
        {ROLE.MEMBER}
      </MenuItem> */}
      {roles.map(r => (
        <MenuItem key={r.id} value={r.name.toUpperCase() /* FIXME */} dense>
          {r.name}
        </MenuItem>
      ))}
    </TextField>
  )
}
