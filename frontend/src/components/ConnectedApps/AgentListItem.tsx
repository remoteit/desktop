import React from 'react'
import { ListItemIcon, ListItemText } from '@mui/material'
import { ListItemLocation } from '../ListItemLocation'
import { AgentAvatar } from './AgentAvatar'
import { Timestamp } from '../Timestamp'
import { spacing } from '../../styling'
import { reachSummary, useAccountLabel } from './helpers'

// One authorized app — a compact two-line row; the full breakdown and all
// actions live on the detail page it links to.
export const AgentListItem: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const accountLabel = useAccountLabel()
  const name = agent.clientName || agent.clientId

  return (
    <ListItemLocation to={`/account/connected/${encodeURIComponent(agent.clientId)}`} dense>
      <ListItemIcon>
        <AgentAvatar agent={agent} size={spacing.lg} />
      </ListItemIcon>
      <ListItemText
        primary={name}
        secondary={
          <>
            {reachSummary(agent.reach, accountLabel)}
            {' · '}
            {agent.lastActive ? (
              <>
                Active <Timestamp date={new Date(agent.lastActive)} variant="short" />
              </>
            ) : (
              'No activity yet'
            )}
          </>
        }
      />
    </ListItemLocation>
  )
}
