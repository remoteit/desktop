import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import {
  ExitNodeCheck,
  ExitNodeExit,
  ExitNodeJoined,
  ExitNodeList,
  ExitNodeRuns,
  ExitNodeStatus,
  Platform,
  ThisDevice,
} from '../../services/thisDevice'
import { failing, runStateLabel } from '../../helpers/runsHelper'
import type { RunState } from '../../services/graphQLDeviceRuns'
import { ThisDeviceModel } from './model'
import { Note, SettingRow, T } from './shared'

/* "Shares its connection" on This device's Advanced (bridge 1.12.0, 'exitNode'): this machine offered as one of its
   owner's exits — the menu's "Use this Mac as an exit…". What it runs and its state, the checks that keep it from
   service, joining an exit or creating one (the machine's administrator confirms first), and its exit node's switch.
   Leaving an exit is the account's, on the device's page (leaveHref); the shell offers none. */

const NEW = ''

export const ThisDeviceExitNode: React.FC<{
  device: ThisDevice
  m: ThisDeviceModel
  status: ExitNodeStatus
  leaveHref?: string
}> = ({ device, m, status, leaveHref }) => {
  const { t, kind } = m
  const [list, setList] = useState<ExitNodeList>()
  const [listError, setListError] = useState<string>()
  // The checks a join answered with, which a list does not say.
  const [joined, setJoined] = useState<{ id: string; checks?: ExitNodeCheck[] | null; turnedOn: boolean }>()
  const [choosing, setChoosing] = useState(false)
  const listedAt = useRef(0)
  const listAsked = useRef(0)
  const held = status.held

  const load = useCallback(async () => {
    const ask = ++listAsked.current
    listedAt.current = Date.now()
    setListError(undefined)
    try {
      const next = await device.call('exitNode.list', {})
      if (ask === listAsked.current) setList(next)
    } catch (e: any) {
      if (ask === listAsked.current) setListError(e?.message || String(e))
    }
  }, [device])

  // Shown again: listed again, at most every 10 s, as the menu's window does — the cloud counts a device's asks.
  useEffect(() => {
    if (held) {
      setJoined(undefined)
      return
    }
    load()
    const shown = () => {
      if (!document.hidden && Date.now() - listedAt.current >= 10000) load()
    }
    document.addEventListener('visibilitychange', shown)
    return () => document.removeEventListener('visibilitychange', shown)
  }, [held, load])

  const runs = held
    ? undefined
    : list?.runs && joined && list.runs.id === joined.id
    ? { ...list.runs, checks: joined.checks }
    : list?.runs
  const checks = runs?.joining ? runs.checks ?? [] : []
  const key = held
    ? 'held'
    : !list
    ? listError
      ? 'unknown'
      : 'checking'
    : !runs
    ? 'off'
    : runs.joining && failing(checks).length
    ? 'failed'
    : runs.joining
    ? 'joining'
    : runs.state

  // A join from the dialog changes the exits' counts, so they are listed again; Check again changes only what it runs.
  const join = async (run: () => Promise<ExitNodeJoined>, relist: boolean) => {
    const answer = await run().catch(e => {
      if (e?.code !== 'cancelled') load()
      throw e
    })
    listAsked.current++
    setJoined({ id: answer.runs.id, checks: answer.runs.checks, turnedOn: answer.turnedOn })
    setList(l => l && { ...l, runs: answer.runs })
    setChoosing(false)
    if (relist) await load()
  }

  return (
    <List data-section="exit-node">
      <Typography variant="subtitle1" paddingX={2}>
        {t('thisDevice.sharesConnection', 'Shares its connection')}
      </Typography>
      <ListItem data-exit-node-state={key}>
        <ListItemText
          primary={
            runs
              ? runStateLabel(t as any, { state: runs.state.toUpperCase() as RunState, joining: runs.joining, checks })
              : stateWords(t)[key as keyof ReturnType<typeof stateWords>]
          }
          secondary={
            held
              ? heldLine(held, kind, t)
              : listError
              ? t('thisDevice.exitListFailed', 'Couldn’t list your exits. {{reason}}', { reason: listError })
              : exitLine(runs, kind, t)
          }
        />
      </ListItem>
      {runs?.lan && (
        <Note
          id="exit-lan"
          text={
            status.lanLocal
              ? t(
                  'thisDevice.exitLanLocal',
                  'This {{kind}} decides whether users of {{exit}} reach its local network.',
                  {
                    kind,
                    exit: runs.name,
                  }
                )
              : t('thisDevice.exitLanOpen', 'Users of {{exit}} can reach this {{kind}}’s local network.', {
                  kind,
                  exit: runs.name,
                })
          }
        />
      )}
      {checks.map((c, i) => (
        <Note
          key={`${c.name}-${i}`}
          id={`check-${checkState(c)}`}
          text={checkLine(c, t)}
          warn={checkState(c) === 'failed'}
        />
      ))}
      {joined?.turnedOn && runs?.id === joined.id && (
        <Note
          id="exit-turned-on"
          text={t(
            'thisDevice.exitTurnedOn',
            'Exit traffic is on here. Remote.It sees it at this {{kind}}’s next report.',
            { kind }
          )}
        />
      )}
      {!held && (
        <ListItem sx={{ flexWrap: 'wrap', gap: 1 }}>
          {listError && (
            <Button size="small" variant="outlined" disabled={m.busy} data-control="exit-retry" onClick={load}>
              {t('thisDevice.tryAgain', 'Try again')}
            </Button>
          )}
          {list && (
            <Button
              size="small"
              variant="outlined"
              disabled={m.busy}
              data-control="exit-choose"
              onClick={() => setChoosing(true)}
            >
              {t('thisDevice.useAsExit', 'Use this {{kind}} as an exit…', { kind })}
            </Button>
          )}
          {runs?.joining && (
            <Button
              size="small"
              disabled={m.busy}
              data-control="exit-check"
              onClick={() => m.act(() => join(() => device.call('exitNode.join', { id: runs.id }), false))}
            >
              {t('thisDevice.checkAgain', 'Check again')}
            </Button>
          )}
          {runs && leaveHref && (
            <Button size="small" href={leaveHref} data-control="exit-leave">
              {t('thisDevice.leaveExit', 'Leave exit…')}
            </Button>
          )}
        </ListItem>
      )}
      {m.exitNodeSetting && (
        <SettingRow
          setting={m.exitNodeSetting}
          title={t('thisDevice.carryTraffic', 'Carry exit traffic')}
          disabled={m.busy}
          onSet={value => m.setSetting('exit_node', value)}
        />
      )}
      {choosing && list && (
        <ChooseExit
          kind={kind}
          platform={device.info.platform}
          deviceName={m.status?.device?.name}
          list={list}
          lanLocal={!!status.lanLocal}
          t={t}
          onClose={() => setChoosing(false)}
          onJoin={id => join(() => device.call('exitNode.join', { id }), true)}
          onCreate={name => join(() => device.call('exitNode.create', { name }), true)}
        />
      )}
    </List>
  )
}

