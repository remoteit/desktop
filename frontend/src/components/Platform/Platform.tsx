import React from 'react'
import { Tooltip } from '@material-ui/core'
import { Color, FontSize } from '../../styling'
import { Icon } from '../Icon'

export const TARGET_PLATFORMS = {
  AWS: 1185,
  LinuxArm: 1200,
  LinuxDebian: 1120,
  Linux: 769,
  Mac: 256,
  RaspberryPi: 1072,
  RemoteitPiLite: 1076,
  RemoteitPi: 1075,
  Unix: 768,
  Unknown: 65535,
  WindowsDesktop: 5,
  WindowsServer: 10,
  Windows: 0,
}

export const INITIATOR_PLATFORMS = [
  'Generic',
  'Windows Desktop',
  'Windows Proxy',
  'Mac Desktop',
  'Mac Proxy',
  'Web Proxy',
  'Linux Desktop',
  'Linux Proxy',
  'Generic',
  'Phone',
  'iPhone/IOS',
  'iPad',
  'iTouch',
  'Java Linux',
  'Android',
  'Java Windows',
  'Java Mac',
  'Unknown',
  'BSD',
]

export const Platform: React.FC<{ id?: number; connected?: boolean }> = ({ id, connected }) => {
  let name: string
  let type: IconType = 'light'
  let color: Color | undefined = connected ? 'primary' : undefined
  const size: FontSize = 'md'

  switch (id) {
    case 1:
    case 2:
      name = 'windows'
      type = 'brands'
      break
    case 3:
    case 4:
      name = 'mac'
      type = 'brands'
      break
    case 5:
      name = 'globe'
      break
    case 6:
    case 7:
      name = 'linux'
      type = 'brands'
      break
    case 8:
      name = 'globe'
      break
    case 9:
    case 10:
      name = 'mobile'
      break
    case 11:
    case 12:
      name = 'tablet'
      break
    case 13:
      name = 'linux'
      type = 'brands'
      break
    case 14:
      name = 'mobile-android'
      break
    case 15:
      name = 'windows'
      type = 'brands'
      break
    case 16:
      name = 'mac'
      type = 'brands'
      break
    case 17:
    case 18:
    default:
      name = 'user'
      break
  }

  return connected && id ? (
    <Tooltip title={`Connected by ${INITIATOR_PLATFORMS[id]}`}>
      <Icon {...{ name, type, size, color }} />
    </Tooltip>
  ) : (
    <Icon {...{ name, type, size, color }} />
  )
}
