import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Box, BoxProps, ListItemText } from '@mui/material'
import { selectOrganization } from '../selectors/organizations'
import { Avatar } from '../components/Avatar'

export const OrganizationIndicator: React.FC<BoxProps & { avatarSize?: number }> = ({ avatarSize, ...props }) => {
  const { organization } = useSelector((state: ApplicationState) => ({
    organization: selectOrganization(state),
  }))
  return (
    <Box display="flex" {...props}>
      <Avatar email={organization.account.email} fallback={organization.name} size={avatarSize} inline />
      <ListItemText primary={organization.name || 'Personal'} secondary="Organization" />
    </Box>
  )
}
