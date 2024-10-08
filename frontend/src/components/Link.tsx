import React from 'react'
import browser, { windowOpen } from '../services/browser'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'
import { Link as MUILink, LinkProps as MuiLinkProps } from '@mui/material'

export type LinkProps = Omit<RouterLinkProps, 'to'> &
  MuiLinkProps & {
    to?: string
    noUnderline?: boolean
  }

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ children, noUnderline, ...props }, ref) => {
  const attributes = { ...props }
  if (attributes.href?.startsWith('http')) {
    attributes.target = '_blank'
    attributes.rel = 'noopener'
    if (browser.isMobile) {
      attributes.onClick = () => windowOpen(attributes.href, '_blank', true)
      attributes.href = undefined
    }
  }

  attributes.sx = { ...attributes.sx, cursor: 'pointer' }
  if (attributes.to) attributes.component = RouterLink

  return (
    <MUILink
      {...attributes}
      sx={{
        textDecoration: noUnderline ? 'none' : 'underline',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        ...attributes.sx,
      }}
      ref={ref}
    >
      {children || attributes.to || attributes.href}
    </MUILink>
  )
})
