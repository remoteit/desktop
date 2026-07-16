import React from 'react'
import { useHistory } from 'react-router-dom'
import { Avatar, Box, Chip, ListItemButton, ListItemAvatar, ListItemText, Typography } from '@mui/material'
import { Timestamp } from '../Timestamp'
import { Icon } from '../Icon'
import { capabilityLabel, agentIsLimited, reachSummary, useAccountLabel } from './helpers'

// A rich, clickable summary row — the full breakdown + actions live on the detail page it links to.
export const AuthorizedAgentCard: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const history = useHistory()
  const accountLabel = useAccountLabel()
  const name = agent.clientName || agent.clientId
  const monogram = (name.trim()[0] || '?').toUpperCase()
  const limited = agentIsLimited(agent)

  return (
    <ListItemButton
      alignItems="flex-start"
      onClick={() => history.push(`/account/connected/${encodeURIComponent(agent.clientId)}`)}
    >
      <ListItemAvatar>
        <Avatar src={agent.logoUri} alt="">
          {monogram}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={name}
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            <Box mt={0.5} mb={0.5}>
              {agent.capabilities.length ? (
                agent.capabilities.map(scope => (
                  <Chip key={scope} size="small" label={capabilityLabel(scope)} sx={{ mr: 0.5, mb: 0.5 }} />
                ))
              ) : (
                <Typography variant="caption" color="textSecondary">
                  Sign-in only
                </Typography>
              )}
            </Box>
            {agent.audience.length > 0 && (
              <Typography variant="caption" color="textSecondary" display="block">
                Access: {agent.audience.map(a => a.label).join(', ')}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary" display="block">
              <Icon name={limited ? 'lock' : 'globe'} size="xxs" inlineLeft />
              {reachSummary(agent.reach, accountLabel)}
            </Typography>
            {agent.grantedAt && (
              <Typography variant="caption" color="textSecondary" display="block">
                Authorized <Timestamp date={new Date(agent.grantedAt)} variant="long" />
              </Typography>
            )}
          </>
        }
      />
      <Icon name="angle-right" color="grayDark" fixedWidth />
    </ListItemButton>
  )
}
