import React from 'react'
import { Box, Typography } from '@material-ui/core'
import { BoxProps } from '@material-ui/core/Box'

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
