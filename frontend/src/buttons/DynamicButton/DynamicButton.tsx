import React from 'react'
import { IconButton, Tooltip, Button } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { Color, colors } from '../../styling'

type Props = {
  icon: string
  title: string
  color?: Color
  size?: 'icon' | 'medium' | 'small'
  disabled?: boolean
  onClick: () => void
}

export const DynamicButton: React.FC<Props> = ({ title, icon, onClick, color, size = 'icon', disabled = false }) => {
  let styles = {}

  const clickHandler = (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    onClick()
  }

  const IconComponent = (
    <Icon
      name={icon}
      weight="regular"
      size={size === 'small' ? 'sm' : 'md'}
      color={size === 'icon' ? color : undefined}
      inline={size !== 'icon'}
      fixedWidth
    />
  )

  if (size === 'small') {
    if (color)
      styles = {
        backgroundColor: colors[color],
        color: colors.white,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 1,
      }
    return (
      <Button style={styles} variant="contained" onClick={clickHandler} disabled={disabled} size={size} fullWidth>
        {title}
      </Button>
    )
  }

  if (size === 'medium') {
    if (color)
      styles = {
        backgroundColor: colors[color],
        color: colors.white,
      }
    return (
      <Button style={styles} variant="contained" onClick={clickHandler} disabled={disabled} size={size}>
        {title}
        {IconComponent}
      </Button>
    )
  }

  return (
    <Tooltip title={title}>
      <span>
        <IconButton disabled={disabled} onClick={clickHandler}>
          {IconComponent}
        </IconButton>
      </span>
    </Tooltip>
  )
}
