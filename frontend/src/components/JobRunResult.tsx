import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { ENDED_PHASES, fetchJobRuns, fetchRunOutput, JobRun, RunOutput, UNSUPPORTED } from '../services/jobRuns'
import { jobFailureLine, outputLines, runFailureWords, runFacts, runReason } from '../helpers/runSummary'
import { JobRunStatus } from './JobRunPanel'
import { Icon } from './Icon'
import { radius } from '../styling'

// Enough of a run's output for its first lines, read for a run's row (fetchRunOutput reads the end where there is more).
const PREVIEW_BYTES = 4096

type Props = {
  accountId: string
  jobId: string
  jobDeviceId: string
  run: JobRun
  preview?: boolean // its output's first lines read and shown
}

/* One device's run, on the run's page: how it ended in a few words — the device's own reason where it failed —, the
   account it ran as, its exit code and time, the first lines of its output, and the way to the rest. A run still
   going shows its phase and progress. */
export const JobRunResult: React.FC<Props> = ({ accountId, jobId, jobDeviceId, run, preview }) => {
  const { t } = useTranslation()
  const ended = ENDED_PHASES.includes(run.phase)
  const [output, setOutput] = useState<RunOutput | null>()

  useEffect(() => {
    if (!ended || !preview) return
    let gone = false
    fetchRunOutput(accountId, jobId, jobDeviceId, PREVIEW_BYTES).then(result => {
      if (!gone) setOutput(result && result !== 'ERROR' && result !== UNSUPPORTED ? result : null)
    })
    return () => {
      gone = true
    }
  }, [accountId, jobId, jobDeviceId, ended, preview])

  if (!ended) return <JobRunStatus run={run} />

  const failure = runFailureWords(t, run)
  const reason = failure ? runReason(run) : undefined
  const facts = runFacts(t, run)
  const read = output ? outputLines(output.chunks, output.cut) : undefined
  // A run refused or lost before it started has no output to speak of: nothing said.
  const lines = read && (read.lines.length || run.startedAt) ? read : undefined

  return (
    <Box component="span" display="block" data-run-result>
      <Typography
        component="span"
        display="block"
        variant="body2"
        fontWeight={500}
        color={failure ? 'error' : 'primary'}
        data-run-headline
      >
        {failure ?? t('runSummary.succeeded', 'Succeeded')}
      </Typography>
      {reason && (
        <Typography component="span" display="block" variant="caption" color="grayDarkest.main" data-run-reason>
          {reason}
        </Typography>
      )}
      {!!facts.length && (
        <Typography component="span" display="block" variant="caption" color="grayDarker.main" data-run-facts>
          {facts.join(' · ')}
        </Typography>
      )}
      {lines && (
        <Box
          component="span"
          display="block"
          data-run-output
          sx={{
            bgcolor: 'grayLightest.main',
            borderRadius: `${radius.sm}px`,
            color: lines.lines.length ? 'grayDarkest.main' : 'grayDark.main',
            fontFamily: 'Roboto Mono, monospace',
            fontSize: 12,
            lineHeight: 1.5,
            marginTop: 0.5,
            paddingX: 1.5,
            paddingY: 0.75,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {lines.lines.length ? (output?.cut ? '…\n' : '') + lines.lines.join('\n') : t('jobRun.noOutput', 'No output')}
        </Box>
      )}
      <Typography
        component="span"
        display="block"
        variant="caption"
        color="primary"
        sx={{ marginTop: 0.5 }}
        data-run-full-output
      >
        {t('runSummary.fullOutput', 'Full output')}
        <Icon name="angle-right" size="xs" inline />
      </Typography>
    </Box>
  )
}

// What a failed job's runs say, read once a job and its last change.
const failures = new Map<string, Promise<string | undefined>>()

/* A failed job's row, in a list of runs: what failed in a few words, and where (runSummary jobFailureLine), from its
   first runs. Nothing for a job that did not fail, or on an API without the job runner's fields. */
export const JobFailureNote: React.FC<{ job: IJob }> = ({ job }) => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const [line, setLine] = useState<string>()
  const failed = job.status === 'FAILED'

  useEffect(() => {
    if (!failed) return
    let gone = false
    const key = `${accountId}:${job.id}:${job.updated}`
    let read = failures.get(key)
    if (!read) {
      read = fetchJobRuns(accountId, job.id, 10).then(runs => {
        if (runs === 'ERROR' || runs === UNSUPPORTED) {
          failures.delete(key)
          return undefined
        }
        const names = new Map(job.jobDevices.map(jd => [jd.id, jd.device?.name]))
        return jobFailureLine(
          t,
          Object.entries(runs).map(([id, details]) => ({ run: details.run, name: names.get(id) }))
        )
      })
      failures.set(key, read)
    }
    read.then(words => !gone && setLine(words))
    return () => {
      gone = true
    }
  }, [accountId, job.id, job.updated, failed])

  if (!failed || !line) return null
  return (
    <Typography component="span" display="block" variant="caption" color="error" noWrap data-job-failure>
      {line}
    </Typography>
  )
}
