import React from 'react'
import { Link as RRLink, LinkProps as RRLinkProps } from 'react-router-dom'
import { Link as MUILink, LinkProps as MuiLinkProps } from '@mui/material'

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  // = MuiLinkProps &  RRLinkProps & {
  href?: string
  rel?: string
  target?: string
  to?: string
  children?: React.ReactNode
}

export function Link({ href, rel, target, to, children, ...props }: LinkProps): JSX.Element {
  if (href?.startsWith('http') || href?.startsWith('https')) {
    target = '_blank'
    rel = 'noopener noreferrer'
  }

  const p = props as any

  if (!to)
    return (
      <MUILink {...p} href={href} rel={rel} target={target}>
        {children}
      </MUILink>
    )

  return (
    <RRLink {...p} to={to}>
      {children}
    </RRLink>
  )
}
