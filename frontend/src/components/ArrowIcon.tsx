import React from 'react'
import { Icon, IconProps } from './Icon'

export const ArrowIcon: React.FC<IconProps> = props => {
  return <Icon name="angle-down" size="sm" type="solid" {...props} />
}
