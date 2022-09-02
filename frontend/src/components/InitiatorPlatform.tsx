import React from 'react'
import { Tooltip } from '@mui/material'
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

type Props = {
  id?: number
  user?: boolean
  thisDevice?: boolean
}

export function initiatorPlatformIcon({ id, user, thisDevice }: Props): [string, IconType | undefined] {
  let name: string
  let type: IconType | undefined
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
      name = 'apple'
      type = 'brands'
      break
    case 17:
    case 18:
    default:
      name = user ? 'user' : thisDevice ? 'laptop' : 'router'
      break
  }

  return [name, type]
}

export const InitiatorPlatform: React.FC<
  Props & {
    connected?: boolean
    className?: string
  }
> = ({ id, connected, user, thisDevice, className }) => {
  let color: Color | undefined = connected ? 'primary' : undefined
  const size: FontSize = 'md'
  const [name, type] = initiatorPlatformIcon({ id, user, thisDevice })

  return connected && id ? (
    <Tooltip title={`Connected by ${INITIATOR_PLATFORMS[id]}`}>
      <Icon {...{ name, type, size, color, className }} />
    </Tooltip>
  ) : (
    <Icon {...{ name, type, size, color, className }} />
  )
}
