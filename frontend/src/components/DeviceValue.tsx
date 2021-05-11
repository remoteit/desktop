import React from 'react'
import { Box } from '@material-ui/core'
import { useDeviceDetails } from '../hooks/useDeviceDetails'

export const DeviceValue: React.FC<{
  device: IDevice
  connection?: IConnection
  connections?: IConnection[]
  name?: string
}> = ({ device, connection, connections, name = '' }) => {
  const item = useDeviceDetails(name)
  if (!item) return null
  return <Box width={item.width}>{item.value(device, connection, connections)}</Box>
}
