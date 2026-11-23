import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Checkbox, FormControlLabel, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'
import {
  DeviceActionEffect,
  DeviceRuns,
  RunAction,
  graphQLActionEffects,
  graphQLRunAction,
} from '../services/graphQLDeviceRuns'
import { effectLines } from '../helpers/runsHelper'
import { PlainAction, plainActionLabel, plainActionOf, plainEffectLines } from '../helpers/exitWords'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { LoadingMessage } from './LoadingMessage'
import { Confirm } from './Confirm'
import { Notice } from './Notice'

export const DEFAULT_MAX_WAIT = 60

type Props = {
  open: boolean
  device: { id: string; name: string }
  action: RunAction
  // How the action was offered in one exit or proxy server: its plain words in the title, button and effects.
  plain?: PlainAction
  // The device as a whole — every proxy and exit it runs —, or one of them alone, by name.
  scope: 'device' | { kind: 'proxy' | 'exit'; name: string }
  onClose: () => void
  onDone: (runs: DeviceRuns) => void
}

/* An action on a device in what it runs (graphql-api docs/PROXY-GROUPS.md §13, "Device actions"): what it would do to
   each proxy and exit — or to the one acted on — is read first and said (Device.actionEffects), and only then is it
   taken. A drain says how long it waits for open connections; a retire with connections open is refused unless they
   are ended, which is asked for here; any other refusal is graphql's, said as it stands, and nothing is done. */
