import React from 'react'
import { Dispatch } from '../store'
import { Chip, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { TextField, MenuItem } from '@material-ui/core'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { Duration } from './Duration'
import { Avatar } from './Avatar'
import { spacing } from '../styling'
import { ROLE } from '../models/organization'

type Props = { member: IOrganizationMember; removing?: boolean; onClick?: () => void }

export const OrganizationMember: React.FC<Props> = ({ member, removing, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <ListItem key={member.user.email} dense>
      <ListItemIcon>
        <Avatar email={member.user.email} size={spacing.lg} />
      </ListItemIcon>
      <ListItemText
        primary={member.user.email}
        secondary={
          <>
            Added <Duration startDate={member?.created} ago />
          </>
        }
      />
      <ListItemSecondaryAction>
        <TextField select size="small" value={member.license} onChange={e => console.log(e.target.value)}>
          <MenuItem dense value="LICENSED">
            Licensed
          </MenuItem>
          <MenuItem dense value="UNLICENSED">
            Unlicensed
          </MenuItem>
        </TextField>
        {/* <Chip label={member.license} size="small" /> */}
        <Chip label={ROLE[member.role]} size="small" />
        <ConfirmButton
          confirm
          confirmMessage="This will remove all access to this organization’s devices."
          confirmTitle="Are you sure?"
          title="Remove Account"
          icon="times"
          size="sm"
          color={removing ? 'danger' : undefined}
          loading={removing}
          disabled={!onClick || removing}
          onClick={() => {
            onClick && onClick()
            dispatch.organization.removeMember(member)
          }}
        />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

// class="MuiInputBase-root MuiInput-root MuiInput-underline MuiInputBase-formControl MuiInput-formControl MuiInputBase-marginDense MuiInput-marginDense"
// class="MuiInputBase-root MuiInput-root MuiInput-underline MuiInputBase-formControl MuiInput-formControl"
