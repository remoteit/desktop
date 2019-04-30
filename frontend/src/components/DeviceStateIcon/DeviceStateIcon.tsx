import React from 'react'
import { Icon } from '../Icon'
import { Props as IconProps } from '../Icon/Icon'
import { DeviceState, ServiceState } from 'remote.it'

export interface Props extends Partial<IconProps> {
  state: DeviceState | ServiceState
}

export function DeviceStateIcon({ state, ...props }: Props) {
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
  } else if (state === 'restricted') {
    icon = 'times-circle'
    color = 'danger'
  }

  return <Icon {...props} name={icon} color={color} />
}
