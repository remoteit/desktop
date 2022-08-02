import React from 'react'
import { Typography } from '@mui/material'

export type PageHeadingProps = {
  children: React.ReactNode
}

export function PageHeading({ children }: PageHeadingProps) {
  return <Typography variant="h2">{children}</Typography>
}
