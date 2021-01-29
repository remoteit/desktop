import React from 'react'
import { useHistory } from 'react-router-dom'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from '../Icon'
import { Color } from '../../styling'

export type Props = {
  pathname: string
  title?: string
  subtitle?: string
  icon?: string
  iconColor?: Color
  disabled?: boolean
  dense?: boolean
  className?: string
}

export const ListItemLocation: React.FC<Props> = ({
  pathname,
  title,
  subtitle,
  icon,
  iconColor,
  disabled = false,
  children,
  ...props
}) => {
  const history = useHistory()
  const onClick = () => !disabled && history.push(pathname)
  return (
    <ListItem {...props} button onClick={onClick} disabled={disabled} style={{ opacity: 1 }}>
      {icon && (
        <ListItemIcon>
          <Icon name={icon} size="md" color={iconColor} fixedWidth />
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
    </ListItem>
  )
}
