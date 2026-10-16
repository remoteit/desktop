import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material'
import { ColorChip } from './ColorChip'
import { Icon } from './Icon'
import { radius } from '../styling'
import {
  ENDED_PHASES,
  fetchJobRuns,
  fetchRunOutput,
  formatBytes,
  JobRun,
  JobRunDetails,
  mergeChunks,
  OutputChunk,
  UNSUPPORTED,
} from '../services/jobRuns'
import { watchJobRun } from '../services/jobOutputSocket'
import { jobChangeKey } from '../hooks/useJobDevices'

/* A job's runs on the job runner (device-package docs/scripting-plan.md, "As built (phase 4)"): each run's phase, its
   progress and why it failed, read on their own beside the job; and for the run shown, the account it ran as, its exit,
   its artifacts with their links, and its output — streamed while it runs. Where the API has none of it (an older API,
   or JOB_PORTAL off: every run null) nothing here renders and the page is as it was. */

const ACTIVE_JOB: IJobStatus[] = ['WAITING', 'RUNNING']

// The job's runs — the first `size`, those its page lists, and the run shown — read again whenever the job changes (its
// status or counts here, or its JOB/DEVICE_JOB events while a run is watched: `tick`) or more are listed, at most once a
// second.
export function useJobRuns(
  accountId: string,
  job: IJob | undefined,
  tick = 0,
  size?: number,
  jobDeviceId?: string
): ILookup<JobRunDetails> | undefined {
  const [runs, setRuns] = useState<ILookup<JobRunDetails>>()
  const unsupported = useRef(false)
  const last = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const key = job ? `${jobChangeKey(job)}:${tick}:${size}:${jobDeviceId}` : ''

  useEffect(() => {
    if (!job || unsupported.current) return
    const load = async () => {
      last.current = Date.now()
      const result = await fetchJobRuns(accountId, job.id, size, jobDeviceId)
      if (result === UNSUPPORTED) unsupported.current = true
      else if (result !== 'ERROR') setRuns(result)
    }
    const wait = 1000 - (Date.now() - last.current)
    if (timer.current) clearTimeout(timer.current)
    if (wait <= 0) void load()
    else timer.current = setTimeout(load, wait)
    return () => timer.current && clearTimeout(timer.current)
  }, [key, accountId])

  useEffect(() => setRuns(undefined), [job?.id])
  return unsupported.current ? undefined : runs
}

// While a job has a run on the job runner going: its events wake the page (and the run shown, its output).
export function useJobWatch(job: IJob | undefined, runs: ILookup<JobRunDetails> | undefined, jobDeviceId?: string) {
  const [tick, setTick] = useState(0)
  const [output, setOutput] = useState<{ chunks: OutputChunk[]; skipped: number }>({ chunks: [], skipped: 0 })
  const onRunner = !!runs && Object.values(runs).some(r => r.run)
  const active = !!job && ACTIVE_JOB.includes(job.status)

  useEffect(() => setOutput({ chunks: [], skipped: 0 }), [jobDeviceId])

  useEffect(() => {
    if (!job || !onRunner || !active) return
    return watchJobRun({
      jobId: job.id,
      jobDeviceId: jobDeviceId || '',
      onOutput: (chunks, skipped) =>
        setOutput(o => ({ chunks: mergeChunks(o.chunks, chunks), skipped: o.skipped + skipped })),
      onJob: () => setTick(t => t + 1),
    })
  }, [job?.id, jobDeviceId, onRunner, active])

  return { tick, live: output }
}

type T = TFunction

// A run's phase and why it failed, in words (the API's names where it says one this portal does not know).
function phaseLabel(t: T, phase: string): string {
  switch (phase) {
    case 'queued':
      return t('jobRun.phase.queued', 'Queued')
    case 'held':
      return t('jobRun.phase.held', 'In line')
    case 'waiting':
      return t('jobRun.phase.waiting', 'Waiting for the device')
    case 'transferring':
      return t('jobRun.phase.transferring', 'Sending files')
    case 'running':
      return t('jobRun.phase.running', 'Running')
    case 'succeeded':
      return t('jobRun.phase.succeeded', 'Succeeded')
    case 'failed':
      return t('jobRun.phase.failed', 'Failed')
    case 'cancelled':
      return t('jobRun.phase.cancelled', 'Cancelled')
    default:
      return phase
  }
}

