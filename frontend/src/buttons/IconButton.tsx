import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles, Tooltip, IconButton as MuiIconButton, darken } from '@material-ui/core'
import { Icon, IconProps } from '../components/Icon/Icon'
import { spacing } from '../styling'
import classnames from 'classnames'

export type ButtonProps = IconProps & {
  title?: string
  icon: string
  disabled?: boolean
  to?: string
  variant?: 'text' | 'contained'
  className?: string
  shiftDown?: boolean
  loading?: boolean
  submit?: boolean
  inline?: boolean
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
  color,
  variant,
  shiftDown,
  size = 'base',
  inline,
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
  const css = useStyles({ color })
  const contained = variant === 'contained'
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
      className={classnames(className, contained && css.contained)}
      type={submit ? 'submit' : undefined}
      style={{
        opacity: disabled ? 0.5 : undefined,
        marginBottom: shiftDown ? -spacing.sm : undefined,
        marginLeft: inline ? spacing.sm : undefined,
      }}
    >
      <Icon {...props} name={icon} size={size} color={contained ? undefined : color} fixedWidth />
    </MuiIconButton>
  )

  return disabled || !title ? (
    button
  ) : (
    <Tooltip title={title}>
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
