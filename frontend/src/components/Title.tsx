import React from 'react'
import { Box } from '@mui/material'
import { spacing } from '../styling'

interface TitleProps {
  inline?: boolean
  enabled?: boolean
  offline?: boolean
  className?: string
  children?: React.ReactNode
}

export function Title({ children, inline, enabled, offline, className }: TitleProps) {
  return (
    <Box
      component="span"
      className={className}
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
      }}
    >
      {children}
    </Box>
  )
}
