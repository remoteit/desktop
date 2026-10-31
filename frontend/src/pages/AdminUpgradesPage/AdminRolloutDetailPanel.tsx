import React, { useCallback, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  Box,
  Chip,
  List,
  ListSubheader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Link } from '../../components/Link'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { Title } from '../../components/Title'
import { IconButton } from '../../buttons/IconButton'
import { spacing } from '../../styling'
import { UNSUPPORTED } from '../../services/graphQLDaemon'
import { RolloutRun, graphQLDaemonRollout, rolloutActionsServed } from '../../services/graphQLDaemonRollout'
import { AdminRolloutActions } from './AdminRolloutActions'
import { RolloutStateChip } from './adminRolloutAttributes'
import { RolloutBucketBar } from './RolloutBucketBar'
import { RolloutDelivery } from './RolloutDelivery'
import { usePoll } from './useUpgrades'
import {
  GateLevel,
  UPGRADES_ROUTE,
  active,
  between,
  dateTime,
  failureRows,
  gateReadings,
  heldForFailures,
  shortDuration,
  startedByLabel,
  stepLabel,
  stepTimes,
} from './rolloutHelpers'

type Props = { showBackArrow?: boolean; onChanged: () => void }

const LEVEL_COLORS: Record<GateLevel, string> = {
  ok: 'success.main',
  hold: 'warning.main',
  abort: 'danger.main',
  unknown: 'grayDark.main',
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <List>
      <ListSubheader disableGutters>
        <Gutters>{title}</Gutters>
      </ListSubheader>
    </List>
    <Gutters>{children}</Gutters>
  </>
)

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box sx={{ minWidth: 140 }}>
    <Typography variant="caption" color="textSecondary" component="div">
      {label}
    </Typography>
    <Typography variant="body2" component="div" sx={{ wordBreak: 'break-all' }}>
      {children ?? '—'}
    </Typography>
  </Box>
)

const cell = { paddingX: 1, paddingY: 0.5, whiteSpace: 'nowrap' } as const
const n = (value?: number | null) => (value == null ? '—' : value.toLocaleString())

const FailureList: React.FC<{ run: RolloutRun; prominent: boolean }> = ({ run, prominent }) => {
  const rows = failureRows(run.rollout?.candidate?.failures ?? run.rollout?.failures, run.reviewedFailures)
  if (!rows.length)
    return (
      <Typography variant="caption" color="textSecondary">
        No failures
      </Typography>
    )
  const showReviewed = rows.some(row => row.reviewed)
  return (
    <Box
      data-failures
      sx={
        prominent
          ? { border: 2, borderColor: 'danger.main', borderRadius: 2, padding: 1, bgcolor: 'warningHighlight.main' }
          : undefined
      }
    >
      {prominent && (
        <Typography variant="body2" color="error" sx={{ fontWeight: 500, marginBottom: 0.5 }}>
          Held for failures — review them, then Resume to acknowledge.
        </Typography>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={cell}>Devices</TableCell>
            {showReviewed && <TableCell sx={cell}>New</TableCell>}
            {showReviewed && <TableCell sx={cell}>Reviewed</TableCell>}
            <TableCell sx={cell}>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.reason} data-failure={row.reason} sx={{ opacity: row.unreviewed ? 1 : 0.6 }}>
              <TableCell sx={cell}>{n(row.devices)}</TableCell>
              {showReviewed && (
                <TableCell sx={{ ...cell, color: row.unreviewed ? 'danger.main' : undefined, fontWeight: 500 }}>
                  {n(row.unreviewed)}
                </TableCell>
              )}
              {showReviewed && (
                <TableCell sx={cell}>
                  {row.reviewed ? <Chip size="small" label={`${n(row.reviewed)} reviewed`} /> : '—'}
                </TableCell>
              )}
              <TableCell sx={{ ...cell, whiteSpace: 'normal' }}>
                {row.reason}
                {!!row.deviceIds.length && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginTop: 0.25 }}>
                    {row.deviceIds.map(id => (
                      <Link key={id} to={`/admin/devices/${id}`}>
                        {id}
                      </Link>
                    ))}
                    {row.deviceIds.length < row.devices && (
                      <Typography variant="caption" color="textSecondary">
                        + {n(row.devices - row.deviceIds.length)} more
                      </Typography>
                    )}
                  </Box>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!rows.some(row => row.deviceIds.length) && (
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginTop: 0.5 }}>
          This API does not name the failing devices; find them under Devices by their agent's state.
        </Typography>
      )}
    </Box>
  )
}

