import React from 'react'
import { ColorChip } from './ColorChip'

export type Props = {
  device?: IDevice
  connections?: IConnection[]
  session?: ISession
}

export const StatusChip: React.FC<Props> = ({ device, connections, session }) => {
  return device?.license === 'UNLICENSED' ? (
    <ColorChip label="Unlicensed" size="small" color="warning" />
  ) : connections?.some(c => c.connected) ? (
    <ColorChip label="Connected" size="small" color="primary" variant="contained" />
  ) : connections?.some(c => c.enabled && c.online) ? (
    <ColorChip label="Ready" size="small" color="primary" />
  ) : device?.state === 'active' ? (
    <ColorChip label="Online" size="small" color="secondary" />
  ) : (
    <ColorChip label="Offline" size="small" color="gray" />
  )
}
