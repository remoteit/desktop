import React from 'react'
import { Box } from '@material-ui/core'
import { getAttribute } from '../helpers/attributes'

export const DeviceValue: React.FC<{
  name?: string
  device: IDevice
  connection?: IConnection
  connections?: IConnection[]
  className?: string
}> = ({ name = '', device, connection, connections, ...props }) => {
  const item = getAttribute(name)
  if (!item) return null
  return <Box {...props}>{item.value({ device, connection, connections })}</Box>
}
