import { Box, Typography } from '@mui/material'
import React from 'react'
import { Icon } from '../Icon'
import { fontSize, colors } from '../../styles/variables'

export type LoadingMessageProps = {
  message?: string
}

export function LoadingMessage({ message = 'Loading...', ...props }: LoadingMessageProps): JSX.Element {
  return (
    <Box {...props}>
      <Box component="div" fontSize={fontSize.xxl} p={1} mr={1}>
        <Icon name="spinner-third" spin />
      </Box>
      <Typography variant="body2">{message}</Typography>
    </Box>
  )
}
