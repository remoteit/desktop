import React from 'react'
import { platforms } from '../../platforms'
import { Tooltip, Box } from '@mui/material'
import { FontSize } from '../../styling'
import { Icon } from '../Icon'

export const TargetPlatform: React.FC<{
  id?: number
  size?: FontSize
  tooltip?: boolean
  label?: boolean
  inlineLeft?: boolean
}> = ({ id = -1, size, tooltip, label, inlineLeft }) => {
  const icon = <Icon size={size} inlineLeft={inlineLeft || !!label} platform={id} platformIcon />
  const platform = platforms.type(id)
  const typeName = platform.types?.[id] || platform.name
  console.log('platform', platform)
  if (tooltip)
    return (
      <Tooltip title={typeName} placement="top" arrow>
        <span>{icon}</span>
      </Tooltip>
    )

  if (label)
    return (
      <Box display="flex" alignItems="center">
        {icon}
        {typeName}
      </Box>
    )

  return icon
}
