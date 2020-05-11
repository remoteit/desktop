import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { IService, IDevice } from 'remote.it'
import { makeStyles } from '@material-ui/styles'
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

  let icon = 'question-circle'
  let colorName: Color = 'warning'
  let element: any

  state = state || (service ? service.state : 'unknown')

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
          <Icon name={icon} color={colorName} spin={state === 'connecting'} size="sm" weight="regular" fixedWidth />
        </sup>
      </span>
    )
  else element = <Icon {...props} name={icon} color={colorName} spin={state === 'connecting'} fixedWidth />

  return <Tooltip title={mini && service ? `${service.name} - ${state}` : state}>{element}</Tooltip>
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
