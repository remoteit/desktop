import React from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import type { DaemonBuckets } from '../../services/graphQLDaemonRollout'
import { bucketSegments, managed, percentOf } from './rolloutHelpers'

type Props = { buckets?: DaemonBuckets | null; label?: React.ReactNode; legend?: boolean }

// The managed devices' buckets as one bar, each segment its share of those a rollout can reach.
export const RolloutBucketBar: React.FC<Props> = ({ buckets, label, legend = true }) => {
  const segments = bucketSegments(buckets)
  const wanted = managed(buckets)
  return (
    <Box sx={{ marginBottom: 1.5 }} data-bucket-bar>
      {label && (
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginBottom: 0.5 }}>
          {label} · {wanted.toLocaleString()} managed devices
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          height: 14,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'grayLighter.main',
        }}
      >
        {segments
          .filter(segment => segment.count)
          .map(segment => (
            <Tooltip
              key={segment.key}
              title={`${segment.label}: ${segment.count.toLocaleString()} (${percentOf(segment.count, wanted)}%) — ${
                segment.help
              }`}
            >
              <Box
                data-segment={segment.key}
                sx={{ width: `${segment.fraction * 100}%`, minWidth: 3, bgcolor: segment.color }}
              />
            </Tooltip>
          ))}
      </Box>
      {legend && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.25, marginTop: 0.75 }}>
          {segments.map(segment => (
            <Tooltip key={segment.key} title={segment.help}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: segment.count ? 1 : 0.5 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: segment.color }} />
                <Typography variant="caption">
                  {segment.label} <b>{segment.count.toLocaleString()}</b>
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}
    </Box>
  )
}
