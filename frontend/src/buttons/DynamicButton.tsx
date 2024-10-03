import React, { forwardRef } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { IconButton, Tooltip, Button, ButtonProps, alpha, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'
import { spacing } from '../styling'
import { Color } from '../styling'

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
  const css = useStyles(props)
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
    ...rest
  }: DynamicButtonProps = props

  if (icon && loading && size === 'small') {
    icon = 'spinner-third'
    iconType = 'solid'
  }

  if (size === 'chip') {
    return (
      <Button ref={ref} size="small" variant={variant} className={classnames(className, css.button)} {...rest}>
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
      <Button ref={ref} size={size} variant={variant} {...rest} className={classnames(className, css.button)}>
        {IconComponent}
        {title}
      </Button>
    )
  }

  return (
    <Tooltip title={title} className={className} placement="top" enterDelay={400} arrow>
      <span>
        <IconButton ref={ref} disabled={rest.disabled} onClick={rest.onClick} size="small">
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
