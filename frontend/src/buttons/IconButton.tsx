import React from 'react'
import { useNavigate } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { Tooltip, TooltipProps, IconButton as MuiIconButton, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'
import { spacing } from '../styling'
import classnames from 'classnames'

export type ButtonProps = Omit<IconProps, 'title'> & {
  title?: React.ReactNode
  forceTitle?: boolean
  icon?: string
  name?: string
  disabled?: boolean
  hideDisableFade?: boolean
  to?: string
  buttonBaseSize?: 'small' | 'medium' | 'large'
  variant?: 'text' | 'contained'
  className?: string
  shiftDown?: boolean
  loading?: boolean
  submit?: boolean
  inline?: boolean
  placement?: TooltipProps['placement']
  children?: React.ReactNode
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton: React.FC<ButtonProps> = ({
  title,
  forceTitle,
  icon,
  name,
  disabled,
  hideDisableFade,
  to,
  color,
  variant,
  shiftDown,
  size = 'base',
  buttonBaseSize,
  inline,
  className,
  loading,
  submit,
  placement,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onClick,
  children,
  ...props
}) => {
  const navigate = useNavigate()
  const css = useStyles({ color })
  const contained = variant === 'contained'
  icon = icon || name
  if (loading) {
    icon = 'spinner-third'
    props.spin = true
  }
  const clickHandler = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
    if (to) navigate(to)
  }
  const button = (
    <MuiIconButton
      onClick={clickHandler}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      size={buttonBaseSize}
      className={classnames(className, contained && css.contained)}
      type={submit ? 'submit' : undefined}
      style={{
        opacity: disabled && !hideDisableFade ? 0.5 : undefined,
        marginBottom: shiftDown ? -spacing.sm : undefined,
        marginLeft: inline ? spacing.sm : undefined,
      }}
    >
      <Icon {...props} name={icon} size={size} color={contained ? undefined : color} fixedWidth />
    </MuiIconButton>
  )

  return !(forceTitle && title) && (disabled || !title) ? (
    button
  ) : (
    <Tooltip title={title} placement={placement} arrow>
      <span>{button}</span>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  contained: ({ color = 'primary' }: IconProps) => ({
    color: palette.alwaysWhite.main,
    backgroundColor: palette[color].main,
    '&:hover': {
      backgroundColor: darken(palette[color].main, 0.2),
    },
  }),
}))
