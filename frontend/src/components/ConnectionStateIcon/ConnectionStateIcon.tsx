import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { colors, spacing, Color } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService | IDevice
  state?: ConnectionState
  mini?: boolean
}

export function ConnectionStateIcon({ connection, service, state, mini, ...props }: ConnectionStateIconProps) {
  const css = useStyles()

  let icon = 'question-circle'
  let colorName: Color = 'warning'

  state = state || service?.state

  if (connection) {
    if (connection.pid && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
  }

  switch (state) {
    case 'active':
      icon = 'check-circle'
      colorName = 'success'
      break
    case 'inactive':
      icon = 'minus-circle'
      colorName = 'grayLight'
      break
    case 'connected':
      icon = 'scrubber'
      colorName = 'primary'
      break
    case 'connecting':
      icon = 'spinner-third'
      colorName = 'grayLight'
      break
    case 'restricted':
      icon = 'times-circle'
      colorName = 'danger'
      break
    case 'unknown':
      icon = 'question-circle'
      colorName = 'grayLight'
  }

  return (
    <Tooltip title={mini && service ? `${service.name} - ${state}` : state || 'unknown'}>
      {mini ? (
        <span className={css.mini}>
          <span style={{ backgroundColor: colors[colorName] }} />
        </span>
      ) : (
        <Icon {...props} name={icon} color={colorName} spin={state === 'connecting'} fixedWidth />
      )}
    </Tooltip>
  )
}

const useStyles = makeStyles({
  mini: {
    // display: 'inline-block',

    '& > span': {
      height: 4,
      borderRadius: 4,
      width: spacing.md,
      display: 'inline-block',
      marginLeft: spacing.xxs,
    },
  },
})
