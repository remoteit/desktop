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
  inlineLeft?: boolean
}> = ({ id, tooltip, label, color, ...props }) => {
  const { name, type, size } = getTargetPlatformIcon(id)

  if (!name) return null

  const icon = (
    <Icon {...{ name, type, size: props.size || size, color }} inlineLeft={props.inlineLeft || !!label} fixedWidth />
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
