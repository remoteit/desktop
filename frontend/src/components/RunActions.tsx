import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button } from '@mui/material'
import type { DeviceRuns, RunAction, RunState } from '../services/graphQLDeviceRuns'
import { RunActionDialog } from './RunActionDialog'
import { PlainAction, RUN_ACTION, plainActionLabel, plainActionsFor } from '../helpers/exitWords'

type Props = {
  device: { id: string; name: string }
  // The device as a whole, or its proxy or its exit, by name.
  scope: 'device' | { kind: 'proxy' | 'exit'; name: string }
  // Its state there, for the actions that apply; the device as a whole offers each.
  run?: { state: RunState; joining: boolean }
  activation?: string
  disabled?: boolean
  onDone: (runs: DeviceRuns) => void
}

// The actions that apply to a device in a state: none to drain what is not in service, nothing to undrain in service.
export function actionsFor(run?: { state: RunState; joining: boolean }): RunAction[] {
  if (!run) return ['DRAIN', 'UNDRAIN', 'RETIRE', 'REMOVE']
  if (run.state === 'ACTIVE') return ['DRAIN', 'RETIRE', 'REMOVE']
  if (run.state === 'DRAINING') return ['UNDRAIN', 'RETIRE', 'REMOVE']
  return ['UNDRAIN', 'REMOVE']
}

type Choice = { action: RunAction; plain?: PlainAction }

/* For a device as a whole: drain, undrain, retire and remove. For a device in one exit or proxy server: Pause (drain),
   Resume or Approve (undrain), Stop now (retire) and Remove. Each goes through its dialog, which says what it would do
   first (components/RunActionDialog.tsx). */
export const RunActions: React.FC<Props> = ({ device, scope, run, activation, disabled, onDone }) => {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<Choice>()
  const choices: (Choice & { label: string })[] =
    scope === 'device'
      ? actionsFor(run).map(action => ({ action, label: deviceWideVerb(t, action) }))
      : plainActionsFor(run ?? { state: 'ACTIVE', joining: false }, activation).map(plain => ({
          action: RUN_ACTION[plain],
          plain,
          label: plainActionLabel(t, plain),
        }))

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      marginTop={0.5}
      marginLeft={-2}
      data-run-actions={scope === 'device' ? 'device' : scope.kind}
    >
      {choices.map(each => (
        <Button
          key={each.plain ?? each.action}
          size="small"
          color={each.action === 'RETIRE' || each.action === 'REMOVE' ? 'error' : 'primary'}
          disabled={disabled}
          data-action={each.action}
          data-plain={each.plain}
          onClick={event => {
            event.stopPropagation()
            setChoice(each)
          }}
        >
          {each.label}
        </Button>
      ))}
      {choice && (
        <RunActionDialog
          open
          device={device}
          action={choice.action}
          plain={choice.plain}
          scope={scope}
          onClose={() => setChoice(undefined)}
          onDone={onDone}
        />
      )}
    </Box>
  )
}

function deviceWideVerb(t: TFunction, action: RunAction) {
  return {
    DRAIN: t('runAction.drainEverything', 'Pause all'),
    UNDRAIN: t('runAction.undrainEverything', 'Resume all'),
    RETIRE: t('runAction.retireEverything', 'Stop all now'),
    REMOVE: t('runAction.removeEverything', 'Remove from all'),
  }[action]
}
