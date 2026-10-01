import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { Icon } from './Icon'

/* A device's name in device subnets — what its owner's devices, and theirs in user mode, resolve — marked when the
   device itself is in user mode, with a copy button where asked. Nothing while it is being read, or where there is
   none. With a service, the service's name: its device's, or its LAN host's. */
export const SubnetName: React.FC<{ deviceId?: string; serviceId?: string; copy?: boolean }> = ({
  deviceId,
  serviceId,
  copy,
}) => {
  const { t } = useTranslation()
  const info = useDeviceSessionInfo(deviceId)
  const name = serviceId ? info?.services?.[serviceId] : info?.subnetName

  if (!info || !name) return null

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', minWidth: 0, gap: 0.5 }}>
      {info.actsFor && (
        <Tooltip
          title={t('subnetName.userMode', 'User mode: reaches what {{email}} can', { email: info.actsFor })}
          arrow
        >
          <span>
            <Icon name="user" size="xs" color="primary" />
          </span>
        </Tooltip>
      )}
      <Typography component="span" variant="caption" noWrap>
        {name}
      </Typography>
      {copy && <CopyIconButton sx={{ marginY: -1 }} size="sm" color="gray" value={name} />}
    </Box>
  )
}
