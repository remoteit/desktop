import React from 'react'
import { Box, BoxProps } from '@mui/material'

export type CenterProps = BoxProps & {
  children: React.ReactNode
}

export function Center({ children, ...props }: CenterProps): JSX.Element {
  return (
    <Box alignItems="center" display="flex" height="100%" justifyContent="center" {...props}>
      {children}
    </Box>
  )
}
