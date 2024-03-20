import React from 'react'
import { Typography, Box } from '@mui/material'
import { DeviceName } from './DeviceName'

type Props = {
  service: IService
  device: IDevice
  connection?: IConnection
  duplicateName?: boolean
}

export const MobileServiceName: React.FC<Props> = ({ device, service, connection, duplicateName }) => (
  <Box sx={{ opacity: service?.state === 'active' ? 1 : 0.4 }}>
    {!duplicateName && (
      <Typography variant="caption" component="div" sx={{ '& > *': { color: 'grayDark.main' } }}>
        <DeviceName device={device} />
      </Typography>
    )}
    <Typography variant="body1">
      <DeviceName service={service} connection={connection} />
    </Typography>
  </Box>
)
