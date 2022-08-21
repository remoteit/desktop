import React from 'react'
import { Box, Typography } from '@mui/material'
import { BoxProps } from '@mui/material/Box'

export interface TextBlockProps extends BoxProps {
  children: React.ReactNode
}

export function TextBlock({ children, ...props }: TextBlockProps): JSX.Element {
  return (
    <Box my={3} {...props}>
      <Typography>{children}</Typography>
    </Box>
  )
}
