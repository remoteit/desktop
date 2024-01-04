import React from 'react'
import { ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { windowOpen } from '../services/Browser'
import { Icon } from './Icon'

export type Props = {
  href: string
  title?: React.ReactNode
  subtitle?: string
  icon?: string
  dense?: boolean
  badge?: number
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

export const ListItemLink: React.FC<Props> = ({ href, title, subtitle, icon, badge, onClick, children, ...props }) => {
  const handleClick = () => {
    windowOpen(href, '_blank', true)
    onClick?.()
  }

  return (
    <ListItem {...props} button onClick={handleClick}>
      {icon && (
        <ListItemIcon>
          <Icon name={icon} size="md" modified={!!badge} fixedWidth />
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
      <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />
    </ListItem>
  )
}
