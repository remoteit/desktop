import React, { useEffect, useState } from 'react'
import { Stack, Chip } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'

type Props = {
  role: Partial<IOrganizationRole>
}

export const RoleAccessCounts: React.FC<Props> = ({ role }) => {
  const dispatch = useDispatch<Dispatch>()
  const [loading, setLoading] = useState<boolean>(true)
  const [counts, setCounts] = useState<{ devices: number; networks: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const devices = await dispatch.devices.fetchCount(role)
      const networks = await dispatch.networks.fetchCount(role)
      setCounts({ devices, networks })
      setLoading(false)
    })()
  }, [role])

  return counts === null ? (
    <Chip size="small" label="Counting..." />
  ) : (
    <Stack spacing={0.2}>
      <Chip size="small" disabled={loading} label={`${counts.devices} device${counts.devices === 1 ? '' : 's'}`} />
      <Chip size="small" disabled={loading} label={`${counts.networks} network${counts.networks === 1 ? '' : 's'}`} />
    </Stack>
  )
}
