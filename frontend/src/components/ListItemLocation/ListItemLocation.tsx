import React from 'react'
import { useHistory, useLocation, matchPath } from 'react-router-dom'
import { makeStyles, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from '../Icon'
import { colors, Color } from '../../styling'

export type Props = {
  pathname: string
  title?: React.ReactElement | string
  subtitle?: string
  icon?: string
  iconColor?: Color
  disabled?: boolean
  dense?: boolean
  className?: string
  match?: string | string[]
  exactMatch?: boolean
}

export const ListItemLocation: React.FC<Props> = ({
  pathname,
  title,
  subtitle,
  icon,
  iconColor,
  disabled = false,
  match,
  exactMatch,
  children,
  ...props
}) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()

  if (!match) match = pathname
  if (typeof match === 'string') match = [match]
  const matches = match?.find(s => (exactMatch ? location.pathname === s : location.pathname.includes(s)))

  const onClick = () => !disabled && history.push(pathname)
  return (
    <ListItem
      {...props}
      button
      selected={!!matches}
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: 1 }}
      classes={{ selected: css.selected }}
    >
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

const useStyles = makeStyles({
  selected: {
    '&.Mui-selected': { backgroundColor: colors.primaryHighlight },
    '&.Mui-selected:hover': { backgroundColor: colors.primaryLighter },
  },
})
