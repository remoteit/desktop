import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { IService, IDevice } from 'remote.it'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService | IDevice
  state?: ConnectionState
}

export function ConnectionStateIcon({ connection, service, state, ...props }: ConnectionStateIconProps) {
  let icon = 'question-circle'
  let color: BrandColors = 'warning'

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
      color = 'gray-light'
      break
    case 'connected':
      icon = 'scrubber'
      color = 'primary'
      break
    case 'connecting':
      icon = 'spinner-third'
      color = 'gray-light'
      break
    case 'restricted':
      icon = 'times-circle'
      color = 'danger'
      break
    case 'unknown':
      icon = 'question-circle'
      color = 'gray-light'
  }

  return (
    <Tooltip title={state}>
      <Icon {...props} name={icon} color={color} spin={state === 'connecting'} fixedWidth />
    </Tooltip>
  )
}
