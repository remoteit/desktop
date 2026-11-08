import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControlLabel, MenuItem, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import { DeviceRuns, graphQLAddExitDevice, graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import { graphQLAccountExits, graphQLCreateExit, graphQLDeleteExit } from '../services/graphQLExits'
import { graphQLAccountProxies, graphQLCreateProxy, graphQLDeleteProxy } from '../services/graphQLProxy'
import { lanAddWarning } from '../helpers/runsHelper'
import { LoadingMessage } from './LoadingMessage'
import { Confirm } from './Confirm'
import { Notice } from './Notice'

type Props = {
  kind: 'proxy' | 'exit'
  device: { id: string; name: string; ownerId: string }
  onClose: () => void
  onDone: (runs: DeviceRuns, made?: { id: string; name: string }) => void
}

type Choice = { id: string; name: string; lan?: boolean } // an exit's lan: its users reach its devices' local networks

/* "Make this device an exit" and "Make this device a proxy" (graphql-api docs/PROXY-GROUPS.md §13, "No shortcuts"): one
   action of two calls — a new exit or proxy made in the device's account, then the device added to it — or the device
   added to one of the account's own. A new one whose add is refused is deleted again, so nothing is left behind, and
   the refusal is said in graphql's words. The device joins out of service, and goes into service once its checks
   pass. Added to an exit whose users reach its devices' local networks, it opens its own to them: said before. */
export const MakeRunDialog: React.FC<Props> = ({ kind, device, onClose, onDone }) => {
  const { t } = useTranslation()
  const [choices, setChoices] = useState<Choice[]>()
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [name, setName] = useState(
    kind === 'exit'
      ? t('makeRun.exitName', '{{device}} exit', { device: device.name })
      : t('makeRun.proxyName', '{{device}} proxy', { device: device.name })
  )
  const [chosen, setChosen] = useState('')
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()

  // The account's own, which the device may be added to.
  useEffect(() => {
    const own = async (): Promise<Choice[]> => {
      if (kind === 'exit') {
        const exits = await graphQLAccountExits(device.ownerId)
        return exits && typeof exits === 'object' ? exits.own : []
      }
      const proxies = await graphQLAccountProxies(device.ownerId)
      return Array.isArray(proxies) ? proxies : []
    }
    own().then(list => setChoices(list.map(({ id, name, lan }) => ({ id, name, lan }))))
  }, [kind, device.ownerId])

  const make = async () => {
    setBusy(true)
    setRefusal(undefined)
    let target: Choice | undefined = choices?.find(choice => choice.id === chosen)
    let made = false
    if (mode === 'new') {
      const created =
        kind === 'exit'
          ? await graphQLCreateExit(name.trim(), device.ownerId)
          : await graphQLCreateProxy({ name: name.trim(), accountId: device.ownerId })
      if ('reason' in created) {
        setBusy(false)
        return setRefusal(created.reason || t('makeRun.notMade', 'It was not made: try again.'))
      }
      target = { id: created.id, name: created.name }
      made = true
    }
    if (!target) return setBusy(false)
    const added =
      kind === 'exit' ? await graphQLAddExitDevice(target.id, device.id) : await graphQLAddProxyDevice(target.id, device.id)
    if ('reason' in added) {
      // Made for this device alone: not left behind with none.
      if (made) await (kind === 'exit' ? graphQLDeleteExit(target.id, false) : graphQLDeleteProxy(target.id, false))
      setBusy(false)
      return setRefusal(added.reason || t('makeRun.notAdded', 'The device was not added: try again.'))
    }
    setBusy(false)
    onDone(added.runs, made ? target : undefined)
    onClose()
  }

  const ready = mode === 'new' ? !!name.trim() : !!chosen
  const opensLan = kind === 'exit' && mode === 'existing' && !!choices?.find(choice => choice.id === chosen)?.lan
  return (
    <Confirm
      open
      maxWidth="sm"
      title={
        kind === 'exit'
          ? t('makeRun.exitTitle', 'Make {{device}} an exit', { device: device.name })
          : t('makeRun.proxyTitle', 'Make {{device}} a proxy', { device: device.name })
      }
      action={kind === 'exit' ? t('makeRun.exitAction', 'Make it an exit') : t('makeRun.proxyAction', 'Make it a proxy')}
      disabled={busy || !ready || choices === undefined}
      onConfirm={make}
      onDeny={onClose}
    >
      {choices === undefined ? (
        <LoadingMessage />
      ) : (
        <RadioGroup value={mode} onChange={event => setMode(event.target.value as 'new' | 'existing')}>
          <FormControlLabel
            value="new"
            control={<Radio />}
            label={kind === 'exit' ? t('makeRun.newExit', 'A new exit') : t('makeRun.newProxy', 'A new proxy')}
          />
          {mode === 'new' && (
            <TextField
              size="small"
              label={t('makeRun.name', 'Name')}
              value={name}
              inputProps={{ maxLength: 255 }}
              onChange={event => setName(event.target.value)}
              sx={{ marginLeft: 4, marginBottom: 1 }}
            />
          )}
          <FormControlLabel
            value="existing"
            control={<Radio />}
            disabled={!choices.length}
            label={
              kind === 'exit'
                ? t('makeRun.existingExit', 'One of its account’s exits')
                : t('makeRun.existingProxy', 'One of its account’s proxies')
            }
          />
          {mode === 'existing' && (
            <TextField
              select
              size="small"
              label={kind === 'exit' ? t('makeRun.exit', 'Exit') : t('makeRun.proxy', 'Proxy')}
              value={chosen}
              onChange={event => setChosen(String(event.target.value))}
              sx={{ marginLeft: 4 }}
            >
              {choices.map(choice => (
                <MenuItem key={choice.id} value={choice.id}>
                  {choice.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </RadioGroup>
      )}
      <Typography variant="body2" color="textSecondary" marginTop={2}>
        {kind === 'exit'
          ? t(
              'makeRun.exitHint',
              'It joins out of service and goes into service once its checks pass: online, and its machine allowing exits. Its exit node is turned on.'
            )
          : t(
              'makeRun.proxyHint',
              'It joins out of service and goes into service once its checks pass, serving every endpoint on the proxy. Its proxy setting is turned on.'
            )}
      </Typography>
      {opensLan && (
        <Notice severity="warning" fullWidth gutterTop>
          <span data-lan-warning>{lanAddWarning(t, [device.name])}</span>
        </Notice>
      )}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}
