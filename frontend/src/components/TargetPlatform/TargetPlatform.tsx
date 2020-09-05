import React from 'react'
import { Tooltip } from '@material-ui/core'
import { FontSize } from '../../styling'
import { Icon } from '../Icon'

type ITargetPlatform = { [index: number]: string }

export const TARGET_PLATFORMS: ITargetPlatform = {
  0: 'Windows',
  5: 'Windows Desktop',
  10: 'Windows Server',
  256: 'Mac',
  768: 'Unix',
  769: 'Linux',
  1072: 'Raspberry Pi',
  1075: 'Remoteit Pi',
  1076: 'Remoteit Pi Lite',
  1120: 'Debian Linux',
  1185: 'AWS',
  1200: 'Linux ARM',
  65535: 'Unknown',
}

export const TargetPlatform: React.FC<{ id?: number; size?: FontSize }> = ({ id, size = 'xxs' }) => {
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
  }

  if (!name || !id) return null

  return <Icon {...{ name, type, size }} />
}
