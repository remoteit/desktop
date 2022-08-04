import React from 'react'
import { Box, Typography } from '@mui/material'
import { fontSizes } from '../../../styling'
import { Icon } from '../../../components/Icon'

export type LoadingMessageProps = {
  message?: string
}

export function LoadingMessage({ message = 'Loading...', ...props }: LoadingMessageProps): JSX.Element {
  return (
    <Box {...props}>
      <Box component="div" fontSize={fontSizes.xxl} p={1} mr={1}>
        <Icon name="spinner-third" spin />
      </Box>
      <Typography variant="body2">{message}</Typography>
    </Box>
  )
}
