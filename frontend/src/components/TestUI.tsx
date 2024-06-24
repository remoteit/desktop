import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Box, BoxProps } from '@mui/material'

export const TestUI: React.FC<BoxProps> = ({ children, ...props }) => {
  const { testUI } = useSelector((state: State) => state.ui)

  if (!testUI) return null

  if (testUI !== 'HIGHLIGHT') return children

  return (
    <Box title="test ui feature" bgcolor="test.main" {...props}>
      {children}
    </Box>
  )
}
