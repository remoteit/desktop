import React from 'react'
import { ListItemButton, ListItemButtonProps, ListItemIcon, ListItemText } from '@mui/material'
import { Icon, IconProps } from './Icon'
import { windowOpen } from '../services/browser'

export type Props = ListItemButtonProps & {
  href: string
  title?: React.ReactNode
  subtitle?: string
  icon?: string
  iconProps?: IconProps
  badge?: number
}

export const ListItemLink: React.FC<Props> = ({
  href,
  title,
  subtitle,
  icon,
  iconProps,
  badge,
  onClick,
  children,
  ...props
}) => {
  const handleClick = event => {
    windowOpen(href, '_blank', true)
    onClick?.(event)
  }

  return (
    <ListItemButton {...props} onClick={handleClick}>
      {icon && (
        <ListItemIcon>
          <Icon name={icon} size="md" modified={!!badge} fixedWidth {...iconProps} />
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
      <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />
    </ListItemButton>
  )
}
