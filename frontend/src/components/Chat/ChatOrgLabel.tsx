import React from 'react'
import { useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { State } from '../../store'

/* Read-only display of the org the agent is scoped to. The chat follows the
   app's active org (the sidebar org selector); the popout window shows the
   org handed off with the conversation. */
export const ChatOrgLabel: React.FC = () => {
  const orgId = useSelector((state: State) => state.chat.orgId)
  const userId = useSelector((state: State) => state.user.id)
  const memberships = useSelector((state: State) => state.accounts.membership)
  const organizations = useSelector((state: State) => state.organization.accounts)

  const orgName =
    !orgId || orgId === userId
      ? 'Personal'
      : (organizations[orgId]?.name || memberships.find(m => m.account.id === orgId)?.name || '').trim() ||
        'Organization'

  return (
    <Box sx={{ paddingX: 2, paddingBottom: 1 }}>
      <Typography variant="h5" color="grayDark.main">
        Current Org
      </Typography>
      <Typography variant="body2">{orgName}</Typography>
    </Box>
  )
}
