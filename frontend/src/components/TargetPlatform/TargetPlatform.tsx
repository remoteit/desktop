import React from 'react'
import { getTargetPlatform } from '../../helpers/platformHelper'
import { Tooltip, Box } from '@material-ui/core'
import { FontSize } from '../../styling'
import { Icon } from '../Icon'

export const TargetPlatform: React.FC<{
  id?: number
  size?: FontSize
  tooltip?: boolean
  label?: boolean
  inlineLeft?: boolean
}> = ({ id, size, tooltip, label, inlineLeft }) => {
  const icon = <Icon size={size} inlineLeft={inlineLeft || !!label} platform={id} platformIcon />

  if (tooltip)
    return (
      <Tooltip title={getTargetPlatform(id)} placement="top" arrow>
        <span>{icon}</span>
      </Tooltip>
    )

  if (label)
    return (
      <Box display="flex" alignItems="center">
        {icon}
        {getTargetPlatform(id)}
      </Box>
    )

  return icon
}
