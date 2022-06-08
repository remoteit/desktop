import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Box, useMediaQuery, ListItemSecondaryAction } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { LicenseSelect } from './LicenseSelect'
import { RoleSelect } from './RoleSelect'
import { Duration } from './Duration'
import { spacing } from '../styling'
import { Avatar } from './Avatar'

type Props = {
  member: IOrganizationMember
  roles?: IOrganizationRole[]
  freeLicenses?: boolean
  enterprise?: boolean
  disabled?: boolean
}

export const OrganizationMember: React.FC<Props> = ({ member, roles = [], freeLicenses, enterprise, disabled }) => {
  const hideActions = useMediaQuery(`(max-width:400px)`)
  const dispatch = useDispatch<Dispatch>()
  return (
    <ListItemLocation
      dense
      disabled={disabled}
      key={member.user.id}
      pathname={`/organization/members/${member.user.id}`}
      icon={<Avatar email={member.user.email} size={28} />}
      title={member.user.email}
      subtitle={
        <>
          Added <Duration startDate={member?.created} ago />
        </>
      }
    >
      {hideActions || (
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
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}
