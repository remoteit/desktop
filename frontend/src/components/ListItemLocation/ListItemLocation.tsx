import React from 'react'
import classnames from 'classnames'
import { useHistory, useLocation } from 'react-router-dom'
import { ListItem, ListItemIcon, ListItemText, Badge } from '@mui/material'
import { Color, FontSize, spacing } from '../../styling'
import { makeStyles } from '@mui/styles'
import { Icon } from '../Icon'

export type Props = {
  pathname?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  iconColor?: Color
  iconType?: IconType
  iconSize?: FontSize
  iconPlatform?: boolean
  disabled?: boolean
  showDisabled?: boolean
  disableGutters?: boolean
  disableIcon?: boolean
  dense?: boolean
  className?: string
  match?: string | string[]
  exactMatch?: boolean
  badge?: number
  children?: React.ReactNode
  onClick?: () => void
}

export const ListItemLocation: React.FC<Props> = ({
  pathname,
  title,
  subtitle,
  icon,
  iconColor,
  iconType,
  iconSize,
  iconPlatform,
  disabled,
  disableIcon,
  showDisabled,
  match,
  exactMatch,
  badge,
  className,
  children,
  ...props
}) => {
  const history = useHistory()
  const location = useLocation()
  const css = useStyles({ disableIcon: !!disableIcon })

  if (!match) match = pathname
  if (typeof match === 'string') match = [match]
  const matches = match?.find(s => (exactMatch ? location.pathname === s : location.pathname.includes(s)))

  const onClick = () => {
    props.onClick?.()
    if (!disabled && pathname) history.push(pathname)
  }
  const iconEl =
    icon && typeof icon === 'string' ? (
      <Icon
        name={icon}
        size={iconSize || 'md'}
        color={iconColor}
        type={iconType}
        platformIcon={iconPlatform}
        fixedWidth
      />
    ) : (
      icon
    )

  return (
    <ListItem
      {...props}
      button
      className={classnames(css.root, className)}
      selected={!!matches}
      onClick={onClick}
      disabled={disabled}
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

type styleProps = { disableIcon: boolean }

const useStyles = makeStyles({
  root: ({ disableIcon }: styleProps) => ({ paddingLeft: disableIcon ? spacing.md : undefined }),
})
