import React from 'react'
import { useHistory } from 'react-router-dom'
import { useMatches } from '../hooks/useMatches'
import {
  SxProps,
  Theme,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material'
import { Sizes } from '../styling'
import { Icon } from './Icon'

export type ListItemLocationProps = {
  key?: React.Key
  to?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  iconTooltip?: string
  iconColor?: Color
  iconType?: IconType
  iconSize?: Sizes
  iconPlatform?: boolean
  disabled?: boolean
  showDisabled?: boolean
  disableGutters?: boolean
  disableIcon?: boolean
  dense?: boolean
  inset?: number
  className?: string
  menuItem?: boolean
  match?: string | string[]
  exactMatch?: boolean
  badge?: number
  sx?: SxProps<Theme>
  children?: React.ReactNode | React.ReactNode[]
  onClick?: (event: React.MouseEvent) => void
}

export const ListItemLocation: React.FC<ListItemLocationProps> = ({
  to,
  title,
  subtitle,
  icon,
  iconTooltip,
  iconColor,
  iconType,
  iconSize,
  iconPlatform,
  disabled,
  disableIcon,
  showDisabled,
  menuItem,
  match,
  exactMatch,
  inset,
  badge,
  className,
  children,
  ...props
}) => {
  const history = useHistory()
  const matches = useMatches({ to, match, exactMatch })

  const onClick = (event: React.MouseEvent) => {
    props.onClick?.(event)
    if (!disabled && to) history.push(to)
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

  const iconNode = iconTooltip ? (
    <Tooltip title={iconTooltip} placement="top" arrow>
      <span>
        {badge ? (
          <Badge variant={badge > 1 ? undefined : 'dot'} badgeContent={badge} color="error">
            {iconEl}
          </Badge>
        ) : (
          iconEl
        )}
      </span>
    </Tooltip>
  ) : badge ? (
    <Badge variant={badge > 1 ? undefined : 'dot'} badgeContent={badge} color="error">
      {iconEl}
    </Badge>
  ) : (
    iconEl
  )

  const Contents = (
    <>
      {icon && <ListItemIcon>{iconNode}</ListItemIcon>}
      {(title || subtitle) && <ListItemText primary={title} secondary={subtitle} />}
      {children}
    </>
  )

  let ItemProps = {
    ...props,
    onClick,
    disabled,
    className,
    selected: !!matches,
    sx: {
      paddingLeft: disableIcon ? 2 + (inset || 0) : inset,
      paddingRight: inset,
      ...props.sx,
    },
    style: showDisabled ? undefined : { opacity: 1 },
  }

  return menuItem ? (
    <MenuItem {...ItemProps}>{Contents}</MenuItem>
  ) : to || props.onClick ? (
    <ListItemButton {...ItemProps}>{Contents}</ListItemButton>
  ) : (
    <ListItem {...ItemProps}>{Contents}</ListItem>
  )
}
