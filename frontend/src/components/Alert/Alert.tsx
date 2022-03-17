import React from 'react'
import classnames from 'classnames'
import { IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
// import styles from './Alert.module.css'

/* 
@TODO

DEPRECATE THIS AND REPLACE WITH NOTICE
*/

export interface AlertProps {
  className?: string
  children: React.ReactNode
  closable?: boolean
  onClose?: () => void
  type?: 'danger' | 'warning' | 'info' | 'muted'
}

export function Alert({ closable = true, onClose, className = '', children, type = 'danger', ...props }: AlertProps) {
  const [closed, setClosed] = React.useState<boolean>(false)

  if (closed) return null

  const color = type === 'muted' ? 'gray' : type
  const classes = classnames(`df ai-center bg-${color} white rad-sm my-md px-md py-sm left`, className)

  let icon = 'exclamation-triangle'
  if (type === 'warning') icon = 'exclamation-circle'
  if (type === 'info') icon = 'info-circle'
  if (type === 'muted') icon = 'info-circle'

  return (
    <div className={classes} {...props}>
      <Icon name={icon} type="solid" className="mr-md" />
      {children}
      {closable && (
        <div className="ml-auto pl-md">
          <IconButton
            onClick={() => {
              setClosed(true)
              if (onClose) onClose()
            }}
          >
            <Icon name="times" size="sm" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
