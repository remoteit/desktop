import React, { forwardRef } from 'react'
import { Box, IconButton, Tooltip, Button, ButtonProps, Theme, alpha, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'
import { spacing, toSxArray } from '../styling'

export type DynamicButtonProps = Omit<ButtonProps, 'color' | 'size'> & {
  title?: string
  icon?: string | React.ReactNode
  iconType?: IconProps['type']
  color?: Color
  size?: 'icon' | 'chip' | 'medium' | 'small' | 'large'
  iconSize?: IconProps['size']
  loading?: boolean
}

export const DynamicButton = forwardRef<HTMLButtonElement, DynamicButtonProps>((props, ref) => {
  let {
    title,
    icon,
    iconType = 'regular',
    iconSize,
    color,
    size = 'icon',
    variant = 'contained',
    className,
    loading,
    sx,
    ...rest
  }: DynamicButtonProps = props

  const sxArray = toSxArray(sx)

  const buttonSx = (theme: Theme) => {
    let background = rest.disabled ? theme.palette.grayLight.main : color ? theme.palette[color].main : undefined
    let hover = background ? darken(background, 0.25) : undefined
    let foreground = theme.palette.alwaysWhite.main
    let style: any = {}

    if (variant === 'text' && background) {
      foreground = background
      background = alpha(foreground, 0.1)
      hover = alpha(foreground, 0.2)
    }

    if (size === 'chip') {
      style.textTransform = 'none'
      style.height = 20
      style.fontWeight = 500
      style.letterSpacing = 0.3
      style.padding = `0px ${spacing.sm}px`
    }

    return {
      '&.MuiButton-root': {
        '&:hover': { backgroundColor: rest.disabled ? background : hover },
        backgroundColor: background,
        color: foreground,
        minWidth: 0,
        ...style,
      },
    }
  }

  if (icon && loading && size === 'small') {
    icon = 'spinner-third'
    iconType = 'solid'
  }

  if (size === 'chip') {
    return (
      <Button ref={ref} size="small" variant={variant} className={className} sx={[buttonSx, ...sxArray]} {...rest}>
        {title}
      </Button>
    )
  }

  const IconComponent =
    typeof icon === 'string' ? (
      <Icon
        name={icon}
        type={iconType}
        size={iconSize}
        color={size === 'icon' ? (rest.disabled ? 'grayLight' : color) : undefined}
        inlineLeft={size !== 'icon' && !!title}
        spin={loading}
        fixedWidth
      />
    ) : icon ? (
      icon
    ) : null

  if (size === 'small' || size === 'medium' || size === 'large') {
    return (
      <Button ref={ref} size={size} variant={variant} {...rest} className={className} sx={[buttonSx, ...sxArray]}>
        {IconComponent}
        {title}
      </Button>
    )
  }

  const iconButton = (
    <IconButton ref={ref} disabled={rest.disabled} onClick={rest.onClick} size="small">
      {IconComponent}
    </IconButton>
  )

  return (
    <Tooltip title={title} className={className} placement="top" enterDelay={400} arrow>
      {sxArray.length ? (
        <Box component="span" sx={sxArray}>
          {iconButton}
        </Box>
      ) : (
        <span>{iconButton}</span>
      )}
    </Tooltip>
  )
})
