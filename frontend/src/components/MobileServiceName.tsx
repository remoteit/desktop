import React from 'react'
import { attributeName } from '@common/nameHelper'
import { Typography, Box } from '@mui/material'
import { DeviceName } from './DeviceName'

type Props = {
  service: IService
  device: IDevice
  connection?: IConnection
  duplicateName?: boolean
}

export const MobileServiceName: React.FC<Props> = ({ device, service, connection, duplicateName }) => (
  <Box>
    {!duplicateName && (
      <Typography variant="caption" color="grayDark.main" component="div">
        {attributeName(device)}
      </Typography>
    )}
    <Typography variant="body1">
      <DeviceName service={service} connection={connection} />
    </Typography>
  </Box>
)
