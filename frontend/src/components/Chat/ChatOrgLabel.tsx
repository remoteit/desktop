import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { resolveChatOrg } from '../../models/chat'

/* Read-only display of the org the agent is scoped to. The chat follows the
   app's active org (the sidebar org selector); the popout window shows the
   org handed off with the conversation. Resolved by the same lookup send()
   uses, so the label and the org sent to the agent can never disagree. */
export const ChatOrgLabel: React.FC = () => {
  const { t } = useTranslation()
  const org = useSelector(resolveChatOrg, (a, b) => a?.id === b?.id && a?.name === b?.name)
  const orgName = org ? org.name || t('chat.organization', 'Organization') : t('chat.personal', 'Personal')

  return (
    <Box sx={{ paddingX: 2, paddingBottom: 1 }}>
      <Typography variant="h5" color="grayDark.main">
        {t('chat.currentOrg', 'Current Org')}
      </Typography>
      <Typography variant="body2">{orgName}</Typography>
    </Box>
  )
}
