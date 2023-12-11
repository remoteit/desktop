import React from 'react'
import { IconButton, ButtonProps } from './IconButton'

export const ShareButton: React.FC<ButtonProps> = ({ icon, children, ...props }) => {
  return (
    <IconButton icon={icon || 'share'} {...props}>
      {children}
    </IconButton>
  )
}
