import React from 'react'
import { TARGET_PLATFORMS } from '../../helpers/platformHelper'
import { Tooltip, Box } from '@material-ui/core'
import { FontSize } from '../../styling'
import { Icon } from '../Icon'

export const TargetPlatform: React.FC<{ id?: number; size?: FontSize; tooltip?: boolean; label?: boolean }> = ({
  id,
  size = 'xxs',
  tooltip,
  label,
}) => {
  let type: IconType = 'brands'
  let name: string = ''

  switch (id) {
    case 0:
    case 5:
    case 10:
      name = 'windows'
      break
    case 256:
      name = 'apple'
      break
    case 768:
      name = 'union'
      type = 'solid'
      break
    case 769:
      name = 'linux'
      break
    case 1072:
    case 1075:
    case 1076:
      name = 'raspberry-pi'
      if (size === 'xxs') size = 'xs'
      break
    case 1120:
      name = 'ubuntu'
      break
    case 1185:
      name = 'aws'
      if (size === 'xxs') size = 'xs'
      break
    case 1200:
      name = 'linux'
      break
    case 34304:
      name = 'cloud-rainbow'
      type = 'solid'
      if (size === 'xxs') size = 'xs'
      break
  }

  if (!name || !id) return null

  const icon = <Icon {...{ name, type, size }} />

  if (tooltip)
    return (
      <Tooltip title={TARGET_PLATFORMS[id]} placement="top" arrow>
        <span>{icon}</span>
      </Tooltip>
    )

  if (label)
    return (
      <Box>
        {icon} {TARGET_PLATFORMS[id]}
      </Box>
    )

  return icon
}
