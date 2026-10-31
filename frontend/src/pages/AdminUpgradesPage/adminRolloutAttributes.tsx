import React from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import { Attribute } from '../../components/Attributes'
import type { RolloutRun } from '../../services/graphQLDaemonRollout'
import {
  active,
  between,
  holdCause,
  dateTime,
  failureCount,
  shortDuration,
  startedByLabel,
  stepLabel,
} from './rolloutHelpers'

export type AdminRolloutAttributeOptions = { run?: RolloutRun }

export class AdminRolloutAttribute extends Attribute<AdminRolloutAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
  translate = false // internal-only admin registry: render English, skip columns.* translation
}

const STATE_COLORS: ILookup<'primary' | 'warning' | 'error' | 'success' | 'default'> = {
  running: 'primary',
  soaking: 'primary',
  holding: 'warning',
  aborted: 'error',
  done: 'success',
  cancelled: 'default',
}

export const RolloutStateChip: React.FC<{ run: Pick<RolloutRun, 'state' | 'reason'> }> = ({ run }) => {
  const chip = (
    <Chip
      size="small"
      label={run.state}
      color={STATE_COLORS[run.state] || 'default'}
      variant={active(run) ? 'filled' : 'outlined'}
    />
  )
  return run.reason ? <Tooltip title={run.reason}>{chip}</Tooltip> : chip
}

const clip = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const

export const adminRolloutAttributes: AdminRolloutAttribute[] = [
  new AdminRolloutAttribute({
    id: 'version',
    label: 'Version',
    defaultWidth: 220,
    required: true,
    value: ({ run }: AdminRolloutAttributeOptions) => (
      <Box sx={clip}>
        {run?.version || '—'}
        <Box component="span" sx={{ color: 'grayDark.main', marginLeft: 1 }}>
          {run?.channel}
        </Box>
      </Box>
    ),
  }),
  new AdminRolloutAttribute({
    id: 'state',
    label: 'State',
    defaultWidth: 220,
    value: ({ run }: AdminRolloutAttributeOptions) =>
      run ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <RolloutStateChip run={run} />
          {(holdCause(run) || run.reason) && (
            <Box sx={clip}>
              {holdCause(run) ? `${holdCause(run)?.label}${run.reason ? `: ${run.reason}` : ''}` : run.reason}
            </Box>
          )}
        </Box>
      ) : null,
  }),
  new AdminRolloutAttribute({
    id: 'step',
    label: 'Step',
    defaultWidth: 120,
    value: ({ run }: AdminRolloutAttributeOptions) => (run ? stepLabel(run) : '—'),
  }),
  new AdminRolloutAttribute({
    id: 'failures',
    label: 'Failures',
    defaultWidth: 90,
    value: ({ run }: AdminRolloutAttributeOptions) => {
      const count = run && failureCount(run)
      return count ? <Box sx={{ color: 'danger.main', fontWeight: 500 }}>{count.toLocaleString()}</Box> : count ?? '—'
    },
  }),
  new AdminRolloutAttribute({
    id: 'fromVersion',
    label: 'From',
    defaultWidth: 200,
    value: ({ run }: AdminRolloutAttributeOptions) => run?.fromVersion || '—',
  }),
  new AdminRolloutAttribute({
    id: 'mode',
    label: 'Mode',
    defaultWidth: 80,
    value: ({ run }: AdminRolloutAttributeOptions) => run?.mode || '—',
  }),
  new AdminRolloutAttribute({
    id: 'startedAt',
    label: 'Started',
    defaultWidth: 170,
    value: ({ run }: AdminRolloutAttributeOptions) => dateTime(run?.startedAt),
  }),
  new AdminRolloutAttribute({
    id: 'endedAt',
    label: 'Ended',
    defaultWidth: 170,
    value: ({ run }: AdminRolloutAttributeOptions) => dateTime(run?.endedAt),
  }),
  new AdminRolloutAttribute({
    id: 'duration',
    label: 'Duration',
    defaultWidth: 100,
    value: ({ run }: AdminRolloutAttributeOptions) =>
      shortDuration(between(run?.startedAt, run?.endedAt ?? (active(run) ? null : run?.startedAt))),
  }),
  new AdminRolloutAttribute({
    id: 'startedBy',
    label: 'Started by',
    defaultWidth: 200,
    value: ({ run }: AdminRolloutAttributeOptions) => startedByLabel(run?.startedBy),
  }),
]
