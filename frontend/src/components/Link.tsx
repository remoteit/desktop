import React from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'
import { Link as MUILink, LinkProps as MuiLinkProps } from '@mui/material'

export type LinkProps = Omit<RouterLinkProps, 'to'> &
  MuiLinkProps & {
    to?: string
  }

export const Link = React.forwardRef<any, LinkProps>(({ children, ...props }, ref) => {
  if (props.href?.startsWith('http')) {
    props.target = '_blank'
    props.rel = 'noopener'
  }

  if (props.to) props.component = RouterLink

  return (
    <MUILink {...props} ref={ref}>
      {children}
    </MUILink>
  )
})
