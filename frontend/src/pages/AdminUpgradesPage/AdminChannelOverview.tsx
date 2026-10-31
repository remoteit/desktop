import React, { useState } from 'react'
import { Box, Chip, Link, Typography } from '@mui/material'
import type {
  DaemonBuckets,
  DaemonChannel,
  DaemonChannelRollout,
  DaemonFailure,
} from '../../services/graphQLDaemonRollout'
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
    <Box data-managed-line sx={{ marginBottom: 1.5 }}>
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

// The channel's two groups as bars: every managed device, then the candidate group — the percent chosen to run the
// candidate — each headed with what it is and its count, each with its legend.
export const ChannelBars: React.FC<{
  rollout?: DaemonChannelRollout | null
  channel: string
  percent?: number | null
  candidate?: string | null
  current?: string | null
}> = ({ rollout, channel, percent, candidate, current }) => (
  <>
    <RolloutBucketBar
      buckets={rollout}
      label={`Whole channel: every managed device on ${channel}`}
      hint={
        candidate
          ? `Devices outside the candidate group want current${current ? ` (${current})` : ''}.`
          : `Every device wants current${current ? ` (${current})` : ''}.`
      }
    />
    {candidate && !!rollout?.candidate?.wanted && (
      <RolloutBucketBar
        buckets={rollout.candidate}
        label={`Candidate group: the ${percent ?? '—'}% selected for ${candidate}`}
        hint="Devices chosen to run the candidate."
      />
    )}
  </>
)

// Failures by the group they are in, where graphql gives the split (the candidate group; the rest — current and pinned);
// else the channel's, labelled so.
export const merged = (...lists: (DaemonFailure[] | undefined | null)[]) => {
  const by = new Map<string, number>()
  for (const list of lists) for (const f of list || []) by.set(f.reason, (by.get(f.reason) || 0) + f.devices)
  return [...by].map(([reason, devices]) => ({ reason, devices })).sort((a, b) => b.devices - a.devices)
}

export const ChannelFailures: React.FC<{ rollout?: DaemonChannelRollout | null; skipCandidate?: boolean }> = ({
  rollout,
  skipCandidate,
}) => {
  if (!rollout) return null
  const split = !!rollout.candidate?.failures && !!rollout.current?.failures
  if (!split) return <ReasonList title="Failures · whole channel" reasons={rollout.failures} color="error" />
  const rest = merged(rollout.current.failures, rollout.pinned?.failures)
  return (
    <Box data-channel-failures>
      {!skipCandidate && (
        <ReasonList title="Failures · candidate group" reasons={rollout.candidate.failures} color="error" />
      )}
      {rest.length || !rollout.candidate.failures?.length ? (
        <ReasonList title="Failures · rest of the channel" reasons={rest} color="error" />
      ) : (
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginTop: 0.5 }}>
          Failures · rest of the channel: none
        </Typography>
      )}
    </Box>
  )
}

// One release channel as it stands: what it runs and offers, where its devices are, and its delivery.
export const AdminChannelOverview: React.FC<{ channel: DaemonChannel }> = ({ channel }) => {
  const rollout = channel.rollout
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
      <ManagedLine buckets={rollout} />
      <ChannelBars
        rollout={rollout}
        channel={channel.channel}
        percent={channel.percent}
        candidate={channel.candidate?.version}
        current={channel.current?.version}
      />
      <ChannelFailures rollout={rollout} />
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
