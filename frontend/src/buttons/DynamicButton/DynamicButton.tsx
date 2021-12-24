import React from 'react'
import { makeStyles, IconButton, Tooltip, Button, darken, lighten } from '@material-ui/core'
import { Color } from '../../styling'
import { Icon } from '../../components/Icon'

type Props = {
  icon?: string
  title: string
  color?: Color
  size?: 'icon' | 'medium' | 'small' | 'large'
  disabled?: boolean
  loading?: boolean
  variant?: 'text' | 'outlined' | 'contained'
  onClick: () => void
  fullWidth?: boolean
}

export const DynamicButton: React.FC<Props> = props => {
  const css = useStyles(props)
  let { title, icon, onClick, color, size = 'icon', variant = 'contained', disabled, loading, fullWidth }: Props = props
  let styles = {}

  const clickHandler = (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    onClick()
  }

  if (loading) icon = 'spinner-third'

  const IconComponent = icon ? (
    <Icon
      name={icon}
      type="regular"
      size={size === 'small' ? 'sm' : 'md'}
      color={size === 'icon' ? color : undefined}
      inline={size !== 'icon'}
      spin={loading}
      fixedWidth
    />
  ) : null

  if (size === 'small') {
    return (
      <Button variant={variant} onClick={clickHandler} disabled={disabled} size={size} className={css.button} fullWidth>
        {title}
        {loading && IconComponent}
      </Button>
    )
  }

  if (size === 'medium' || size === 'large') {
    return (
      <Button
        style={styles}
        variant={variant}
        onClick={clickHandler}
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
      <IconButton disabled={disabled} onClick={clickHandler}>
        {IconComponent}
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  button: (props: Props) => {
    let background = props.color ? palette[props.color].main : undefined
    let hover = background ? darken(background, 0.3) : undefined
    let foreground

    if (props.variant === 'text' && background) {
      foreground = background
      hover = lighten(background, 0.8)
    }

    return {
      backgroundColor: background,
      '& .MuiButton-label': { color: foreground },
      '&:hover': { backgroundColor: hover },
    }
  },
}))
