import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { IService, IDevice } from 'remote.it'
import { Color } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService | IDevice
  state?: ConnectionState
}

export function ConnectionStateIcon({ connection, service, state, ...props }: ConnectionStateIconProps) {
  let icon = 'question-circle'
  let color: Color = 'warning'

  state = state || (service ? service.state : 'unknown')

  if (connection) {
    if (connection.pid && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
  }

  switch (state) {
    case 'active':
      icon = 'check-circle'
      color = 'success'
      break
    case 'inactive':
      icon = 'minus-circle'
      color = 'grayLight'
      break
    case 'connected':
      icon = 'scrubber'
      color = 'primary'
      break
    case 'connecting':
      icon = 'spinner-third'
      color = 'grayLight'
      break
    case 'restricted':
      icon = 'times-circle'
      color = 'danger'
      break
    case 'unknown':
      icon = 'question-circle'
      color = 'grayLight'
  }

  return (
    <Tooltip title={state}>
      <Icon {...props} name={icon} color={color} spin={state === 'connecting'} fixedWidth />
    </Tooltip>
  )
}
