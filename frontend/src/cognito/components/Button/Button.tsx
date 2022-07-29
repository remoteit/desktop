import { Button as MUIButton, ButtonProps as MUIButtonProps } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon'

export type ButtonProps = MUIButtonProps & {
  href?: string
  disabled?: boolean
  loading?: boolean
  rel?: string
  target?: string
  type?: 'submit' | 'button' | 'reset'
  to?: string
}

export function Button({
  children,
  color = 'primary',
  disabled = false,
  href,
  loading = false,
  rel,
  target,
  to,
  type = 'button',
  variant = 'contained',
  ...props
}: ButtonProps): JSX.Element {
  let elm: any = 'button'
  if (to) elm = Link
  if (href) elm = 'a'

  if (href?.startsWith('http') || href?.startsWith('https')) {
    target = '_blank'
    rel = 'noopener noreferrer'
  }

  return (
    <MUIButton
      color={color}
      component={elm}
      disabled={disabled || loading}
      href={href}
      rel={rel}
      target={target}
      to={to}
      type={type}
      variant={variant}
      {...props}
    >
      {children}
      {loading && <Icon name="spinner-third" spin inline />}
    </MUIButton>
  )
}
