import React from 'react'
import { Icon, IconProps } from './Icon'
import { spacing } from '../styling'

type Props = IconProps & { open?: boolean }

export const ExpandIcon: React.FC<Props> = ({ open, ...props }) => {
  return (
    <Icon
      styles={{
        marginLeft: `${spacing.sm}px`,
        transformOrigin: 'center',
        transition: 'transform 300ms, margin-bottom 300ms',
      }}
      rotate={open ? 0 : -90}
      color="grayDarker"
      name="caret-down"
      type="solid"
      size="sm"
      fixedWidth
      {...props}
    />
  )
}
