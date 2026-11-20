import React from 'react'
import { Tooltip } from '@mui/material'
import { jumpHost } from '../helpers/virtualDeviceHelper'
import { Icon } from './Icon'

type Props = {
  service: IService
  device?: IDevice
}

export function JumpIndicator({ service, device }: Props) {
  const host = jumpHost(service, device)
  if (!host) return null

  return (
    <Tooltip arrow placement="top" title={`Jump to ${host}`}>
      <Icon color="grayDark" name="arrow-turn-down" rotate={270} type="solid" size="xxs" inlineLeft />
    </Tooltip>
  )
}
