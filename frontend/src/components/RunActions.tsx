import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button } from '@mui/material'
import type { DeviceRuns, RunAction, RunState } from '../services/graphQLDeviceRuns'
import { RunActionDialog, actionVerb } from './RunActionDialog'

type Props = {
  device: { id: string; name: string }
  // The device as a whole, or its proxy or its exit, by name.
  scope: 'device' | { kind: 'proxy' | 'exit'; name: string }
  // Its state there, for the actions that apply; the device as a whole offers each.
  run?: { state: RunState; joining: boolean }
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

/* Drain, undrain, retire and remove for a device — in everything it runs, or in one proxy or exit —, each through its
   dialog, which says what it would do first (components/RunActionDialog.tsx). */
export const RunActions: React.FC<Props> = ({ device, scope, run, disabled, onDone }) => {
  const { t } = useTranslation()
  const [action, setAction] = useState<RunAction>()

  return (
    <Box display="flex" flexWrap="wrap" gap={1} marginTop={0.5} data-run-actions={scope === 'device' ? 'device' : scope.kind}>
      {actionsFor(run).map(each => (
        <Button
          key={each}
          size="small"
          variant="outlined"
          color={each === 'RETIRE' || each === 'REMOVE' ? 'error' : 'primary'}
          disabled={disabled}
          data-action={each}
          onClick={event => {
            event.stopPropagation()
            setAction(each)
          }}
        >
          {scope === 'device' ? deviceWideVerb(t, each) : undrainLabel(t, each, run)}
        </Button>
      ))}
      {action && (
        <RunActionDialog
          open
          device={device}
          action={action}
          scope={scope}
          onClose={() => setAction(undefined)}
          onDone={onDone}
        />
      )}
    </Box>
  )
}

// A joining device is put in service, not undrained.
function undrainLabel(t: TFunction, action: RunAction, run?: { joining: boolean }) {
  if (action === 'UNDRAIN' && run?.joining) return t('runAction.putInService', 'Put in service')
  return actionVerb(t, action)
}

function deviceWideVerb(t: TFunction, action: RunAction) {
  return {
    DRAIN: t('runAction.drainEverything', 'Drain all'),
    UNDRAIN: t('runAction.undrainEverything', 'Undrain all'),
    RETIRE: t('runAction.retireEverything', 'Retire all'),
    REMOVE: t('runAction.removeEverything', 'Remove from all'),
  }[action]
}
