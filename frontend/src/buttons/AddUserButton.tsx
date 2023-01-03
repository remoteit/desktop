import React from 'react'
import { IconButton, ButtonProps } from './IconButton'

export const AddUserButton: React.FC<ButtonProps> = ({ icon, children, ...props }) => {
  return (
    <IconButton icon={icon || 'share'} title="Share access" size="md" {...props}>
      {children}
    </IconButton>
  )
}
