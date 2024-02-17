import React from 'react'
import { ListItemButton, ListItemButtonProps, ListItemIcon, ListItemText } from '@mui/material'
import { windowOpen } from '../services/Browser'
import { Icon } from './Icon'

export type Props = ListItemButtonProps & {
  href: string
  title?: React.ReactNode
  subtitle?: string
  icon?: string
  badge?: number
}

export const ListItemLink: React.FC<Props> = ({ href, title, subtitle, icon, badge, onClick, children, ...props }) => {
  const handleClick = event => {
    windowOpen(href, '_blank', true)
    onClick?.(event)
  }

  return (
    <ListItemButton {...props} onClick={handleClick}>
      {icon && (
        <ListItemIcon>
          <Icon name={icon} size="md" modified={!!badge} fixedWidth />
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
      <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />
    </ListItemButton>
  )
}
