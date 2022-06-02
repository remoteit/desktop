import React from 'react'
import { makeStyles, IconButton, Tooltip, Button, alpha, darken } from '@material-ui/core'
import { Color } from '../styling'
import { Icon, IconProps } from '../components/Icon'

export type DynamicButtonProps = {
  icon?: string
  iconType?: IconProps['type']
  title: string
  color?: Color
  options?: { label: string; value: string }[]
  size?: 'icon' | 'medium' | 'small' | 'large'
  disabled?: boolean
  loading?: boolean
  variant?: 'text' | 'outlined' | 'contained'
  onClick: React.MouseEventHandler<HTMLButtonElement>
  fullWidth?: boolean
}

export const DynamicButton: React.FC<DynamicButtonProps> = props => {
  const css = useStyles(props)
  let {
    title,
    icon,
    iconType = 'regular',
    onClick,
    color,
    size = 'icon',
    variant = 'contained',
    disabled,
    loading,
    fullWidth,
  }: DynamicButtonProps = props

  if (loading) icon = 'spinner-third'

  const IconComponent = icon ? (
    <Icon
      name={icon}
      type={iconType}
      size={size === 'small' ? 'sm' : 'md'}
      color={size === 'icon' ? color : undefined}
      inline={size !== 'icon'}
      spin={loading}
      fixedWidth
    />
  ) : null

  if (size === 'small') {
    return (
      <Button variant={variant} onClick={onClick} disabled={disabled} size={size} className={css.button} fullWidth>
        {title}
        {loading && IconComponent}
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
        {title}
        {IconComponent}
      </Button>
    )
  }

  return (
    <Tooltip title={title}>
      <IconButton disabled={disabled} onClick={onClick}>
        {IconComponent}
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  button: (props: DynamicButtonProps) => {
    let background = props.color ? palette[props.color].main : undefined
    let hover = background ? darken(background, 0.25) : undefined
    let foreground = palette.alwaysWhite.main

    if (props.variant === 'text' && background) {
      foreground = background
      background = palette.white.main
      hover = alpha(foreground, 0.1)
    }

    return {
      backgroundColor: background,
      '& .MuiButton-label': { color: foreground },
      '&:hover': { backgroundColor: hover },
    }
  },
}))
