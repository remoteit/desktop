import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Box, BoxProps, ListItemText } from '@mui/material'
import { selectOrganization } from '../selectors/organizations'
import { selectActiveUser } from '../selectors/accounts'
import { Avatar } from '../components/Avatar'

type Props = BoxProps & { accountId?: string; avatarSize?: number }

export const OrganizationIndicator: React.FC<Props> = ({ accountId, avatarSize, ...props }) => {
  const organization = useSelector((state: State) => selectOrganization(state, accountId))
  const owner = useSelector((state: State) => selectActiveUser(state, accountId))
  return (
    <Box display="flex" {...props}>
      <Avatar email={owner.email} fallback={organization.name} size={avatarSize} inline />
      <ListItemText primary={organization.name || 'Personal'} secondary="Organization" />
    </Box>
  )
}
