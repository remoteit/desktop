import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'
import { Color, FontSize, spacing } from '../styling'

type Props = {
  title?: string
  icon: string
  disabled?: boolean
  to?: string
  color?: Color
  className?: string
  type?: IconType
  size?: FontSize
  shiftDown?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton: React.FC<Props> = ({
  title,
  icon,
  disabled,
  to,
  color,
  type = 'regular',
  size = 'base',
  shiftDown,
  className,
  onClick,
  ...props
}) => {
  const history = useHistory()
  const clickHandler = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
    if (to) history.push(to)
  }
  const button = (
    <MuiIconButton
      onClick={clickHandler}
      disabled={disabled}
      className={className}
      style={{ opacity: disabled ? 0.5 : undefined, marginBottom: shiftDown ? -spacing.sm : undefined }}
    >
      <Icon {...props} name={icon} color={color} type={type} size={size} />
    </MuiIconButton>
  )

  return disabled || !title ? button : <Tooltip title={title}>{button}</Tooltip>
}
