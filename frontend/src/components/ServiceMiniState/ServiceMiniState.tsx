import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Tooltip, IconButton } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'
import { Icon } from '../Icon'

interface Props {
  connection?: IConnection
  service?: IService
  pathname: string
  disabled?: boolean
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, pathname, disabled }) => {
  const history = useHistory()
  const css = useStyles()

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'
  let title = state
  let sessions = service?.sessions?.length

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

  if (service) {
    title = (
      <>
        {service.name}
        <br />
        {sessions ? `${sessions} connected` : state}
      </>
    )
  }

  return (
    <Tooltip title={title}>
      <span>
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
      </span>
    </Tooltip>
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
