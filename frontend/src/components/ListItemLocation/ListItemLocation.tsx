import React from 'react'
import classnames from 'classnames'
import { useHistory } from 'react-router-dom'
import { useMatches } from '../../hooks/useMatches'
import { MenuItem, ListItem, ListItemIcon, ListItemText, Badge } from '@mui/material'
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
  menuItem?: boolean
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
  menuItem,
  match,
  exactMatch,
  badge,
  className,
  children,
  ...props
}) => {
  const history = useHistory()
  const matches = useMatches({ to: pathname, match, exactMatch })
  const css = useStyles({ disableIcon: !!disableIcon })

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

  const Contents = (
    <>
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
    </>
  )

  let ItemProps = {
    ...props,
    onClick,
    disabled,
    className: classnames(css.root, className),
    selected: !!matches,
    style: showDisabled ? undefined : { opacity: 1 },
  }

  return menuItem ? (
    <MenuItem {...ItemProps}>{Contents}</MenuItem>
  ) : pathname ? (
    <ListItem {...ItemProps} button>
      {Contents}
    </ListItem>
  ) : (
    <ListItem {...ItemProps}>{Contents}</ListItem>
  )
}

type styleProps = { disableIcon: boolean }

const useStyles = makeStyles({
  root: ({ disableIcon }: styleProps) => ({ paddingLeft: disableIcon ? spacing.md : undefined }),
})
