import React from 'react'
import { getTargetPlatform, getTargetPlatformIcon } from '../../helpers/platformHelper'
import { Tooltip, Box } from '@material-ui/core'
import { FontSize } from '../../styling'
import { Icon } from '../Icon'

export const TargetPlatform: React.FC<{
  id?: number
  size?: FontSize
  tooltip?: boolean
  label?: boolean
  color?: string
  fullColor?: boolean
  inlineLeft?: boolean
}> = ({ id, tooltip, label, color, fullColor, ...props }) => {
  const { name, type, size } = getTargetPlatformIcon(id)

  if (!name) return null

  const icon = (
    <Icon
      {...{ name, type, size: props.size || size, color, fullColor }}
      inlineLeft={props.inlineLeft || !!label}
      fixedWidth
      fullColor
    />
  )

  if (tooltip)
    return (
      <Tooltip title={getTargetPlatform(id)} placement="top" arrow>
        <span>{icon}</span>
      </Tooltip>
    )

  if (label)
    return (
      <Box>
        {icon} {getTargetPlatform(id)}
      </Box>
    )

  return icon
}
