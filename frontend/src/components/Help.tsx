import React from 'react'
import { Box, Tooltip } from '@mui/material'
import { radius, spacing } from '../styling'

type Props = React.HTMLAttributes<HTMLDivElement> & { message: string; children: any }

export const Help: React.FC<Props> = ({ children, message, ...props }) => {
  return (
    <Tooltip title={message} placement="top" arrow>
      <Box
        component="span"
        {...props}
        sx={{
          fontWeight: 500,
          backgroundColor: 'primaryLighter.main',
          borderRadius: `${radius.sm}px`,
          padding: `0 ${spacing.xs}px 2px`,
        }}
      >
        {children}
      </Box>
    </Tooltip>
  )
}
