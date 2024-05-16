import React from 'react'
import { Icon, IconProps } from '../components/Icon'
import { Box } from '@mui/material'

type Props = IconProps & {
  strength: number
}

export const SignalIcon: React.FC<Props> = ({ strength, ...props }) => {
  let icon

  if (strength >= -50) {
    icon = 'signal-bars'
  } else if (strength >= -60) {
    icon = 'signal-bars-good'
  } else if (strength >= -70) {
    icon = 'signal-bars-fair'
  } else {
    icon = 'signal-bars-weak'
  }

  return (
    <Box position="relative" component="span">
      <Box position="absolute" component="span">
        <Icon name={icon} {...props} color="primary" />
      </Box>
      <Icon name="signal-bars" {...props} color="grayLight" />
    </Box>
  )
}
