import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon, IconProps } from '../components/Icon/Icon'
import { Color, FontSize, spacing } from '../styling'

type Props = IconProps & {
  title?: string
  icon: string
  disabled?: boolean
  to?: string
  className?: string
  shiftDown?: boolean
  loading?: boolean
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton: React.FC<Props> = ({
  title,
  icon,
  disabled,
  to,
  shiftDown,
  size = 'base',
  className,
  loading,
  onMouseEnter,
  onMouseLeave,
  onClick,
  children,
  ...props
}) => {
  const history = useHistory()
  if (loading) {
    icon = 'spinner-third'
    props.spin = true
  }
  const clickHandler = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
    if (to) history.push(to)
  }
  const button = (
    <MuiIconButton
      onClick={clickHandler}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      className={className}
      style={{ opacity: disabled ? 0.5 : undefined, marginBottom: shiftDown ? -spacing.sm : undefined }}
    >
      <Icon {...props} name={icon} size={size} fixedWidth />
    </MuiIconButton>
  )

  return disabled || !title ? button : <Tooltip title={title}>{button}</Tooltip>
}
