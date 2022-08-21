import React from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'
import { Link as MUILink, LinkProps as MuiLinkProps } from '@mui/material'

export type LinkProps = Omit<RouterLinkProps, 'to'> &
  MuiLinkProps & {
    to?: string
  }

export const Link = React.forwardRef<any, LinkProps>(({ children, ...props }, ref) => {
  let attributes = { ...props }
  if (attributes.href?.startsWith('http')) {
    attributes.target = '_blank'
    attributes.rel = 'noopener'
  }

  if (attributes.to) attributes.component = RouterLink

  return (
    <MUILink {...attributes} ref={ref}>
      {children}
    </MUILink>
  )
})