const stateWords = (t: T) => ({
  held: t('thisDevice.exitHeld', 'Not allowed'),
  unknown: t('thisDevice.exitUnknown', 'Unknown'),
  checking: t('thisDevice.exitChecking', 'Checking…'),
  off: t('thisDevice.exitOff', 'Off'),
})

const checkState = (c: ExitNodeCheck) => (c.passed ? 'passed' : c.pending ? 'pending' : 'failed')

function exitLine(runs: ExitNodeRuns | null | undefined, kind: string, t: T) {
  if (!runs)
    return t('thisDevice.exitOffLine', 'Carry internet traffic for people who route through one of your exits.')
  const v = { kind, exit: runs.name }
  if (runs.joining)
    return t(
      'thisDevice.exitJoiningLine',
      'This {{kind}} is joining {{exit}}. It goes into service once its checks pass.',
      v
    )
  return (
    {
      active: t('thisDevice.exitActiveLine', 'This {{kind}} carries traffic for {{exit}}.', v),
      draining: t('thisDevice.exitDrainingLine', '{{exit}} sends this {{kind}} no new traffic.', v),
      retired: t('thisDevice.exitRetiredLine', 'This {{kind}} carries no traffic for {{exit}}.', v),
    }[runs.state] ?? runs.name
  )
}

function heldLine(held: string, kind: string, t: T) {
  if (held === 'forbidden')
    return t('thisDevice.exitForbidden', 'This {{kind}}’s administrator doesn’t allow exits on it.', { kind })
  if (held === 'portal')
    return t('thisDevice.exitPortalOnly', 'This {{kind}}’s administrator sets this in the portal only.', { kind })
  return t('thisDevice.exitViewer', 'Your account on this {{kind}} can’t change Remote.It.', { kind })
}

const checkLine = (c: ExitNodeCheck, t: T) =>
  ({
    passed: t('thisDevice.checkPassed', 'Passed: {{reason}}', { reason: c.reason }),
    pending: t('thisDevice.checkPending', 'Waiting: {{reason}}', { reason: c.reason }),
    failed: t('thisDevice.checkFailed', 'Failed: {{reason}}', { reason: c.reason }),
  }[checkState(c)])

function confirmLine(platform: Platform, kind: string, t: T) {
  if (platform === 'mac')
    return t('thisDevice.exitConfirmMac', 'An administrator of this {{kind}} confirms with Touch ID or a password.', {
      kind,
    })
  if (platform === 'windows')
    return t('thisDevice.exitConfirmWindows', 'An administrator of this {{kind}} confirms when Windows asks.', { kind })
  return t('thisDevice.exitConfirm', 'An administrator of this {{kind}} confirms with a password.', { kind })
}

