import React, { useState } from 'react'
import { useInterval } from '../hooks/useInterval'
import { ColorChip } from './ColorChip'
import { Duration } from './Duration'
import { Badge, Tooltip } from '@mui/material'

export type Props = {
  device?: IDevice
  service?: IService
  connections?: IConnection[]
}

const RESENT_THRESHOLD = 1000 * 60 * 30

export const StatusChip: React.FC<Props> = ({ device, service, connections }) => {
  const [badge, setBadge] = useState({ dropped: false, activated: false })
  const instance = device || service

  useInterval(() => {
    if (device) {
      const offlineDuration = Date.now() - device.offlineSince
      const onlineDuration = Date.now() - device.onlineSince
      setBadge({
        dropped: offlineDuration < RESENT_THRESHOLD && offlineDuration < onlineDuration,
        activated: onlineDuration < RESENT_THRESHOLD && onlineDuration < offlineDuration,
      })
    }
  }, 1000 * 60)

  const Chip =
    instance?.license === 'UNLICENSED' ? (
      <ColorChip label="Unlicensed" size="small" color="warning" />
    ) : instance?.state === 'inactive' ? (
      <ColorChip label="Offline" size="small" color="gray" />
    ) : connections?.some(c => c.connected) ? (
      <ColorChip label="Connected" size="small" color="primary" variant="contained" />
    ) : connections?.some(c => c.connectLink) ? (
      <ColorChip label="Public" size="small" color="primary" variant="contained" />
    ) : connections?.some(c => c.enabled && c.online) ? (
      <ColorChip label="Idle" size="small" color="primary" />
    ) : instance?.state === 'active' ? (
      <ColorChip label="Online" size="small" color="secondary" />
    ) : (
      <ColorChip label="Unknown" size="small" color="gray" />
    )

  return badge.dropped || badge.activated ? (
    <Tooltip
      arrow
      placement="top"
      title={
        <Duration
          startTime={badge.dropped ? device?.offlineSince : device?.onlineSince}
          humanizeOptions={{ largest: 1 }}
          ago
        />
      }
    >
      <Badge variant="dot" color={badge.activated ? 'primary' : 'warning'} sx={{ marginY: 0.5, marginRight: 0.5 }}>
        {Chip}
      </Badge>
    </Tooltip>
  ) : (
    Chip
  )
}
