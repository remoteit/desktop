import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon, IconProps } from '../components/Icon/Icon'
import { spacing } from '../styling'

export type ButtonProps = IconProps & {
  title?: string
  icon: string
  disabled?: boolean
  to?: string
  className?: string
  shiftDown?: boolean
  loading?: boolean
  submit?: boolean
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton: React.FC<ButtonProps> = ({
  title,
  icon,
  disabled,
  to,
  shiftDown,
  size = 'base',
  className,
  loading,
  submit,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
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
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      className={className}
      type={submit ? 'submit' : undefined}
      style={{ opacity: disabled ? 0.5 : undefined, marginBottom: shiftDown ? -spacing.sm : undefined }}
    >
      <Icon {...props} name={icon} size={size} fixedWidth />
    </MuiIconButton>
  )

  return disabled || !title ? button : <Tooltip title={title}>{button}</Tooltip>
}
