import React, { useEffect, useState } from 'react'
import { Box, Chip } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'

type Props = {
  role?: IOrganizationRole
}

export const RoleAccessCounts: React.FC<Props> = ({ role }) => {
  const dispatch = useDispatch<Dispatch>()
  const [counts, setCounts] = useState<{ devices: number; networks: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      setCounts(null)
      if (!role) return
      const devices = await dispatch.devices.fetchCount(role)
      const networks = await dispatch.networks.fetchCount(role)
      setCounts({ devices, networks })
    })()
  }, [role])

  return counts === null ? (
    <Chip size="small" label="Counting..." />
  ) : (
    <Box display="flex" flexDirection="column">
      <Chip size="small" label={`${counts.devices} device${counts.devices === 1 ? '' : 's'}`} />
      <Chip size="small" label={`${counts.networks} network${counts.networks === 1 ? '' : 's'}`} />
    </Box>
  )
}