const exitDetail = (x: ExitNodeExit, t: T) =>
  [
    x.devices === 1
      ? t('thisDevice.exitDevicesOne', '1 device')
      : t('thisDevice.exitDevices', '{{n}} devices', { n: x.devices }),
    t('thisDevice.exitInServiceCount', '{{n}} in service', { n: x.inService }),
    t('thisDevice.exitUsers', '{{n}} using it', { n: x.users }),
    x.dormant && t('thisDevice.exitDormant', 'Dormant'),
  ]
    .filter(Boolean)
    .join(' · ')

const ChooseExit: React.FC<{
  kind: string
  platform: Platform
  deviceName?: string
  list: ExitNodeList
  lanLocal: boolean
  t: T
  onClose: () => void
  onJoin: (id: string) => Promise<void>
  onCreate: (name: string) => Promise<void>
}> = ({ kind, platform, deviceName, list, lanLocal, t, onClose, onJoin, onCreate }) => {
  const exits = (list.exits ?? []).filter(x => x.id !== list.runs?.id)
  const [chosen, setChosen] = useState(exits.length ? exits[0].id : NEW)
  const [name, setName] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<{ reason: string; creating: boolean }>()
  const exit = exits.find(x => x.id === chosen)

  const go = async () => {
    const creating = chosen === NEW
    setWaiting(true)
    setError(undefined)
    try {
      if (creating) await onCreate(name.trim())
      else await onJoin(chosen)
    } catch (e: any) {
      if (e?.code !== 'cancelled') setError({ reason: e?.message || String(e), creating })
    } finally {
      setWaiting(false)
    }
  }

  return (
    <Dialog open onClose={waiting ? undefined : onClose} fullWidth maxWidth="xs" data-dialog="exit-node">
      <DialogTitle>{t('thisDevice.useAsExitTitle', 'Use this {{kind}} as an exit', { kind })}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t(
            'thisDevice.useAsExitLead',
            'Carry internet traffic for people who use one of your exits. Join an exit, or create one.'
          )}
        </Typography>
        <RadioGroup value={chosen} onChange={e => setChosen(e.target.value)}>
          {exits.map(x => (
            <FormControlLabel
              key={x.id}
              value={x.id}
              control={<Radio size="small" />}
              data-exit={x.id}
              label={
                <ListItemText
                  primary={x.name}
                  secondary={
                    <>
                      {exitDetail(x, t)}
                      {x.lan && (
                        <>
                          <br />
                          {t('thisDevice.exitLanNote', 'Its users reach the local network of each device running it.')}
                        </>
                      )}
                    </>
                  }
                />
              }
            />
          ))}
          <FormControlLabel
            value={NEW}
            control={<Radio size="small" />}
            data-exit="new"
            label={<ListItemText primary={t('thisDevice.newExit', 'New exit')} />}
          />
        </RadioGroup>
        {chosen === NEW && (
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={e => setName(e.target.value)}
            label={t('thisDevice.newExitName', 'Exit name')}
            placeholder={
              deviceName ? t('thisDevice.newExitPlaceholder', '{{device}} exit', { device: deviceName }) : undefined
            }
            inputProps={{ maxLength: 255, 'data-control': 'exit-name' }}
            sx={{ marginTop: 1 }}
          />
        )}
        {exit?.lan && (
          <Typography variant="body2" color="warning.main" marginTop={2} data-note="exit-lan-join">
            {lanLocal
              ? t(
                  'thisDevice.exitLanJoinLocal',
                  'This {{kind}} decides whether this exit’s users reach its local network.',
                  { kind }
                )
              : t('thisDevice.exitLanJoin', 'Joining lets this exit’s users reach this {{kind}}’s local network.', {
                  kind,
                })}
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary" marginTop={2} data-note="exit-confirm">
          {waiting
            ? t('thisDevice.exitWaiting', 'Waiting for the administrator to confirm.')
            : confirmLine(platform, kind, t)}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ marginTop: 2 }} data-note="exit-error">
            {error.creating
              ? t('thisDevice.exitNotCreated', 'Couldn’t create the exit. {{reason}}', { reason: error.reason })
              : t('thisDevice.exitNotJoined', 'Couldn’t join. {{reason}}', { reason: error.reason })}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={waiting}>
          {t('thisDevice.cancel', 'Cancel')}
        </Button>
        <Button variant="contained" onClick={go} disabled={waiting} data-control="exit-go">
          {chosen === NEW ? t('thisDevice.createExit', 'Create exit') : t('thisDevice.joinExit', 'Join exit')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
