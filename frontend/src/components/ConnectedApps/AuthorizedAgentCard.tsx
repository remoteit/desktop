import React, { useState } from 'react'
import { Avatar, Box, Chip, ListItem, ListItemAvatar, ListItemText, Stack, Typography, Button } from '@mui/material'
import { useSelector } from 'react-redux'
import { State } from '../../store'
import { Timestamp } from '../Timestamp'
import { Icon } from '../Icon'
import { RevokeAgentDialog } from './RevokeAgentDialog'
import { AgentReachDialog } from './AgentReachDialog'

// Friendly labels for the device-capability scopes an agent may hold.
const CAPABILITY_LABEL: { [scope: string]: string } = {
  'device:read': 'View devices',
  'device:write': 'Manage devices',
  'device:connect': 'Connect',
  'device:execute': 'Run scripts',
  'user:read': 'View account',
  'org:read': 'View organization',
}

function reachSummary(reach?: IAgentReach): string {
  if (!reach || (reach.accounts == null && reach.tags == null)) return 'Can reach all your devices'
  const parts: string[] = []
  if (reach.accounts) parts.push(`${reach.accounts.length} account${reach.accounts.length === 1 ? '' : 's'}`)
  if (reach.tags) parts.push(`tags ${reach.tags.join(', ')} (${reach.tagOperator === 'ALL' ? 'all' : 'any'})`)
  return `Limited to ${parts.join(' and ')}`
}

export const AuthorizedAgentCard: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const [reachOpen, setReachOpen] = useState(false)
  const updating = useSelector((state: State) => state.agents.updating === agent.clientId)
  const name = agent.clientName || agent.clientId
  const monogram = (name.trim()[0] || '?').toUpperCase()
  const limited = !!(agent.reach && (agent.reach.accounts != null || agent.reach.tags != null))

  return (
    <ListItem alignItems="flex-start" disableGutters>
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
                  <Chip key={scope} size="small" label={CAPABILITY_LABEL[scope] || scope} sx={{ mr: 0.5, mb: 0.5 }} />
                ))
              ) : (
                <Typography variant="caption" color="textSecondary">
                  Sign-in only
                </Typography>
              )}
            </Box>
            <Typography variant="caption" color="textSecondary" display="block">
              <Icon name={limited ? 'lock' : 'globe'} size="xxs" inlineLeft />
              {reachSummary(agent.reach)}
            </Typography>
            {agent.grantedAt && (
              <Typography variant="caption" color="textSecondary" display="block">
                Authorized <Timestamp date={new Date(agent.grantedAt)} variant="long" />
              </Typography>
            )}
          </>
        }
      />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
        {updating && <Icon name="spinner-third" spin color="gray" />}
        <Button size="small" onClick={() => setReachOpen(true)} disabled={updating}>
          Limit
        </Button>
        <RevokeAgentDialog agent={agent} />
      </Stack>
      <AgentReachDialog agent={agent} open={reachOpen} onClose={() => setReachOpen(false)} />
    </ListItem>
  )
}
