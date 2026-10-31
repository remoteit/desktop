import React from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'
import type { DaemonDelivery } from '../../services/graphQLDaemonRollout'
import { dateTime, deliveryProgress, shortDuration, between } from './rolloutHelpers'

// A channel change's delivery: telling each device of its new target, paced to presence.
export const RolloutDelivery: React.FC<{ delivery?: DaemonDelivery | null }> = ({ delivery }) => {
  const progress = deliveryProgress(delivery)
  if (!delivery || !progress)
    return (
      <Typography variant="caption" color="textSecondary" component="div">
        No delivery yet
      </Typography>
    )
  const stalled = delivery.state === 'stalled'
  return (
    <Box data-delivery>
      <Typography variant="caption" component="div">
        Delivery <b>{delivery.state}</b>
        {delivery.version && <> · {delivery.version}</>} · change {delivery.change} · {delivery.perSecond}/s
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, progress.fraction * 100)}
        color={stalled ? 'warning' : progress.done ? 'success' : 'primary'}
        sx={{ height: 6, borderRadius: 1, marginY: 0.5 }}
      />
      <Typography variant="caption" color="textSecondary" component="div">
        {delivery.delivered.toLocaleString()} of {delivery.total.toLocaleString()} delivered · paced{' '}
        {delivery.pacedDelivered.toLocaleString()} · unpaced {delivery.unpacedDelivered.toLocaleString()} · skipped
        unmanaged {delivery.skippedUnmanaged.toLocaleString()} · unchanged {delivery.unchanged.toLocaleString()}
        {!!delivery.failed && <> · failed {delivery.failed.toLocaleString()}</>}
      </Typography>
      <Typography variant="caption" color="textSecondary" component="div">
        Started {dateTime(delivery.startedAt)}
        {delivery.finishedAt
          ? ` · finished ${dateTime(delivery.finishedAt)} (${shortDuration(
              between(delivery.startedAt, delivery.finishedAt)
            )})`
          : ` · ${delivery.remaining.toLocaleString()} remaining`}
        {progress.etaMs !== undefined && ` · ETA ${shortDuration(progress.etaMs)}`}
        {delivery.retryAt && ` · retry ${dateTime(delivery.retryAt)}`}
      </Typography>
      {delivery.error && (
        <Typography variant="caption" color="error" component="div">
          {delivery.error}
        </Typography>
      )}
    </Box>
  )
}
