import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { IconButton, Typography } from '@mui/material'
import { selectSessionsByService } from '../../models/sessions'
import { ApplicationState } from '../../store'
import { SessionsTooltip } from '../../components/SessionsTooltip'
import { spacing } from '../../styling'
import { Icon } from '../../components/Icon'

interface Props {
  service?: IService
}

export const SessionsButton: React.FC<Props> = ({ service }) => {
  const sessions = useSelector((state: ApplicationState) => selectSessionsByService(state, service?.id))
  const css = useStyles()
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
        <Typography className={css.label} variant="caption" color="textPrimary">
          {sessions.length}
        </Typography>
      </IconButton>
    </SessionsTooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  button: { padding: spacing.sm },
  label: { marginLeft: spacing.xs, color: palette.primary.main },
}))
