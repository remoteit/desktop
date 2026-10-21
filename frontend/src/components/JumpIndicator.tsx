import React from 'react'
import { IP_PRIVATE } from '@common/constants'
import { Tooltip } from '@mui/material'
import { Icon } from './Icon'

type Props = {
  service: IService
  device?: IDevice
}

export function JumpIndicator({ service, device }: Props) {
  if (!service.host || service.host === IP_PRIVATE || service.host.includes('localhost')) return null
  // A virtual device's own address is where its services are, not a jump.
  if (device?.virtual && service.host === device.host) return null

  return (
    <Tooltip arrow placement="top" title={`Jump to ${service.host}`}>
      <Icon color="grayDark" name="arrow-turn-down" rotate={270} type="solid" size="xxs" inlineLeft />
    </Tooltip>
  )
}
