import React from 'react'
import { Tooltip } from '@material-ui/core'
import { Color, FontSize } from '../styling'
import { Icon } from './Icon'

export const INITIATOR_PLATFORMS = [
  'Generic',
  'Windows Desktop',
  'Windows',
  'Mac Desktop',
  'Mac',
  'Web',
  'Linux Desktop',
  'Linux',
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

export const InitiatorPlatform: React.FC<{
  id?: number
  connected?: boolean
  user?: boolean
  thisDevice?: boolean
}> = ({ id, connected, user, thisDevice }) => {
  let name: string
  let type: IconType = 'regular'
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
      name = 'apple'
      type = 'brands'
      break
    case 5:
      name = 'cloud'
      break
    case 6:
    case 7:
      name = 'linux'
      type = 'brands'
      break
    case 8:
      name = 'cloud'
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
      name = user ? 'user' : thisDevice ? 'laptop' : 'hdd'
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
