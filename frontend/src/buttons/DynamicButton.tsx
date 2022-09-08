import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { IconButton, Button, alpha, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'
import { Color } from '../styling'

export type DynamicButtonProps = {
  icon?: string
  iconType?: IconProps['type']
  title: string
  color?: Color
  size?: 'icon' | 'medium' | 'small' | 'large'
  iconSize?: IconProps['size']
  disabled?: boolean
  loading?: boolean
  variant?: 'text' | 'outlined' | 'contained'
  className?: string
  onClick: React.MouseEventHandler<HTMLButtonElement>
  fullWidth?: boolean
}

export const DynamicButton: React.FC<DynamicButtonProps> = props => {
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

  if (loading) {
    icon = 'spinner-third'
    iconType = 'solid'
  }

  const IconComponent = icon ? (
    <Icon
      name={icon}
      type={iconType}
      size={iconSize}
      color={size === 'icon' ? color : undefined}
      inlineLeft={size !== 'icon'}
      spin={loading}
      fixedWidth
    />
  ) : null

  if (size === 'small') {
    return (
      <Button
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        size={size}
        className={classnames(className, css.button)}
      >
        {IconComponent}
        {title}
      </Button>
    )
  }

  if (size === 'medium' || size === 'large') {
    return (
      <Button
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        size={size}
        className={css.button}
        fullWidth={fullWidth}
      >
        {IconComponent}
        {title}
      </Button>
    )
  }

  return (
    <IconButton className={className} disabled={disabled} onClick={onClick} size="small">
      {IconComponent}
    </IconButton>
  )
}
//   <Tooltip title={title} className={className} placement="left" arrow>
//     <span>
//     </span>
//   </Tooltip>

const useStyles = makeStyles(({ palette }) => ({
  button: (props: DynamicButtonProps) => {
    let background = props.color && !props.disabled ? palette[props.color].main : undefined
    let hover = background ? darken(background, 0.25) : undefined
    let foreground = palette.alwaysWhite.main

    if (props.variant === 'text' && background) {
      foreground = background
      background = alpha(foreground, 0.1)
      hover = alpha(foreground, 0.2)
    }

    return {
      '&.MuiButton-root': {
        backgroundColor: background,
        color: foreground,
        '&:hover': { backgroundColor: hover },
      },
    }
  },
}))
