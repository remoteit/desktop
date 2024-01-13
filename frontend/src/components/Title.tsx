import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { spacing } from '../styling'

interface TitleProps extends BoxProps {
  inline?: boolean
  enabled?: boolean
  offline?: boolean
}

export function Title({ children, inline, enabled, offline, ...props }: TitleProps) {
  return (
    <Box
      {...props}
      component="span"
      sx={{
        display: 'block',
        flexGrow: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity: offline ? 0.4 : undefined,
        marginLeft: inline ? `${spacing.lg}px` : 0,
        color: enabled ? 'primary.main' : 'text.primary',
        '& sup': {
          lineHeight: 1,
          marginLeft: `${spacing.xs}px`,
          marginRight: `${spacing.xxs}px`,
          color: enabled ? 'primary.main' : 'grayDark.main',
        },
        ...props.sx,
      }}
    >
      {children}
    </Box>
  )
}
