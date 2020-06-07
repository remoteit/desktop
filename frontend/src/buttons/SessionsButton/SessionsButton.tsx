import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { makeStyles, IconButton, Typography } from '@material-ui/core'
import { SessionsTooltip } from '../../components/SessionsTooltip'
import { spacing, colors } from '../../styling'
import { Icon } from '../../components/Icon'

interface Props {
  service?: IService
}

export const SessionsButton: React.FC<Props> = ({ service }) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()

  if (!service?.sessions.length) return null

  return (
    <SessionsTooltip service={service}>
      <IconButton color="primary" onClick={() => history.push(`${location.pathname}/${service?.id}/users`)}>
        <Icon name="user" weight="light" size="md" />
        <Typography className={css.label} variant="caption" color="textPrimary">
          {service?.sessions.length}
        </Typography>
      </IconButton>
    </SessionsTooltip>
  )
}

const useStyles = makeStyles({
  button: { padding: spacing.sm },
  label: { marginLeft: spacing.xs, color: colors.primary },
})
