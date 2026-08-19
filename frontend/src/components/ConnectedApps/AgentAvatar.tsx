import React from 'react'
import { Avatar } from '@mui/material'
import { createColor } from '../../helpers/uiHelper'
import { labelLookup } from '../../models/labels'
import { spacing } from '../../styling'

type Props = {
  agent: IAuthorizedAgent
  size?: number
  inline?: boolean
}

// The agent's logo from its OAuth client metadata (logo_uri), loaded on demand, with a colored
// monogram fallback like user avatars. No per-app code — any client that registers a logo_uri
// renders automatically.
export const AgentAvatar: React.FC<Props> = ({ agent, size = 24, inline }) => {
  const name = agent.clientName || agent.clientId

  return (
    <Avatar
      alt={name}
      src={agent.logoUri || undefined}
      sx={theme => ({
        height: size,
        width: size,
        display: 'inline-flex',
        verticalAlign: 'middle',
        marginRight: inline ? `${spacing.sm}px` : undefined,
        fontSize: size * 0.625,
        fontFamily: 'Roboto Mono',
        color: theme.palette.alwaysWhite.main,
        backgroundColor: labelLookup[createColor(name)]?.color,
      })}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </Avatar>
  )
}
