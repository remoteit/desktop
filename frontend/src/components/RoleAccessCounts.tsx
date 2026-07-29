import React, { useEffect, useState } from 'react'
import { Stack, Chip } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

type Props = {
  role: Partial<IOrganizationRole>
}

export const RoleAccessCounts: React.FC<Props> = ({ role }) => {
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
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
  }, [role.permissions, role.access, role.tag])

  return counts === null ? (
    <Chip size="small" label={t('roleAccessCounts.counting', 'Counting...')} />
  ) : (
    <Stack spacing={0.2}>
      <Chip
        size="small"
        disabled={loading}
        label={t('roleAccessCounts.devicesCount', {
          count: counts.devices,
          defaultValue_one: '{{count}} device',
          defaultValue_other: '{{count}} devices',
        })}
      />
      <Chip
        size="small"
        disabled={loading}
        label={t('roleAccessCounts.networksCount', {
          count: counts.networks,
          defaultValue_one: '{{count}} network',
          defaultValue_other: '{{count}} networks',
        })}
      />
    </Stack>
  )
}