function reasonLabel(t: T, reason: string): string {
  switch (reason) {
    case 'exit-code':
      return t('jobRun.reason.exitCode', 'Script failed')
    case 'timeout':
      return t('jobRun.reason.timeout', 'Timed out')
    case 'file-transfer':
      return t('jobRun.reason.fileTransfer', 'Files not delivered')
    case 'refused':
      return t('jobRun.reason.refused', 'Refused by the device')
    case 'lost':
      return t('jobRun.reason.lost', 'Lost')
    default:
      return reason
  }
}

const PHASE_COLOR: ILookup<Color> = {
  succeeded: 'primary',
  failed: 'danger',
  cancelled: 'danger',
  running: 'primary',
  transferring: 'primary',
  waiting: 'warning',
  held: 'gray',
  queued: 'gray',
}

// A run's phase and progress, as a list row's second line.
export const JobRunStatus: React.FC<{ run: JobRun | null | undefined }> = ({ run }) => {
  const { t } = useTranslation()
  if (!run) return null
  return (
    <Stack direction="row" spacing={1} alignItems="center" component="span">
      <Typography component="span" variant="caption" color="grayDarker.main">
        {phaseLabel(t, run.phase)}
        {run.failureReason ? ` · ${reasonLabel(t, run.failureReason)}` : ''}
        {run.progressPercent != null && !ENDED_PHASES.includes(run.phase) ? ` · ${run.progressPercent}%` : ''}
        {run.progressMessage && !ENDED_PHASES.includes(run.phase) ? ` · ${run.progressMessage}` : ''}
      </Typography>
    </Stack>
  )
}

type PanelProps = {
  accountId: string
  jobId: string
  jobDeviceId: string
  details: JobRunDetails
  live: { chunks: OutputChunk[]; skipped: number }
}

