import React from 'react'
import { IconButton, Tooltip, Button, PropTypes } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { Color, colors } from '../../styling'

type Props = {
  icon: string
  title: string
  color?: Color
  fullSize?: boolean
  fullSizeColor?: PropTypes.Color
  disabled?: boolean
  onClick: () => void
}

export const DynamicButton: React.FC<Props> = ({
  title,
  icon,
  onClick,
  color,
  fullSize = false,
  fullSizeColor,
  disabled = false,
}) => {
  let styles = {}
  const IconComponent = (
    <Icon name={icon} weight="regular" size="md" color={fullSize ? undefined : color} fixedWidth inline={fullSize} />
  )

  if (fullSize) {
    if (color)
      styles = {
        backgroundColor: colors[color],
        color: colors.white,
      }

    return (
      <Button style={styles} variant="contained" onClick={onClick} disabled={disabled} size="medium">
        {title}
        {IconComponent}
      </Button>
    )
  }

  return (
    <Tooltip title={title}>
      <span>
        <IconButton disabled={disabled} onClick={onClick}>
          {IconComponent}
        </IconButton>
      </span>
    </Tooltip>
  )
}