export const AdminRolloutDetailPanel: React.FC<Props> = ({ showBackArrow, onChanged }) => {
  const { rolloutId } = useParams<{ rolloutId?: string }>()
  const history = useHistory()
  const [run, setRun] = useState<RolloutRun | null | false | 'ERROR' | typeof UNSUPPORTED>()
  const [served, setServed] = useState<Set<string>>(new Set())
  const [problem, setProblem] = useState<string>()

  const load = useCallback(async () => {
    if (!rolloutId) return
    const [next, actions] = await Promise.all([graphQLDaemonRollout(rolloutId), rolloutActionsServed()])
    setRun(next)
    setServed(actions)
  }, [rolloutId])

  usePoll(load, typeof run === 'object' && !!run && active(run))

  const handleBack = () => history.push(UPGRADES_ROUTE)

  const header = (
    <Box>
      {showBackArrow && (
        <Box
          sx={{
            height: 45,
            display: 'flex',
            alignItems: 'center',
            paddingX: `${spacing.md}px`,
            marginTop: `${spacing.sm}px`,
          }}
        >
          <IconButton icon="chevron-left" title="Back to Upgrades" onClick={handleBack} size="md" color="grayDarker" />
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, padding: 2, paddingBottom: 1, flexWrap: 'wrap' }}>
        <Typography variant="h2">
          <Title>{typeof run === 'object' && run ? `${run.version || 'Rollout'} on ${run.channel}` : 'Rollout'}</Title>
        </Typography>
        {typeof run === 'object' && run && <RolloutStateChip run={run} />}
        <Box sx={{ flex: 1 }} />
        <IconButton icon="sync" title="Refresh" onClick={load} size="md" />
      </Box>
    </Box>
  )

  if (run === undefined) return <LoadingMessage message="Loading rollout..." />
  if (run === null || run === false || run === 'ERROR' || run === UNSUPPORTED)
    return (
      <Container gutterBottom header={header}>
        <Gutters>
          <Notice severity={run === 'ERROR' ? 'error' : 'info'} fullWidth>
            {run === 'ERROR'
              ? 'Could not read the rollout.'
              : run === null
              ? 'Rollout not found'
              : 'This API has no rollout controller.'}
          </Notice>
        </Gutters>
      </Container>
    )

  const failuresHold = heldForFailures(run)
  const steps = run.steps || []
  const events = [...(run.events || [])].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  const live = active(run)

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true, horizontalOverflow: true }} header={header}>
      <Gutters>
        {run.reason && (
          <Notice severity={run.state === 'aborted' ? 'error' : run.state === 'holding' ? 'warning' : 'info'} fullWidth>
            {run.reason}
          </Notice>
        )}
        {problem && (
          <Notice severity="error" fullWidth onClose={() => setProblem(undefined)}>
            {problem}
          </Notice>
        )}
        <AdminRolloutActions
          run={run}
          served={served}
          onDone={async next => {
            setProblem(next)
            await load()
            onChanged()
          }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
          <Fact label="Step">{stepLabel(run)}</Fact>
          <Fact label="Ladder">{run.ladder?.length ? run.ladder.map(p => `${p}%`).join(' → ') : '—'}</Fact>
          <Fact label="From">{run.fromVersion}</Fact>
          <Fact label="Mode">{run.mode}</Fact>
          <Fact label="Rate">
            {run.rate != null ? `${run.rate}/s` : '—'}
            {run.rateCeiling != null && ` (ceiling ${run.rateCeiling}/s)`}
          </Fact>
          <Fact label="Soak">
            {run.soakMinutes != null ? `${run.soakMinutes} min` : '—'}
            {run.firstSoakMinutes != null && ` (first ${run.firstSoakMinutes} min)`}
          </Fact>
          <Fact label="Failure threshold">{run.failureThreshold != null ? n(run.failureThreshold) : '—'}</Fact>
          <Fact label="Promote when done">
            {run.promoteWhenDone == null ? '—' : run.promoteWhenDone ? 'yes' : 'no'}
          </Fact>
          <Fact label="Started">{dateTime(run.startedAt)}</Fact>
          <Fact label="Ended">{dateTime(run.endedAt)}</Fact>
          <Fact label="Duration">
            {shortDuration(between(run.startedAt, run.endedAt ?? (live ? null : run.startedAt)))}
          </Fact>
          <Fact label="Started by">{startedByLabel(run.startedBy)}</Fact>
          {(run.manifest || run.candidateManifest) && (
            <Fact label="Manifest">{run.manifest || run.candidateManifest}</Fact>
          )}
        </Box>
      </Gutters>

      {failuresHold && (
        <Section title="Failures">
          <FailureList run={run} prominent />
        </Section>
      )}

      <Section title="Gates">
        <Table size="small" data-gates>
          <TableHead>
            <TableRow>
              <TableCell sx={cell}>Gate</TableCell>
              <TableCell sx={cell}>Reading</TableCell>
              <TableCell sx={cell}>Threshold</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gateReadings(run.gates, run.failureThreshold).map(gate => (
              <TableRow key={gate.id} data-gate={gate.id}>
                <TableCell sx={cell}>{gate.label}</TableCell>
                <TableCell sx={{ ...cell, color: LEVEL_COLORS[gate.level], fontWeight: 500 }}>
                  {gate.value == null ? '—' : `${Math.round(gate.value * 10) / 10}${gate.unit || ''}`}
                </TableCell>
                <TableCell sx={{ ...cell, color: 'grayDarker.main' }}>{gate.threshold}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {run.gates?.at && (
          <Typography variant="caption" color="textSecondary">
            Read {dateTime(run.gates.at)}
          </Typography>
        )}
      </Section>

      <Section title="Devices">
        {run.rollout ? (
          <>
            <RolloutBucketBar buckets={run.rollout.candidate} label={`On ${run.version || 'the candidate'}`} />
            <RolloutBucketBar buckets={run.rollout} label="Whole channel" legend={false} />
            <Typography variant="caption" color="textSecondary" component="div">
              Counted {dateTime(run.rollout.checked)} · stuck after {run.rollout.stuckMinutes} min
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="textSecondary">
            No bucket counts on this run
          </Typography>
        )}
        <Box sx={{ marginTop: 1 }}>
          <RolloutDelivery delivery={run.delivery} />
        </Box>
      </Section>

      <Section title="Steps">
        {!steps.length ? (
          <Typography variant="caption" color="textSecondary">
            No steps yet
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" data-steps>
              <TableHead>
                <TableRow>
                  {[
                    'Step',
                    'Started',
                    'Deliver',
                    'Converge',
                    'Soak',
                    'Paced',
                    'Unpaced',
                    'Skipped',
                    'Failed',
                    'Peak CPU',
                    'Rate',
                  ].map(label => (
                    <TableCell key={label} sx={cell}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {steps.map((step, index) => {
                  const current = live && index === steps.length - 1
                  const times = stepTimes(step, current)
                  return (
                    <TableRow
                      key={`${step.percent}-${index}`}
                      data-step={step.percent}
                      sx={current ? { bgcolor: 'primaryHighlight.main' } : undefined}
                    >
                      <TableCell sx={{ ...cell, fontWeight: 500 }}>{step.percent}%</TableCell>
                      <TableCell sx={cell}>{dateTime(step.startedAt)}</TableCell>
                      <TableCell sx={cell}>{shortDuration(times.deliver)}</TableCell>
                      <TableCell sx={cell}>{shortDuration(times.converge)}</TableCell>
                      <TableCell sx={cell}>{shortDuration(times.soak)}</TableCell>
                      <TableCell sx={cell}>{n(step.paced)}</TableCell>
                      <TableCell sx={cell}>{n(step.unpaced)}</TableCell>
                      <TableCell sx={cell}>{n(step.skippedUnmanaged)}</TableCell>
                      <TableCell sx={{ ...cell, color: step.failed ? 'danger.main' : undefined }}>
                        {n(step.failed)}
                      </TableCell>
                      <TableCell sx={cell}>{step.peakCpu == null ? '—' : `${Math.round(step.peakCpu)}%`}</TableCell>
                      <TableCell sx={cell}>{step.rate == null ? '—' : `${step.rate}/s`}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Section>

      {!failuresHold && (
        <Section title="Failures">
          <FailureList run={run} prominent={false} />
        </Section>
      )}

      <Section title="Events">
        {!events.length ? (
          <Typography variant="caption" color="textSecondary">
            No events
          </Typography>
        ) : (
          <Box data-events>
            {events.map((event, index) => (
              <Box key={`${event.at}-${index}`} sx={{ display: 'flex', gap: 1, paddingY: 0.25 }}>
                <Typography variant="caption" color="textSecondary" sx={{ minWidth: 130, flexShrink: 0 }}>
                  {dateTime(event.at)}
                </Typography>
                <Typography variant="caption" sx={{ minWidth: 80, flexShrink: 0, fontWeight: 500 }}>
                  {event.kind}
                </Typography>
                <Typography variant="caption">{event.message}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Section>
    </Container>
  )
}