// The run shown: what it is doing or how it ended, its progress, its output and its artifacts.
export const JobRunPanel: React.FC<PanelProps> = ({ accountId, jobId, jobDeviceId, details, live }) => {
  const { t } = useTranslation()
  const run = details.run
  const ended = !!run && ENDED_PHASES.includes(run.phase)
  const [read, setRead] = useState<{ chunks: OutputChunk[]; complete: boolean; cut: boolean }>()
  const pre = useRef<HTMLPreElement>(null)
  const follow = useRef(true)

  // What it has said so far (the live tail, or once it has ended its output.log), read when shown and at its end.
  useEffect(() => {
    if (!run) return
    let gone = false
    fetchRunOutput(accountId, jobId, jobDeviceId).then(result => {
      if (!gone && result && result !== 'ERROR' && result !== UNSUPPORTED) setRead(result)
    })
    return () => {
      gone = true
    }
  }, [jobDeviceId, ended, !!run])

  const chunks = read?.complete ? read.chunks : mergeChunks(read?.chunks || [], live.chunks)

  useEffect(() => {
    if (pre.current && follow.current) pre.current.scrollTop = pre.current.scrollHeight
  }, [chunks.length, chunks[chunks.length - 1]?.text])

  if (!run) return null

  const seconds =
    run.startedAt && (run.endedAt || !ended)
      ? Math.max(0, Math.round(((run.endedAt ? Date.parse(run.endedAt) : Date.now()) - Date.parse(run.startedAt)) / 1000))
      : undefined

  return (
    <Box sx={{ mb: 2 }} data-testid="job-run-panel">
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
        <ColorChip
          size="small"
          label={phaseLabel(t, run.phase)}
          color={PHASE_COLOR[run.phase] || 'gray'}
          data-testid="job-run-phase"
        />
        {run.failureReason && (
          <ColorChip
            size="small"
            color="danger"
            label={reasonLabel(t, run.failureReason)}
          />
        )}
        {run.ranAs && (
          <Typography variant="caption" color="grayDarker.main">
            {t('jobRun.ranAs', { account: run.ranAs, defaultValue: 'as {{account}}' })}
          </Typography>
        )}
        {run.exitCode != null && (
          <Typography variant="caption" color="grayDarker.main">
            {t('jobRun.exitCode', { code: run.exitCode, defaultValue: 'exit {{code}}' })}
            {run.signal ? ` (${run.signal})` : ''}
          </Typography>
        )}
        {seconds !== undefined && (
          <Typography variant="caption" color="grayDarker.main">
            {t('jobRun.seconds', { count: seconds, defaultValue: '{{count}} s' })}
          </Typography>
        )}
      </Stack>
      {run.detail && (
        <Typography variant="caption" component="p" color="grayDarker.main" sx={{ mb: 1 }}>
          {run.detail}
        </Typography>
      )}
      {run.progressPercent != null && !ended && (
        <Box sx={{ mb: 1 }} data-testid="job-run-progress">
          <Typography variant="caption" color="grayDarkest.main">
            {run.progressPercent}%{run.progressMessage ? ` — ${run.progressMessage}` : ''}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={run.progressPercent}
            sx={{ borderRadius: `${radius.sm}px`, height: 6, marginY: 0.5 }}
          />
        </Box>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="subtitle2">
          {t('jobRun.output', 'Output')}
          {!ended && (
            <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
              {t('jobRun.live', 'live')}
            </Typography>
          )}
        </Typography>
        {run.outputBytes != null && (
          <Typography variant="caption" color="grayDarker.main">
            {formatBytes(run.outputBytes)}
            {run.truncated ? ` · ${t('jobRun.truncated', 'cut at its limit')}` : ''}
          </Typography>
        )}
      </Stack>
      {(read?.cut || (!read?.complete && live.skipped > 0)) && (
        <Typography variant="caption" component="p" color="grayDarker.main">
          {read?.complete
            ? t('jobRun.outputCut', 'Showing the end of the output; the logs download has all of it.')
            : t('jobRun.outputSkipped', 'Some output is not shown live; the logs have all of it once the run ends.')}
        </Typography>
      )}
      <Box
        component="pre"
        ref={pre}
        data-testid="job-run-output"
        onScroll={event => {
          const el = event.currentTarget
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
        sx={{
          bgcolor: 'grayLightest.main',
          borderRadius: `${radius.lg}px`,
          fontFamily: 'Roboto Mono, monospace',
          fontSize: 12,
          lineHeight: 1.5,
          margin: 0,
          maxHeight: 360,
          minHeight: 48,
          overflow: 'auto',
          paddingX: 2,
          paddingY: 1,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {chunks.length
          ? chunks.map((c, i) => (
              <Box component="span" key={`${c.seq}-${i}`} sx={c.stream === 2 ? { color: 'danger.main' } : undefined}>
                {c.text}
              </Box>
            ))
          : ended
          ? t('jobRun.noOutput', 'No output')
          : t('jobRun.waitingOutput', 'Waiting for output…')}
      </Box>
      {!!run.artifacts.length && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            {t('jobRun.artifacts', 'Artifacts')}
          </Typography>
          <List dense disablePadding data-testid="job-run-artifacts">
            {run.artifacts.map(a => (
              <ListItem
                key={a.name}
                disableGutters
                component={a.url ? 'a' : 'li'}
                {...(a.url ? { href: a.url, download: a.name.split('/').pop(), rel: 'noopener' } : {})}
                sx={{ color: 'inherit' }}
              >
                <ListItemIcon>
                  <Icon name="arrow-to-bottom" size="md" />
                </ListItemIcon>
                <ListItemText primary={a.name} secondary={`${formatBytes(a.size)} · sha256 ${a.sha256.slice(0, 12)}…`} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  )
}
