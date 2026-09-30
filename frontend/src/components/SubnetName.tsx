import React, { useEffect, useSyncExternalStore } from 'react'
import { Box, Typography } from '@mui/material'
import { requestSubnetName, subnetName, subscribeSubnetNames } from '../services/subnetNames'
import { CopyIconButton } from '../buttons/CopyIconButton'

/* A device's name in device subnets — what its owner's devices, and theirs in user mode, resolve — with a copy
   button. Nothing while it is being read, or where there is none. */
export const SubnetName: React.FC<{ deviceId?: string; copy?: boolean }> = ({ deviceId, copy }) => {
  const name = useSyncExternalStore(subscribeSubnetNames, () => (deviceId ? subnetName(deviceId) : null))

  useEffect(() => {
    if (deviceId) requestSubnetName(deviceId)
  }, [deviceId])

  if (!name) return null

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
      <Typography component="span" variant="caption" noWrap>
        {name}
      </Typography>
      {copy && <CopyIconButton sx={{ marginY: -1 }} size="sm" color="gray" value={name} />}
    </Box>
  )
}
