import React from 'react'
import { IP_PRIVATE } from '@common/constants'
import { Tooltip } from '@mui/material'
import { Icon } from './Icon'

type Props = {
  service: IService
}

export function JumpIndicator({ service }: Props) {
  if (service.host === IP_PRIVATE) return null

  return (
    <Tooltip arrow placement="top" title="Jump service">
      <Icon color="grayDark" name="arrow-turn-down-left" rotate={180} type="solid" size="xxs" inlineLeft />
    </Tooltip>
  )
}
