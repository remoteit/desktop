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
  thisDevice?: boolean
}

export function ConnectionStateIcon({
  connection,
  service,
  state,
  mini,
  thisDevice,
  ...props
}: ConnectionStateIconProps) {
  const css = useStyles()

  state = state || service?.state

  let icon = 'question-circle'
  let colorName: Color = 'warning'
  let element: any

  if (connection) {
    if (connection.active) state = 'connected'
    if (connection.connecting) state = 'connecting'
  }

  let name: string = state || 'unknown'

  switch (state) {
    case 'active':
      icon = 'check-circle'
      colorName = 'success'
      name = 'online'
      break
    case 'inactive':
      icon = 'minus-circle'
      colorName = 'grayLight'
      name = 'offline'
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

  if (mini)
    element = (
      <span className={css.mini}>
        <span style={{ backgroundColor: colors[colorName] }} />
      </span>
    )
  else if (thisDevice)
    element = (
      <span className={css.combo}>
        <Icon {...props} name="hdd" color="grayDarker" fixedWidth />
        <sup>
          <Icon name={icon} color={colorName} spin={state === 'connecting'} size="sm" type="regular" fixedWidth />
        </sup>
      </span>
    )
  else element = <Icon {...props} name={icon} color={colorName} spin={state === 'connecting'} fixedWidth />

  return <Tooltip title={name}>{element}</Tooltip>
}

const useStyles = makeStyles({
  mini: {
    '& > span': {
      height: 4,
      borderRadius: 4,
      width: spacing.md,
      display: 'inline-block',
      marginLeft: spacing.xxs,
    },
  },
  combo: {
    '& sup': {
      position: 'absolute',
      marginTop: -6,
      marginLeft: -8,
      backgroundColor: colors.white,
      borderRadius: '50%',
    },
  },
})
