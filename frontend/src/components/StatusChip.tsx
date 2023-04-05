import React from 'react'
import { ColorChip } from './ColorChip'

export type Props = {
  device?: IDevice
  connection?: IConnection
}

export const StatusChip: React.FC<Props> = ({ device, connection }) => {
  return connection?.connected ? (
    <ColorChip label="Connected" size="small" typeColor="alwaysWhite" backgroundColor="primary" />
  ) : connection?.enabled ? (
    <ColorChip label="Ready" size="small" typeColor="primary" />
  ) : device?.state === 'active' ? (
    <ColorChip label="Online" size="small" typeColor="secondary" />
  ) : (
    <ColorChip label="Offline" size="small" typeColor="gray" />
  )
}
