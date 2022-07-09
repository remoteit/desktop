import React from 'react'
import { platforms } from '../../platforms'
import { Tooltip, Box } from '@material-ui/core'
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

  if (tooltip)
    return (
      <Tooltip title={platforms.nameLookup[id]} placement="top" arrow>
        <span>{icon}</span>
      </Tooltip>
    )

  if (label)
    return (
      <Box display="flex" alignItems="center">
        {icon}
        {platforms.nameLookup[id]}
      </Box>
    )

  return icon
}
