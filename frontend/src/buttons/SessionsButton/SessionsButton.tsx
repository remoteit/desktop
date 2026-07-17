import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import { IconButton, Typography } from '@mui/material'
import { selectSessionsByService } from '../../models/sessions'
import { State } from '../../store'
import { SessionsTooltip } from '../../components/SessionsTooltip'
import { spacing } from '../../styling'
import { Icon } from '../../components/Icon'

interface Props {
  service?: IService
}

export const SessionsButton: React.FC<Props> = ({ service }) => {
  const sessions = useSelector((state: State) => selectSessionsByService(state, service?.id))
  const history = useHistory()
  const location = useLocation()

  if (!sessions.length) return null

  return (
    <SessionsTooltip service={service} sessions={sessions}>
      <IconButton
        color="primary"
        onClick={() => history.push(`${location.pathname}/${service?.id}/users`)}
        size="large"
      >
        <Icon name="user" size="md" />
        <Typography
          sx={{ marginLeft: `${spacing.xs}px`, color: 'primary.main' }}
          variant="caption"
          color="textPrimary"
        >
          {sessions.length}
        </Typography>
      </IconButton>
    </SessionsTooltip>
  )
}
