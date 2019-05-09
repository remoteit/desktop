import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  state: ConnectionState
}

export function ConnectionStateIcon({
  state,
  ...props
}: ConnectionStateIconProps) {
  let icon = 'question-circle'
  let color: BrandColors = 'warning'
  if (state === 'active') {
    icon = 'check-circle'
    color = 'success'
  } else if (state === 'inactive') {
    icon = 'minus-circle'
    color = 'gray-light'
  } else if (state === 'connected') {
    icon = 'scrubber'
    color = 'primary'
  } else if (state === 'connecting') {
    icon = 'spinner-third'
    color = 'gray-light'
  } else if (state === 'restricted') {
    icon = 'times-circle'
    color = 'danger'
  }

  return (
    <Tooltip title={state}>
      <Icon
        {...props}
        name={icon}
        color={color}
        spin={state === 'connecting'}
        fixedWidth
      />
    </Tooltip>
  )
}
