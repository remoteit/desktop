import React from 'react'
import classnames from 'classnames'
import { useHistory } from 'react-router-dom'
import { useMatches } from '../../hooks/useMatches'
import { MenuItem, ListItem, ListItemIcon, ListItemText, Badge } from '@mui/material'
import { Color, Sizes, spacing } from '../../styling'
import { makeStyles } from '@mui/styles'
import { Icon } from '../Icon'

export type Props = {
  key?: React.Key
  to?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  iconColor?: Color
  iconType?: IconType
  iconSize?: Sizes
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
  children?: React.ReactNode | React.ReactNode[]
  onClick?: (event: React.MouseEvent) => void
}

export const ListItemLocation: React.FC<Props> = ({
  to,
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
  const matches = useMatches({ to, match, exactMatch })
  const css = useStyles({ disableIcon: !!disableIcon })

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
  ) : to || props.onClick ? (
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
