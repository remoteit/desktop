import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles, Tooltip, TooltipProps, IconButton as MuiIconButton, darken } from '@material-ui/core'
import { Icon, IconProps } from '../components/Icon/Icon'
import { spacing } from '../styling'
import classnames from 'classnames'

export type ButtonProps = Omit<IconProps, 'title'> & {
  title?: string | React.ReactElement
  forceTitle?: boolean
  icon?: string
  name?: string
  disabled?: boolean
  hideDisableFade?: boolean
  to?: string
  variant?: 'text' | 'contained'
  className?: string
  shiftDown?: boolean
  loading?: boolean
  submit?: boolean
  inline?: boolean
  placement?: TooltipProps['placement']
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
  const history = useHistory()
  const css = useStyles({ color })
  const contained = variant === 'contained'
  icon = icon || name
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
    <Tooltip title={title} placement={placement}>
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
