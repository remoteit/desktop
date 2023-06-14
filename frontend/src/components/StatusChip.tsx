import React from 'react'
import { ColorChip } from './ColorChip'

export type Props = {
  device?: IDevice
  connection?: IConnection
}

export const StatusChip: React.FC<Props> = ({ device, connection }) => {
  return device?.license === 'UNLICENSED' ? (
    <ColorChip label="Unlicensed" size="small" color="warning" />
  ) : connection?.connected ? (
    <ColorChip label="Connected" size="small" color="primary" variant="contained" />
  ) : connection?.enabled ? (
    <ColorChip label="Ready" size="small" color="primary" />
  ) : device?.state === 'active' ? (
    <ColorChip label="Online" size="small" color="secondary" />
  ) : (
    <ColorChip label="Offline" size="small" color="gray" />
  )
}
