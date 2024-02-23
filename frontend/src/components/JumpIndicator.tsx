import React from 'react'
import { IP_PRIVATE } from '@common/constants'
import { Tooltip } from '@mui/material'
import { Icon } from './Icon'

type Props = {
  service: IService
}

export function JumpIndicator({ service }: Props) {
  if (!service.host || service.host === IP_PRIVATE || service.host.includes('localhost')) return null

  return (
    <Tooltip arrow placement="top" title={`Jump to ${service.host}`}>
      <Icon color="grayDark" name="bracket-round" rotate={90} type="solid" size="xxs" inlineLeft />
    </Tooltip>
  )
}