export const RunActionDialog: React.FC<Props> = ({ open, device, action, plain, scope, onClose, onDone }) => {
  const { t } = useTranslation()
  const [effects, setEffects] = useState<DeviceActionEffect[] | 'ERROR'>()
  const [force, setForce] = useState(false)
  const [maxWait, setMaxWait] = useState(String(DEFAULT_MAX_WAIT))
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const kind = scope === 'device' ? undefined : scope.kind
  const words = kind ? plain ?? plainActionOf(action) : undefined
  const said = plain ?? plainActionOf(action)

  useEffect(() => {
    if (!open) return
    let live = true
    setEffects(undefined)
    setRefusal(undefined)
    graphQLActionEffects(device.id, action, force).then(read => {
      if (!live) return
      if (!Array.isArray(read)) return setEffects('ERROR')
      setEffects(kind ? read.filter(effect => effect.kind === kind) : read)
    })
    return () => {
      live = false
    }
  }, [open, device.id, action, force, kind])

  useEffect(() => {
    if (open) {
      setForce(false)
      setMaxWait(String(DEFAULT_MAX_WAIT))
    }
  }, [open])

  const wait = Number(maxWait)
  const waitValid = action !== 'DRAIN' || (Number.isInteger(wait) && wait >= 1 && wait <= 7 * 24 * 60)
  const refused = Array.isArray(effects) && effects.some(effect => effect.refusal)
  // A retire refused for what is open through it — or not known to be closed — may end it, the person choosing: the
  // effects are read again forced, and any refusal left stands.
  const forcible =
    action === 'RETIRE' &&
    Array.isArray(effects) &&
    (force || effects.some(effect => effect.refusal && effect.state !== 'RETIRED'))

  const act = async () => {
    setBusy(true)
    const result = await graphQLRunAction(kind ?? 'device', device.id, action, {
      maxWaitMinutes: action === 'DRAIN' ? wait : undefined,
      force,
    })
    setBusy(false)
    if ('reason' in result) return setRefusal(result.reason || t('runAction.failed', 'It was not done: try again.'))
    onDone(result.runs)
    onClose()
  }

  return (
    <Confirm
      open={open}
      maxWidth="sm"
      title={scope === 'device' ? deviceTitle(t, said, device.name) : plainTitle(t, said, device.name, scope.name)}
      action={plainActionLabel(t, said)}
      color={action === 'UNDRAIN' || said === 'PAUSE' ? 'primary' : 'error'}
      disabled={busy || !Array.isArray(effects) || !effects.length || refused || !waitValid}
      onConfirm={act}
      onDeny={onClose}
    >
      <Typography variant="body2" gutterBottom data-plain-lead>
        {plainLead(t, said, device.name)}
      </Typography>
      {effects === undefined ? (
        <LoadingMessage />
      ) : effects === 'ERROR' ? (
        <Notice severity="error" fullWidth>
          {t('runAction.effectsFailed', 'What it would do could not be read, so nothing is done: try again.')}
        </Notice>
      ) : !effects.length ? (
        <Typography variant="body2">{t('runAction.nothing', 'It runs no proxy or exit.')}</Typography>
      ) : words ? (
        <PlainEffects effects={effects} />
      ) : (
        <EffectList effects={effects} />
      )}
      {forcible && (
        <FormControlLabel
          control={<Checkbox checked={force} onChange={event => setForce(event.target.checked)} />}
          label={t('carry.forceStop', 'End open connections now')}
        />
      )}
      {action === 'DRAIN' && (
        <TextField
          variant="filled"
          type="number"
          label={t('carry.maxWait', 'Wait for open connections (minutes)')}
          value={maxWait}
          error={!waitValid}
          helperText={
            waitValid ? undefined : t('carry.maxWaitInvalid', 'Enter a whole number of minutes, from 1 to 10080.')
          }
          onChange={event => setMaxWait(event.target.value)}
          fullWidth
          sx={{ marginTop: 2 }}
        />
      )}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}

// What an action does to each proxy and exit a device runs: a line for each, its refusal standing out.
export const EffectList: React.FC<{ effects: DeviceActionEffect[] }> = ({ effects }) => {
  const { t } = useTranslation()
  return (
    <List dense disablePadding data-effects>
      {effects.map(effect => {
        const [first, ...rest] = effectLines(t, effect)
        return (
          <ListItem key={`${effect.kind}:${effect.id}`} disableGutters data-effect={effect.kind}>
            <ListItemText
              primary={first}
              primaryTypographyProps={{ fontWeight: 500 }}
              secondary={rest.join(' ')}
              secondaryTypographyProps={{ color: effect.refusal ? 'error' : undefined }}
            />
          </ListItem>
        )
      })}
    </List>
  )
}

const PlainEffects: React.FC<{ effects: DeviceActionEffect[] }> = ({ effects }) => {
  const { t } = useTranslation()
  return (
    <div data-effects>
      {effects.flatMap(effect =>
        plainEffectLines(t, effect).map(line => (
          <Typography
            key={`${effect.kind}:${effect.id}:${line}`}
            variant="body2"
            gutterBottom
            color={effect.refusal && line.includes(effect.refusal) ? 'error' : undefined}
            data-effect={effect.kind}
          >
            {line}
          </Typography>
        ))
      )}
    </div>
  )
}

function plainLead(t: TFunction, action: PlainAction, device: string): string {
  return {
    PAUSE: t('carry.pauseLead', '{{device}} stops taking new traffic. Open connections finish first.', { device }),
    RESUME: t('carry.resumeLead', '{{device}} starts carrying traffic again.', { device }),
    APPROVE: t('carry.approveLead', '{{device}} starts carrying traffic.', { device }),
    STOP: t('carry.stopLead', '{{device}} stops now, ending open connections.', { device }),
    REMOVE: t('carry.removeLead', '{{device}} stops carrying traffic and leaves the list.', { device }),
  }[action]
}

function plainTitle(t: TFunction, action: PlainAction, device: string, name: string): string {
  return {
    PAUSE: t('carry.pauseTitle', 'Pause {{device}} for {{name}}?', { device, name }),
    RESUME: t('carry.resumeTitle', 'Resume {{device}} for {{name}}?', { device, name }),
    APPROVE: t('carry.approveTitle', 'Turn on {{device}} for {{name}}?', { device, name }),
    STOP: t('carry.stopTitle', 'Stop {{device}} now for {{name}}?', { device, name }),
    REMOVE: t('carry.removeTitle', 'Remove {{device}} from {{name}}?', { device, name }),
  }[action]
}

/* What deleting or decommissioning a device does to what it runs, in their own confirmations: nothing where it runs
   nothing, the API has no proxies and exits, or device sessions are off. */
export const DeviceRunEffects: React.FC<{ deviceId: string; action: 'DELETE' | 'DECOMMISSION' }> = ({
  deviceId,
  action,
}) => {
  const { t } = useTranslation()
  const deviceSessions = useDeviceSessions()
  const [effects, setEffects] = useState<DeviceActionEffect[]>([])

  useEffect(() => {
    if (!deviceSessions) return
    let live = true
    graphQLActionEffects(deviceId, action).then(read => live && setEffects(Array.isArray(read) ? read : []))
    return () => {
      live = false
    }
  }, [deviceSessions, deviceId, action])

  if (!effects.length) return null
  return (
    <>
      <Typography variant="body2" marginTop={2} data-run-effects>
        {t('runAction.runs', 'This device is in these. Here is what changes.')}
      </Typography>
      <EffectList effects={effects} />
    </>
  )
}

function deviceTitle(t: TFunction, action: PlainAction, device: string): string {
  return {
    PAUSE: t('runAction.drainAll', 'Pause {{device}} in all its exits and proxy servers?', { device }),
    RESUME: t('runAction.undrainAll', 'Resume {{device}} in all its exits and proxy servers?', { device }),
    APPROVE: t('runAction.undrainAll', 'Resume {{device}} in all its exits and proxy servers?', { device }),
    STOP: t('runAction.retireAll', 'Stop {{device}} now in all its exits and proxy servers?', { device }),
    REMOVE: t('runAction.removeAll', 'Remove {{device}} from all its exits and proxy servers?', { device }),
  }[action]
}
