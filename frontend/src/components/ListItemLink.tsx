import React from 'react'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { windowOpen } from '../services/Browser'
import { colors } from '../styling'
import { Icon } from './Icon'

export type Props = {
  href: string
  title?: React.ReactElement | string
  subtitle?: string
  icon?: string
  dense?: boolean
  className?: string
}

export const ListItemLink: React.FC<Props> = ({ href, title, subtitle, icon, children, ...props }) => {
  const onClick = () => windowOpen(href)

  return (
    <ListItem {...props} button onClick={onClick}>
      {icon && (
        <ListItemIcon>
          <Icon name={icon} size="md" fixedWidth />
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
      <Icon name="launch" size="sm" color={colors.grayDark} fixedWidth />
    </ListItem>
  )
}
