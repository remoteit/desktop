import React, { forwardRef } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { IconButton, Tooltip, Button, alpha, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'
import { spacing } from '../styling'
import { Color } from '../styling'

export type DynamicButtonProps = {
  icon?: string
  iconType?: IconProps['type']
  title?: string
  color?: Color
  size?: 'icon' | 'chip' | 'medium' | 'small' | 'large'
  iconSize?: IconProps['size']
  disabled?: boolean
  loading?: boolean
  variant?: 'text' | 'outlined' | 'contained'
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  fullWidth?: boolean
}

export const DynamicButton = forwardRef<HTMLButtonElement, DynamicButtonProps>((props, ref) => {
  const css = useStyles(props)
  let {
    title,
    icon,
    iconType = 'regular',
    iconSize,
    onClick,
    color,
    size = 'icon',
    variant = 'contained',
    className,
    disabled,
    loading,
    fullWidth,
  }: DynamicButtonProps = props

  if (icon && loading && size === 'small') {
    icon = 'spinner-third'
    iconType = 'solid'
  }

  if (size === 'chip') {
    return (
      <Button
        ref={ref}
        size="small"
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        className={classnames(className, css.button)}
        fullWidth={fullWidth}
      >
        {title}
      </Button>
    )
  }

  const IconComponent = icon ? (
    <Icon
      name={icon}
      type={iconType}
      size={iconSize}
      color={size === 'icon' ? (disabled ? 'grayLight' : color) : undefined}
      inlineLeft={size !== 'icon' && !!title}
      spin={loading}
      fixedWidth
    />
  ) : null

  if (size === 'small' || size === 'medium' || size === 'large') {
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        className={classnames(className, css.button)}
        fullWidth={fullWidth}
      >
        {IconComponent}
        {title}
      </Button>
    )
  }

  return (
    <Tooltip title={title} className={className} placement="top" enterDelay={400} arrow>
      <span>
        <IconButton ref={ref} disabled={disabled} onClick={onClick} size="small">
          {IconComponent}
        </IconButton>
      </span>
    </Tooltip>
  )
})

const useStyles = makeStyles(({ palette }) => ({
  button: (props: DynamicButtonProps) => {
    let background = props.disabled ? palette.grayLight.main : props.color ? palette[props.color].main : undefined
    let hover = background ? darken(background, 0.25) : undefined
    let foreground = palette.alwaysWhite.main
    let style: any = {}

    if (props.variant === 'text' && background) {
      foreground = background
      background = alpha(foreground, 0.1)
      hover = alpha(foreground, 0.2)
    }

    if (props.size === 'chip') {
      style.textTransform = 'none'
      style.height = 20
      style.fontWeight = 500
      style.letterSpacing = 0.3
      style.padding = `0px ${spacing.sm}px`
    }

    return {
      '&.MuiButton-root': {
        '&:hover': { backgroundColor: props.disabled ? background : hover },
        backgroundColor: background,
        color: foreground,
        minWidth: 0,
        ...style,
      },
    }
  },
}))
