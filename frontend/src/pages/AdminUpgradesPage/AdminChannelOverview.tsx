import React, { useState } from 'react'
import { Box, Chip, Link, Typography } from '@mui/material'
import type { DaemonBuckets, DaemonChannel, DaemonFailure } from '../../services/graphQLDaemonRollout'
import { RolloutBucketBar } from './RolloutBucketBar'
import { RolloutDelivery } from './RolloutDelivery'
import { dateTime, managed } from './rolloutHelpers'

export const ReasonList: React.FC<{ title: string; reasons?: DaemonFailure[]; color?: string }> = ({
  title,
  reasons,
  color,
}) =>
  reasons?.length ? (
    <Box sx={{ marginTop: 0.5 }}>
      <Typography variant="caption" color="textSecondary" component="div">
        {title}
      </Typography>
      {reasons.map(reason => (
        <Typography key={reason.reason} variant="caption" component="div" sx={{ paddingLeft: 1 }} color={color}>
          <b>{reason.devices.toLocaleString()}</b> {reason.reason}
        </Typography>
      ))}
    </Box>
  ) : null

// How many devices the release reaches and how many it cannot: the unmanaged count opens its reasons.
export const ManagedLine: React.FC<{ buckets?: DaemonBuckets | null }> = ({ buckets }) => {
  const [open, setOpen] = useState(false)
  if (!buckets?.wanted) return null
  const unmanaged = buckets.unmanaged || 0
  return (
    <Box data-managed-line sx={{ marginBottom: 0.5 }}>
      <Typography variant="caption" color="textSecondary" component="div">
        {managed(buckets).toLocaleString()} managed ·{' '}
        {unmanaged && buckets.unmanagedReasons?.length ? (
          <Link component="button" variant="caption" onClick={() => setOpen(!open)} data-unmanaged-toggle>
            {unmanaged.toLocaleString()} unmanaged
          </Link>
        ) : (
          `${unmanaged.toLocaleString()} unmanaged`
        )}
      </Typography>
      {open && <ReasonList title="Unmanaged: no package, or no updates" reasons={buckets.unmanagedReasons} />}
    </Box>
  )
}

// One release channel as it stands: what it runs and offers, where its devices are, and its delivery.
export const AdminChannelOverview: React.FC<{ channel: DaemonChannel }> = ({ channel }) => {
  const rollout = channel.rollout
  const cohort = rollout?.candidate
  const targeted = channel.accounts.length + channel.devices.length
  return (
    <Box
      data-channel={channel.channel}
      sx={{ border: 1, borderColor: 'grayLight.main', borderRadius: 2, padding: 1.5, marginBottom: 1.5 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, marginBottom: 1 }}>
        <Typography variant="h3" sx={{ textTransform: 'capitalize', marginRight: 1 }}>
          {channel.channel}
        </Typography>
        <Chip size="small" variant="outlined" label={`current ${channel.current?.version || 'none'}`} />
        {channel.candidate ? (
          <Chip
            size="small"
            color="primary"
            label={`candidate ${channel.candidate.version} at ${channel.percent}%${
              channel.candidate.rollback ? ' (rollback)' : ''
            }`}
          />
        ) : (
          <Chip size="small" variant="outlined" label="no candidate" />
        )}
        {!!targeted && (
          <Chip
            size="small"
            variant="outlined"
            label={`+ ${channel.accounts.length} accounts, ${channel.devices.length} devices named`}
          />
        )}
      </Box>
      <RolloutBucketBar buckets={rollout} label="Channel" />
      <ManagedLine buckets={rollout} />
      {!!cohort?.wanted && <RolloutBucketBar buckets={cohort} label="Candidate cohort" legend={false} />}
      <ReasonList title="Failures" reasons={rollout?.failures} color="error" />
      {rollout && (
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginY: 0.5 }}>
          Counted {dateTime(rollout.checked)} · stuck after {rollout.stuckMinutes} min
          {channel.updated && ` · channel changed ${dateTime(channel.updated)}`}
        </Typography>
      )}
      <Box sx={{ marginTop: 1 }}>
        <RolloutDelivery delivery={channel.delivery} />
      </Box>
    </Box>
  )
}
