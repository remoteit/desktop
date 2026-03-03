import React from 'react'
import { IDeviceProduct } from '../models/products'
import { ColorChip, Props as ColorChipProps } from './ColorChip'
import { Icon } from './Icon'

type Props = Omit<ColorChipProps, 'label' | 'color' | 'variant' | 'icon'> & {
  status?: IDeviceProduct['status']
}

export const ProductStatusChip: React.FC<Props> = ({ status, ...props }) => {
  const locked = status === 'LOCKED'

  return (
    <ColorChip
      {...props}
      size={props.size || 'small'}
      label={locked ? 'Locked' : 'Draft'}
      color={locked ? 'primary' : 'grayDark'}
      variant={locked ? 'contained' : 'text'}
      icon={<Icon name={locked ? 'lock' : 'pencil'} size="xs" />}
    />
  )
}
