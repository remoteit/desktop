import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Box, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { LicenseSelect } from './LicenseSelect'
import { RoleSelect } from './RoleSelect'
import { Duration } from './Duration'
import { spacing } from '../styling'
import { Avatar } from './Avatar'

type Props = {
  member: IOrganizationMember
  roles?: IOrganizationRole[]
  freeLicenses?: boolean
  removing?: boolean
  enterprise?: boolean
  onClick?: () => void
}

export const OrganizationMember: React.FC<Props> = ({
  member,
  roles = [],
  freeLicenses,
  removing,
  enterprise,
  onClick,
}) => {
  const dispatch = useDispatch<Dispatch>()

  return (
    <ListItem key={member.user.email} dense>
      <ListItemIcon>
        <Avatar email={member.user.email} size={28} />
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
        <RoleSelect
          roles={roles}
          roleId={member.roleId}
          license={member.license}
          onSelect={(roleId: string) => dispatch.organization.setMembers([{ ...member, roleId }])}
        />
        {!enterprise && (
          <Box width={120} display="inline-block" textAlign="right" marginRight={`${spacing.md}px`}>
            <LicenseSelect member={member} disabled={!freeLicenses} />
          </Box>
        )}
        <ConfirmButton
          confirm
          confirmMessage="This will remove the user's access to all the organization’s devices"
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
