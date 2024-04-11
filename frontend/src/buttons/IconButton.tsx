import React from 'react'
import { useHistory } from 'react-router-dom'
import { SystemStyleObject } from '@mui/system'
import { Tooltip, TooltipProps, IconButton as MuiIconButton, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'

type VariantType = 'text' | 'contained' | 'outlined'

export type ButtonProps = Omit<IconProps, 'title'> & {
  to?: string
  title?: React.ReactNode
  forceTitle?: boolean
  icon?: string
  name?: string
  sx?: SystemStyleObject
  disabled?: boolean
  hideDisableFade?: boolean
  iconInlineLeft?: boolean
  buttonBaseSize?: 'small' | 'medium' | 'large'
  variant?: VariantType
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
      sx = {},
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

    const updatedSx: SystemStyleObject = {
      ...sx,
      opacity: disabled && !hideDisableFade ? 0.5 : undefined,
      marginBottom: shiftDown ? -0.75 : undefined,
      marginTop: shiftDown ? -0.75 : undefined,
      marginLeft: inline ? 1.5 : undefined,
      marginRight: inlineLeft ? 1.5 : undefined,
    }

    switch (variant) {
      case 'contained':
        updatedSx.color = 'alwaysWhite.main'
        updatedSx.backgroundColor = `${color || 'primary'}.main`
        updatedSx['&:hover'] = {
          backgroundColor: ({ palette }) => darken(palette[color || 'primary'].main, 0.2),
        }
        break
      case 'outlined':
        updatedSx.border = `1px solid ${color || 'primary'}.main`
    }

    const button = (
      <MuiIconButton
        {...{ ref, disabled, onMouseDown, onMouseEnter, onMouseLeave, className }}
        sx={updatedSx}
        size={buttonBaseSize}
        onClick={clickHandler}
        type={submit ? 'submit' : undefined}
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