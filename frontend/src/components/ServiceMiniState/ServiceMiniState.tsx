import React from 'react'
import { IUser } from 'remote.it'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { IconButton } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'
import { SessionsTooltip } from '../SessionsTooltip'
import { Icon } from '../Icon'

const MAX_SESSIONS_DISPLAY = 3

interface Props {
  connection?: IConnection
  service?: IService
  pathname: string
  disabled?: boolean
  user?: IUser
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, pathname, disabled, user }) => {
  const history = useHistory()
  const css = useStyles()

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'
  let sessions = service?.sessions?.reduce((count, session) => {
    return session.email === user?.email ? count : ++count
  }, 0)

  if (connection) {
    if (connection.pid && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
  }

  switch (state) {
    case 'active':
      colorName = 'success'
      break
    case 'inactive':
      colorName = 'grayLight'
      break
    case 'connected':
      colorName = 'primary'
      break
    case 'connecting':
      colorName = 'grayLight'
      break
    case 'restricted':
      colorName = 'danger'
      break
    case 'unknown':
      colorName = 'grayLight'
  }

  return (
    <SessionsTooltip service={service} user={user} label>
      <IconButton
        className={sessions ? css.icon : css.button}
        onClick={() => history.push(pathname)}
        disabled={disabled}
      >
        {sessions ? (
          <Icon name="user" weight="solid" size="xs" color={colorName} fixedWidth />
        ) : (
          <span className={css.indicator} style={{ backgroundColor: colors[colorName] }} />
        )}
      </IconButton>
    </SessionsTooltip>
  )
}

const useStyles = makeStyles({
  button: { padding: '8px 0' },
  icon: { padding: '0 0 8px' },
  indicator: {
    height: 2,
    borderRadius: 2,
    width: spacing.sm,
    display: 'inline-block',
    marginLeft: 2,
    marginRight: 2,
  },
})
