import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { Tooltip, TooltipProps, IconButton as MuiIconButton, IconButtonProps, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'
import { spacing } from '../styling'
import classnames from 'classnames'

export type ButtonProps = Omit<IconProps, 'title'> & {
  to?: string
  title?: React.ReactNode
  forceTitle?: boolean
  icon?: string
  name?: string
  sx?: IconButtonProps['sx']
  disabled?: boolean
  hideDisableFade?: boolean
  iconInlineLeft?: boolean
  buttonBaseSize?: 'small' | 'medium' | 'large'
  variant?: 'text' | 'contained' | 'outlined'
  shiftDown?: boolean
  loading?: boolean
  submit?: boolean
  hide?: boolean
  placement?: TooltipProps['placement']
  children?: React.ReactNode
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      to,
      sx,
      title,
      forceTitle,
      icon,
      name,
      disabled,
      hideDisableFade,
      spin,
      color,
      variant,
      shiftDown,
      size = 'base',
      buttonBaseSize,
      inline,
      inlineLeft,
      iconInlineLeft,
      className,
      loading,
      submit,
      hide,
      placement = 'top',
      fixedWidth = true,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const history = useHistory()
    const css = useStyles({ color })
    if (hide) return null
    icon = icon || name
    if (loading) {
      icon = 'spinner-third'
      spin = true
    }
    const clickHandler = (e: React.MouseEvent) => {
      if (onClick) onClick(e)
      if (to) history.push(to)
    }
    const button = (
      <MuiIconButton
        ref={ref}
        sx={sx}
        disabled={disabled}
        size={buttonBaseSize}
        onClick={clickHandler}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={classnames(className, variant && css[variant])}
        type={submit ? 'submit' : undefined}
        style={{
          opacity: disabled && !hideDisableFade ? 0.5 : undefined,
          marginBottom: shiftDown ? -spacing.xs : undefined,
          marginTop: shiftDown ? -spacing.xs : undefined,
          marginLeft: inline ? spacing.sm : undefined,
          marginRight: inlineLeft ? spacing.sm : undefined,
        }}
      >
        <Icon
          {...props}
          name={icon}
          size={size}
          spin={spin}
          color={variant === 'contained' ? undefined : color}
          inlineLeft={iconInlineLeft}
          fixedWidth={fixedWidth}
        />
        {children}
      </MuiIconButton>
    )

    return !(forceTitle && title) && (disabled || !title) ? (
      button
    ) : (
      <Tooltip title={title} placement={placement} arrow className="IconButtonTooltip">
        <span>{button}</span>
      </Tooltip>
    )
  }
)

const useStyles = makeStyles(({ palette }) => ({
  contained: ({ color = 'primary' }: IconProps) => ({
    color: palette.alwaysWhite.main,
    backgroundColor: palette[color].main,
    '&:hover': {
      backgroundColor: darken(palette[color].main, 0.2),
    },
  }),
  outlined: ({ color = 'primary' }: IconProps) => ({
    border: `1px solid ${palette[color].main}`,
  }),
}))
