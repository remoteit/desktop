import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { ListItem, ListItemIcon, ListItemText, Badge } from '@material-ui/core'
import { Icon } from '../Icon'
import { Color } from '../../styling'

export type Props = {
  pathname: string
  title?: React.ReactElement | string
  subtitle?: string
  icon?: string
  iconColor?: Color
  disabled?: boolean
  showDisabled?: boolean
  dense?: boolean
  className?: string
  match?: string | string[]
  exactMatch?: boolean
  badge?: number
}

export const ListItemLocation: React.FC<Props> = ({
  pathname,
  title,
  subtitle,
  icon,
  iconColor,
  disabled,
  showDisabled,
  match,
  exactMatch,
  badge,
  children,
  ...props
}) => {
  const history = useHistory()
  const location = useLocation()

  if (!match) match = pathname
  if (typeof match === 'string') match = [match]
  const matches = match?.find(s => (exactMatch ? location.pathname === s : location.pathname.includes(s)))

  const onClick = () => !disabled && history.push(pathname)
  const iconEl = icon && <Icon name={icon} size="md" color={iconColor} fixedWidth />

  return (
    <ListItem
      {...props}
      button
      selected={!!matches}
      onClick={onClick}
      disabled={disabled || !!matches}
      style={showDisabled ? undefined : { opacity: 1 }}
    >
      {icon && (
        <ListItemIcon>
          {badge ? (
            <Badge variant={badge > 1 ? undefined : 'dot'} badgeContent={badge} color="error">
              {iconEl}
            </Badge>
          ) : (
            iconEl
          )}
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
    </ListItem>
  )
}
