import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { IconButton } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'
import { SessionsTooltip } from '../SessionsTooltip'
import { Icon } from '../Icon'

interface Props {
  connection?: IConnection
  service?: IService
  disabled?: boolean
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, disabled }) => {
  const history = useHistory()
  const css = useStyles()
  const connected = !!service?.sessions.length

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'

  if (connection) {
    if (connection.connecting && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  switch (state) {
    case 'error':
      colorName = 'danger'
      break
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
    <SessionsTooltip service={service} label>
      <IconButton
        className={connected ? css.icon : css.button}
        onClick={() => history.push(`/devices/${service?.deviceID}/${service?.id}${connected ? '/users' : ''}`)}
        disabled={disabled}
      >
        {connected ? (
          <Icon name="user" type="solid" size="xs" color={colorName} fixedWidth />
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
