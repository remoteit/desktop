import React from 'react'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { makeStyles, IconButton, Typography } from '@material-ui/core'
import { spacing } from '../../styling'
import { SessionsTooltip } from '../SessionsTooltip'
import { Icon } from '../Icon'

interface Props {
  service?: IService
}

export const SessionsIcon: React.FC<Props> = ({ service }) => {
  const user = useSelector((state: ApplicationState) => state.auth.user)
  const css = useStyles()

  if (!service?.sessions?.length) return null

  return (
    <SessionsTooltip service={service} user={user}>
      <IconButton>
        <Icon name="user" weight="light" size="md" />
        <Typography className={css.label} variant="caption" color="textPrimary">
          {service?.sessions?.length}
        </Typography>
      </IconButton>
    </SessionsTooltip>
  )
}

const useStyles = makeStyles({
  button: { padding: spacing.sm },
  label: { marginLeft: spacing.xs },
})

// import { Duration } from '../Duration'
// <Duration startTime={session.timestamp.getTime()} ago />
