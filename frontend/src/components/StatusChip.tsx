import React from 'react'
import { ColorChip } from './ColorChip'

export type Props = {
  device?: IDevice
  service?: IService
  connections?: IConnection[]
}

export const StatusChip: React.FC<Props> = ({ device, service, connections }) => {
  const instance = device || service
  return instance?.license === 'UNLICENSED' ? (
    <ColorChip label="Unlicensed" size="small" color="warning" />
  ) : connections?.some(c => c.connected) ? (
    <ColorChip label="Connected" size="small" color="primary" variant="contained" />
  ) : connections?.some(c => c.enabled && c.online) ? (
    <ColorChip label="Idle" size="small" color="primary" />
  ) : instance?.state === 'active' ? (
    <ColorChip label="Online" size="small" color="secondary" />
  ) : (
    <ColorChip label="Offline" size="small" color="gray" />
  )
}
