import React from 'react'
import { Box } from '@mui/material'

export const ScrollContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box data-scroll-content>{children}</Box>
)
