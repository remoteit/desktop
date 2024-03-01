import React, { useEffect, useState } from 'react'
import { Stack, Chip } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'

type Props = {
  role: IOrganizationRole
}

export const RoleAccessCounts: React.FC<Props> = ({ role }) => {
  const dispatch = useDispatch<Dispatch>()
  const [counts, setCounts] = useState<{ devices: number; networks: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      setCounts(null)
      const devices = await dispatch.devices.fetchCount(role)
      const networks = await dispatch.networks.fetchCount(role)
      setCounts({ devices, networks })
    })()
  }, [role.permissions, role.access, role.tag])

  return counts === null ? (
    <Chip size="small" label="Counting..." />
  ) : (
    <Stack spacing={0.2}>
      <Chip size="small" label={`${counts.devices} device${counts.devices === 1 ? '' : 's'}`} />
      <Chip size="small" label={`${counts.networks} network${counts.networks === 1 ? '' : 's'}`} />
    </Stack>
  )
}
