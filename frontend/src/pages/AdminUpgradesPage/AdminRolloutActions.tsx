import React, { useState } from 'react'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { Confirm } from '../../components/Confirm'
import { RolloutAction, RolloutRun, rolloutAction } from '../../services/graphQLDaemonRollout'
import { active, currentStep, unreviewedCount } from './rolloutHelpers'

type Dialog = 'resume' | 'abortReason' | 'abortConfirm' | 'skip' | 'rate' | undefined

type Props = {
  run: RolloutRun
  served: Set<string> // the mutations this API has
  onDone: (problem?: string) => void
}

// What an operator can do to a live run. Pause takes effect as asked; the rest confirm first. A resume is how the
// operator acknowledges the failures that held the run: the controller marks them reviewed and stops counting them.
export const AdminRolloutActions: React.FC<Props> = ({ run, served, onDone }) => {
  const [dialog, setDialog] = useState<Dialog>()
  const [reason, setReason] = useState('')
  const [rate, setRate] = useState(String(run.rate ?? ''))
  const [busy, setBusy] = useState(false)

  if (!active(run)) return null

  const act = async (action: RolloutAction) => {
    setDialog(undefined)
    setBusy(true)
    const result = await rolloutAction(action)
    setBusy(false)
    onDone(result.ok ? undefined : result.reason)
  }

  const failures = unreviewedCount(run)
  const step = currentStep(run)
  const holding = run.state === 'holding'
  const rateValue = Number(rate)
  const rateValid = rate.trim() !== '' && rateValue > 0 && (run.rateCeiling == null || rateValue <= run.rateCeiling)
  const can = (name: string) => served.has(name) && !busy

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap data-rollout-actions>
        {holding ? (
          <Button
            size="small"
            variant="contained"
            disabled={!can('resumeDaemonRollout')}
            onClick={() => setDialog('resume')}
          >
            Resume
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            disabled={!can('pauseDaemonRollout')}
            onClick={() => act({ name: 'pauseDaemonRollout', id: run.id })}
          >
            Pause
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          disabled={!can('skipDaemonRolloutStep')}
          onClick={() => setDialog('skip')}
        >
          Skip step
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!can('setDaemonRolloutRate')}
          onClick={() => {
            setRate(String(run.rate ?? ''))
            setDialog('rate')
          }}
        >
          Set rate
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          disabled={!can('abortDaemonRollout')}
          onClick={() => {
            setReason('')
            setDialog('abortReason')
          }}
        >
          Abort
        </Button>
      </Stack>

      <Confirm
        open={dialog === 'resume'}
        title="Resume rollout?"
        action="Resume"
        onConfirm={() => act({ name: 'resumeDaemonRollout', id: run.id })}
        onDeny={() => setDialog(undefined)}
      >
        <Typography variant="body2" data-resume-message>
          {failures
            ? `${failures.toLocaleString()} failure${failures === 1 ? '' : 's'} will be marked reviewed`
            : 'No failures to review'}
          , and the run continues from {step.percent ?? '—'}%.
        </Typography>
        {!!failures && (
          <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
            Reviewed failures no longer count against the threshold; a new failure holds it again.
          </Typography>
        )}
      </Confirm>

      <Confirm
        open={dialog === 'skip'}
        title="Skip this step?"
        action="Skip step"
        color="warning"
        onConfirm={() => act({ name: 'skipDaemonRolloutStep', id: run.id })}
        onDeny={() => setDialog(undefined)}
      >
        <Typography variant="body2">
          The run stops soaking at {step.percent ?? '—'}% and moves to the next step of its ladder
          {run.ladder?.length ? ` (${run.ladder.join(', ')}%)` : ''} now.
        </Typography>
      </Confirm>

      <Confirm
        open={dialog === 'rate'}
        title="Set delivery rate"
        action="Set rate"
        disabled={!rateValid}
        onConfirm={() => act({ name: 'setDaemonRolloutRate', id: run.id, rate: rateValue })}
        onDeny={() => setDialog(undefined)}
      >
        <TextField
          autoFocus
          fullWidth
          label="Devices a second"
          type="number"
          value={rate}
          onChange={e => setRate(e.target.value)}
          inputProps={{ min: 0, max: run.rateCeiling ?? undefined, step: 'any' }}
          helperText={run.rateCeiling != null ? `At most ${run.rateCeiling}/s, the run's ceiling` : undefined}
          error={rate !== '' && !rateValid}
        />
      </Confirm>

      <Confirm
        open={dialog === 'abortReason'}
        title="Abort rollout"
        action="Continue"
        color="error"
        disabled={!reason.trim()}
        onConfirm={() => setDialog('abortConfirm')}
        onDeny={() => setDialog(undefined)}
      >
        <TextField
          autoFocus
          fullWidth
          multiline
          label="Reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          helperText="Recorded on the run's event log"
        />
      </Confirm>

      <Confirm
        open={dialog === 'abortConfirm'}
        title="Abort this rollout?"
        action="Abort"
        color="error"
        onConfirm={() => act({ name: 'abortDaemonRollout', id: run.id, reason: reason.trim() })}
        onDeny={() => setDialog(undefined)}
      >
        <Typography variant="body2">
          {run.version} stops at {step.percent ?? '—'}% on {run.channel}. An aborted run cannot be resumed — start a new
          one to continue.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
          Reason: {reason.trim()}
        </Typography>
      </Confirm>
    </>
  )
}
