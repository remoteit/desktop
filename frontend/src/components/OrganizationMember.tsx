import React from 'react'
import { Dispatch } from '../store'
import { Chip, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Duration } from './Duration'
import { Icon } from './Icon'
import { ROLE } from '../models/organization'

type Props = { member: IOrganizationMember; removing?: boolean; onClick: () => void }

export const OrganizationMember: React.FC<Props> = ({ member, removing, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <ListItem key={member.user.email} dense>
      <ListItemIcon>
        <Icon name="user" />
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
        <Chip label={ROLE[member.role]} size="small" />
        <IconButton
          title="Remove Account"
          icon="times"
          color={removing ? 'danger' : undefined}
          loading={removing}
          disabled={member.role === 'OWNER' || removing}
          onClick={() => {
            onClick()
            dispatch.organization.removeMember(member)
          }}
        />
      </ListItemSecondaryAction>
    </ListItem>
  )
}
