import React from 'react'
import { useHistory } from 'react-router-dom'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from '../Icon'

export type Props = {
  pathname: string
  title?: string
  subtitle?: string
  icon?: string
  disabled?: boolean
  className?: string
}

export const ListItemLocation: React.FC<Props> = ({
  pathname,
  title,
  subtitle,
  icon,
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
          <Icon name={icon} size="md" fixedWidth />
        </ListItemIcon>
      )}
      {title && <ListItemText primary={title} secondary={subtitle} />}
      {children}
    </ListItem>
  )
}
