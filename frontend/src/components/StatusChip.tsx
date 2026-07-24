import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorChip } from './ColorChip'
import { Duration } from './Duration'
import { Badge, Tooltip } from '@mui/material'

export type Props = {
  device?: IDevice
  service?: IService
  connections?: IConnection[]
}

const RESENT_THRESHOLD = 1000 * 60 * 30

function badgeState(device?: IDevice) {
  const offlineDuration = Date.now() - (device?.offlineSince || 0)
  const onlineDuration = Date.now() - (device?.onlineSince || 0)
  return {
    dropped: offlineDuration < RESENT_THRESHOLD && offlineDuration < onlineDuration,
    activated: onlineDuration < RESENT_THRESHOLD && onlineDuration < offlineDuration,
  }
}

export const StatusChip: React.FC<Props> = ({ device, service, connections }) => {
  const { t } = useTranslation()
  const [badge, setBadge] = useState(badgeState(device))
  const instance = device || service

  useEffect(() => {
    if (!device) return

    let timer: NodeJS.Timeout
    const state = badgeState(device)

    if (state.dropped || state.activated) {
      const remaining = RESENT_THRESHOLD - (Date.now() - (state.dropped ? device.offlineSince : device.onlineSince))
      timer = setTimeout(() => setBadge(badgeState(device)), remaining)
    }

    setBadge(state)
    return () => clearTimeout(timer)
  }, [device])

  const Chip =
    instance?.license === 'UNLICENSED' ? (
      <ColorChip label={t('statusChip.unlicensed', 'Unlicensed')} size="small" color="warning" />
    ) : instance?.state === 'inactive' ? (
      <ColorChip label={t('statusChip.offline', 'Offline')} size="small" color="gray" />
    ) : connections?.some(c => c.connected) ? (
      <ColorChip label={t('statusChip.connected', 'Connected')} size="small" color="primary" variant="contained" />
    ) : device?.services.some(s => s.link?.enabled && s.link?.web) || (service?.link?.enabled && service?.link?.web) ? (
      <ColorChip label={t('statusChip.public', 'Public')} size="small" color="primary" />
    ) : connections?.some(c => c.enabled && c.online) ? (
      <ColorChip label={t('statusChip.idle', 'Idle')} size="small" color="primary" />
    ) : instance?.state === 'active' ? (
      <ColorChip label={t('statusChip.online', 'Online')} size="small" color="success" />
    ) : (
      <ColorChip label={t('statusChip.unknown', 'Unknown')} size="small" color="gray" />
    )

  return badge.dropped || badge.activated ? (
    <Tooltip
      arrow
      placement="top"
      title={
        <>
          {badge.dropped ? t('statusChip.offlineLabel', 'Offline ') : t('statusChip.onlineLabel', 'Online ')}
          <Duration
            startTime={badge.dropped ? device?.offlineSince : device?.onlineSince}
            humanizeOptions={{ largest: 1 }}
            ago
          />
        </>
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
