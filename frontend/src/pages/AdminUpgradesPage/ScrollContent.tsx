import React from 'react'
import { Box } from '@mui/material'

/* A scroll surface's content as one element. Body, with horizontalOverflow, gives its first child of each element type a
   min-height of 100.1% (to force the scrollbar): with several children — a list's subheader, then its sections — each
   first one took the whole height and the rest scrolled out of sight, so the page looked empty under its headings. */
export const ScrollContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box data-scroll-content>{children}</Box>
)
