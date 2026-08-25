import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { resolveChatOrg } from '../../models/chat'
import { Icon } from '../Icon'

/* Read-only display of the org the agent is scoped to — a slim line, since it is context,
   not the panel's headline. The chat follows the app's active org (the sidebar org
   selector); the popout window shows the org handed off with the conversation. Resolved by
   the same lookup send() uses, so the label and the org sent to the agent can never disagree. */
export const ChatOrgLabel: React.FC = () => {
  const { t } = useTranslation()
  const org = useSelector(resolveChatOrg, (a, b) => a?.id === b?.id && a?.name === b?.name)
  const orgName = org ? org.name || t('chat.organization', 'Organization') : t('chat.personal', 'Personal')

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, paddingX: 2, paddingBottom: 1, color: 'grayDark.main' }}>
      <Icon name={org ? 'building' : 'user'} size="xxs" type="solid" />
      <Typography variant="caption" noWrap>
        {t('chat.actingIn', 'Acting in {{org}}', { org: orgName })}
      </Typography>
    </Box>
  )
}
