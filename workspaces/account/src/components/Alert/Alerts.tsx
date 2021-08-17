import classNames from 'classnames'
import React, { ReactNode, useState, useEffect } from 'react'
import { Icon } from '../Icon'
import { IconButton, makeStyles } from '@material-ui/core'
import { Alert } from '@remote.it/components'

export interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'size'> {
  children: ReactNode
  className?: string
  variant?: 'default' | 'inverted' | 'outlined'
  onClose?: () => void
  size?: 'sm' | 'md'
  stayOpen?: boolean
  timeout?: number
  type?: 'success' | 'info' | 'warning' | 'danger' | 'muted'
  icon?: 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'none'
  id?: string
}

export function Alerts({
  children,
  className,
  icon,
  variant = 'default',
  onClose,
  size = 'md',
  stayOpen = false,
  type = 'danger',
  timeout,
  ...props
}: Props): JSX.Element {

  icon = icon || type

  let iconKey = 'exclamation-triangle'
  if (icon === 'warning') iconKey = 'exclamation-circle'
  if (icon === 'success') iconKey = 'check'
  if (icon === 'info') iconKey = 'info-circle'
  if (icon === 'muted') iconKey = 'info-circle'


  return (
   
    <>
      <Alert
          variant={variant}
          icon={iconKey}
          type={type}
        >
          {children}
        </Alert>
    </>
    
  )
}


const useStyles = makeStyles({
  danger: {
    background: 'var(--color-danger)',
  }
})