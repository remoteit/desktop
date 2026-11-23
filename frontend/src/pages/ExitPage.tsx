import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import type { State } from '../store'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { refusalOf } from '../services/graphQL'
import { graphQLAddExitDevice } from '../services/graphQLDeviceRuns'
import {
  Exit,
  OfferedExit,
  graphQLAccountExits,
  graphQLAddExitTag,
  graphQLDeleteExit,
  graphQLDeviceExit,
  graphQLExit,
  graphQLLeaveExitShare,
  graphQLMoveExitUsers,
  graphQLOfferedExits,
  graphQLRemoveExitTag,
  graphQLRenameExit,
  graphQLSetDeviceExit,
  graphQLSetExitActivation,
  graphQLSetExitLan,
  graphQLSetNetworkExit,
} from '../services/graphQLExits'
import { afterActionLine, deleteExitWords, exitSummary, routedLine } from '../helpers/exitWords'
import { remoteitLine } from './ExitsPage'
import { useAccountExits } from '../hooks/useAccountExits'
import { RunDevicePicker, addEach } from '../components/RunDevicePicker'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemLocation } from '../components/ListItemLocation'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { ExitShareDialog } from '../components/ExitShareDialog'
import { ExitTagEditor } from '../components/ExitTagEditor'
import { SelectSetting } from '../components/SelectSetting'
import { CarrierRow } from '../components/CarrierRow'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

/* One exit. For whoever manages it: its exit devices, each with Pause, Resume and Remove, and Add device; who can use
   it (sharing, networks, local networks, tags); its name and how new devices start; deleting it. For someone it is
   shared with: whose it is, whether it is ready, and leaving it. One of Remote.It's: where it is, run by Remote.It. */
export const ExitPage: React.FC = () => {
  const { exitID } = useParams<{ exitID: string }>()
  return <OneExit key={exitID} exitID={exitID} />
}

const OneExit: React.FC<{ exitID: string }> = ({ exitID }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const thisId = useSelector((state: State) => state.backend.thisId)
  const [exit, setExit] = useState<Exit | null | 'ERROR' | typeof UNSUPPORTED>()
  const [remoteit, setRemoteit] = useState<OfferedExit | null>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ severity: 'error' | 'info' | 'success'; text: string }>()
  const [adding, setAdding] = useState(false)
  const [refusals, setRefusals] = useState<ILookup<string>>({})
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [moving, setMoving] = useState(false)
  const [openingLan, setOpeningLan] = useState(false)
  const [thisRoutes, setThisRoutes] = useState<boolean>()

  const { reload: reloadList } = useAccountExits()
  const reads = useRef(0)

  const load = useCallback(async () => {
    const read = ++reads.current
    const answer = await graphQLExit(exitID)
    if (read === reads.current) setExit(answer)
  }, [exitID])
  const refresh = async () => {
    reloadList()
    await load()
  }

  useEffect(() => {
    load()
  }, [load])

  // Remote.It's own exits are not read by id: they come from the exits offered to you.
  useEffect(() => {
    if (exit !== null) return
    graphQLOfferedExits().then(offered =>
      setRemoteit(Array.isArray(offered) ? offered.find(each => each.id === exitID && each.remoteit) ?? null : null)
    )
  }, [exit, exitID])

  useEffect(() => {
    if (!thisId) return
    graphQLDeviceExit(thisId).then(read =>
      setThisRoutes(!!read && typeof read === 'object' && read.usesExit?.id === exitID)
    )
  }, [thisId, exitID])

  if (exit === undefined || (exit === null && remoteit === undefined)) return <LoadingMessage />
  if (exit === null && remoteit) return <RemoteitExit exit={remoteit} />
  if (exit && typeof exit === 'object' && exit.remoteit && !exit.manage)
    return <RemoteitExit exit={{ ...exit, reasons: null }} />
  if (exit === UNSUPPORTED || exit === 'ERROR' || exit === null)
    return (
      <Gutters>
        <Notice severity={exit === 'ERROR' ? 'error' : 'info'} fullWidth>
          {exit === 'ERROR'
            ? t('exitPage.failed', 'Couldn’t load this exit. Try again.')
            : t('exitPage.none', 'This exit doesn’t exist, or you can’t see it.')}
        </Notice>
      </Gutters>
    )

  const manage = exit.manage
  const own = !exit.remoteit
  const devices = exit.devices ?? []
  const shared = !manage && !!exit.access.length
  const failed = t('exitPage.notChanged', 'Couldn’t save the change. Try again.')

  const change = async (run: () => Promise<Parameters<typeof refusalOf>[0]>, failedText: string) => {
    setBusy(true)
    const refused = refusalOf(await run())
    setNotice(refused === undefined ? undefined : { severity: 'error', text: refused || failedText })
    await refresh()
    setBusy(false)
    return refused === undefined
  }

  const add = async (ids: string[]) => {
    setBusy(true)
    const refused = await addEach(ids, id => graphQLAddExitDevice(exit.id, id))
    setRefusals(refused)
    if (!Object.keys(refused).length) setAdding(false)
    await refresh()
    setBusy(false)
  }

  const gone = async (run: () => ReturnType<typeof graphQLLeaveExitShare>, failedText: string) => {
    setBusy(true)
    const refused = refusalOf(await run())
    setBusy(false)
    setDeleting(false)
    setLeaving(false)
    if (refused !== undefined) return setNotice({ severity: 'error', text: refused || failedText })
    reloadList()
    history.push('/exits')
  }
  const remove = () =>
    gone(
      () => graphQLDeleteExit(exit.id, !!exit.users),
      t('exitPage.notDeleted', 'Couldn’t delete the exit. Try again.')
    )
  const leave = () =>
    gone(() => graphQLLeaveExitShare(exit.id), t('exitPage.notLeft', 'Couldn’t leave the exit. Try again.'))

  const routeThis = async () => {
    if (!thisId) return
    setBusy(true)
    const refused = refusalOf(await graphQLSetDeviceExit(thisId, exit.id))
    setBusy(false)
    if (refused !== undefined)
      return setNotice({
        severity: 'error',
        text: refused || t('exitPage.routeFailed', 'Couldn’t route this device. Try again.'),
      })
    setThisRoutes(true)
    setNotice({
      severity: 'success',
      text: t('exitPage.routed', 'This device now routes through {{exit}}.', { exit: exit.name }),
    })
  }

  const setLan = (lan: boolean) => change(() => graphQLSetExitLan(exit.id, lan), failed)
  const lanRefused = exit.lanRefusal
    ? t('exitPage.lanRefused', 'You can’t turn this on: {{reason}}', { reason: exit.lanRefusal })
    : ''
  const lanDevices = devices.map(device => device.name || device.id)
  const subtitle = exit.remoteit
    ? remoteitLine(t, exit)
    : shared && exit.owner?.email
    ? [
        exit.offered ? t('carry.ready', 'Ready') : t('carry.notReadyShort', 'Not ready'),
        t('exitPage.sharedBy', 'Shared with you by {{email}}', { email: exit.owner.email }),
      ].join(' · ')
    : [exitSummary(t, exit), routedLine(t, exit.users)].filter(Boolean).join(' · ')

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{exit.name}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary" data-summary>
              {subtitle}
            </Typography>
          </Gutters>
        </>
      }
    >
      <Gutters size={null}>
        {notice && (
          <Gutters>
            <Notice severity={notice.severity} fullWidth onClose={() => setNotice(undefined)}>
              {notice.text}
            </Notice>
          </Gutters>
        )}
        {manage && own && !devices.length && !adding && (
          <Gutters>
            <Notice
              fullWidth
              button={
                <Button size="small" variant="contained" onClick={() => setAdding(true)} data-add-first>
                  {t('exitPage.addDevice', 'Add device')}
                </Button>
              }
            >
              {t('exitPage.needsDevice', 'Choose a device to carry this exit’s traffic.')}
            </Notice>
          </Gutters>
        )}
        {manage && own && !!devices.length && exit.dormant && (
          <Gutters>
            <Notice severity="warning" fullWidth data-not-ready>
              {t(
                'exitPage.notReady',
                'No device is carrying this exit right now. Devices routing through it go direct.'
              )}
            </Notice>
          </Gutters>
        )}
        {thisId && exit.offered && thisRoutes !== undefined && (
          <List>
            <ListItemSetting
              icon="arrow-right-from-bracket"
              label={
                thisRoutes
                  ? t('exitPage.thisRoutes', 'This device routes through it')
                  : t('exitPage.routeThis', 'Route this device through it')
              }
              button={thisRoutes ? undefined : t('exitPage.routeButton', 'Route through')}
              secondaryContentWidth="100px"
              buttonDisabled={busy}
              onButtonClick={routeThis}
            />
          </List>
        )}
        {manage && (
          <List data-runs-on>
            <ListSubheader>
              {t('exitPage.devices', 'Exit devices')}
              {own && (devices.length > 0 || adding) && (
                <Button
                  size="small"
                  startIcon={<Icon name={adding ? 'times' : 'plus'} size="sm" />}
                  disabled={busy}
                  onClick={() => {
                    setRefusals({})
                    setAdding(!adding)
                  }}
                  data-add
                >
                  {adding ? t('exitPage.cancelAdd', 'Cancel') : t('exitPage.addDevice', 'Add device')}
                </Button>
              )}
            </ListSubheader>
            {adding && exit.owner && (
              <>
                <RunDevicePicker
                  inList
                  kind="exit"
                  target={exit.id}
                  ownerId={exit.owner.id}
                  busy={busy}
                  refusals={refusals}
                  lan={exit.lan}
                  onAdd={add}
                />
              </>
            )}
            {devices.map(device => (
              <CarrierRow
                key={device.id}
                kind="exit"
                run={device}
                name={exit.name}
                activation={exit.activation}
                manage
                onChanged={async (runs, which) => {
                  setNotice({ severity: 'info', text: afterActionLine(t, 'exit', exit, which.name, runs) })
                  await refresh()
                }}
              />
            ))}
            {!devices.length && !adding && (
              <ListItem>
                <ListItemText secondary={t('exitPage.devicesNone', 'No device yet.')} />
              </ListItem>
            )}
          </List>
        )}
        {manage && own && (
          <List data-who>
            <ListSubheader>{t('exitPage.who', 'Who can use it')}</ListSubheader>
            <ListItemSetting
              icon="user-group"
              label={
                exit.access.length
                  ? t('exitPage.sharedWith', 'Shared with {{emails}}', {
                      emails: exit.access.map(share => share.user.email || share.user.id).join(', '),
                    })
                  : t('exitPage.sharedWithNone', 'Only you')
              }
              subLabel={t('exitPage.sharingHint', 'People you share it with can route their devices through it.')}
              button={t('exitPage.share', 'Share')}
              secondaryContentWidth="100px"
              buttonDisabled={busy}
              onButtonClick={() => setSharing(true)}
            />
            {exit.networks?.map(network => (
              <ListItemLocation
                key={network.id}
                to={`/networks/${network.id}`}
                icon="chart-network"
                title={network.name}
                subtitle={t('exitPage.networkHint', 'Devices on this network can use it')}
              >
                <IconButton
                  icon="times"
                  title={t('exitPage.networkRemove', 'Remove from {{network}}', { network: network.name })}
                  size="sm"
                  disabled={busy}
                  onClick={event => {
                    event.stopPropagation()
                    change(() => graphQLSetNetworkExit(network.id, exit.id, false), failed)
                  }}
                />
              </ListItemLocation>
            ))}
            {exit.networks && !exit.networks.length && (
              <ListItemSetting
                icon="chart-network"
                label={t('exitPage.networksNone', 'Not on any network')}
                subLabel={t(
                  'exitPage.networksHint',
                  'Add it from a network’s page to let that network’s devices use it.'
                )}
              />
            )}
            <ListItemSetting
              icon="network-wired"
              label={t('exitPage.lan', 'Reach the exit devices’ local networks')}
              subLabel={
                <>
                  {t('exitPage.lanHint', 'People using this exit can reach printers and files there.')}
                  {lanRefused && (
                    <Typography component="span" variant="caption" display="block" data-lan-refusal>
                      {lanRefused}
                    </Typography>
                  )}
                </>
              }
              toggle={exit.lan}
              disabled={busy || (!exit.lan && !!exit.lanRefusal)}
              onClick={() => (exit.lan ? setLan(false) : setOpeningLan(true))}
            />
            <ListItem data-tags sx={{ paddingRight: 2 }}>
              <ListItemIcon>
                <Icon name="tags" size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText
                primary={t('exitPage.tags', 'Tags')}
                secondary={t('exitPage.tagsHint', 'Roles limited to these tags can use it.')}
              />
              <ExitTagEditor
                exit={exit}
                disabled={busy}
                onAdd={tag => change(() => graphQLAddExitTag(exit.id, [tag.name]), failed)}
                onRemove={tag => change(() => graphQLRemoveExitTag(exit.id, [tag.name]), failed)}
              />
            </ListItem>
          </List>
        )}
        {manage && (
          <List>
            <ListSubheader>{t('exitPage.settings', 'Settings')}</ListSubheader>
            {own && (
              <InlineTextFieldSetting
                icon="tag"
                label={t('exitPage.name', 'Name')}
                value={exit.name}
                maxLength={255}
                disabled={busy}
                onSave={name => change(() => graphQLRenameExit(exit.id, String(name).trim()), failed)}
              />
            )}
            <SelectSetting
              icon="right-to-bracket"
              label={t('exitPage.activation', 'New exit devices start')}
              value={exit.activation}
              values={[
                { key: 'auto', name: t('exitPage.activationAuto', 'Automatically') },
                { key: 'admin', name: t('exitPage.activationAdmin', 'After you approve') },
              ]}
              disabled={busy}
              onChange={activation =>
                change(() => graphQLSetExitActivation(exit.id, activation as Exit['activation']), failed)
              }
            />
          </List>
        )}
        {manage && own && (
          <List>
            {!devices.length && !!exit.users && (
              <ListItemSetting
                icon="arrow-right-arrow-left"
                label={t('exitPage.move', 'Move its devices to another exit')}
                subLabel={routedLine(t, exit.users)}
                button={t('exitPage.moveButton', 'Move')}
                secondaryContentWidth="100px"
                buttonDisabled={busy}
                onButtonClick={() => setMoving(true)}
              />
            )}
            <ListItemSetting
              icon="trash"
              iconColor="danger"
              label={t('exitPage.delete', 'Delete exit')}
              subLabel={devices.length ? t('exitPage.deleteRunning', 'Remove its exit devices first.') : undefined}
              button={t('exitPage.deleteButton', 'Delete')}
              secondaryContentWidth="100px"
              buttonDisabled={busy || !!devices.length}
              onButtonClick={() => setDeleting(true)}
            />
          </List>
        )}
        {!manage && own && exit.lan && (
          <List data-lan-reach>
            <ListItemSetting
              icon="network-wired"
              label={t('exitPage.lanReach', 'You can reach the exit devices’ local networks')}
              subLabel={t('exitPage.lanReachHint', 'Printers and files there, while you route through it.')}
            />
          </List>
        )}
        {shared && (
          <List>
            <ListItemSetting
              icon="arrow-right-from-bracket"
              label={t('exitPage.leave', 'Leave exit')}
              subLabel={t('exitPage.leaveHint', 'Your devices routing through it go direct.')}
              button={t('exitPage.leaveButton', 'Leave')}
              secondaryContentWidth="100px"
              buttonDisabled={busy}
              onButtonClick={() => setLeaving(true)}
            />
          </List>
        )}
      </Gutters>
      {sharing && <ExitShareDialog exit={exit} open onClose={() => setSharing(false)} onChanged={refresh} />}
      {moving && (
        <MoveExitUsers
          exit={exit}
          onClose={() => setMoving(false)}
          onMoved={async () => {
            setMoving(false)
            await refresh()
          }}
        />
      )}
      <Confirm
        open={deleting}
        title={t('exitPage.deleteTitle', 'Delete {{exit}}?', { exit: exit.name })}
        action={t('exitPage.delete', 'Delete exit')}
        color="error"
        disabled={busy}
        onConfirm={remove}
        onDeny={() => setDeleting(false)}
      >
        {deleteExitWords(t, exit).map(line => (
          <Typography key={line} variant="body2" gutterBottom>
            {line}
          </Typography>
        ))}
      </Confirm>
      <Confirm
        open={openingLan}
        title={t('exitPage.lanTitle', 'Open the exit devices’ local networks?')}
        action={t('exitPage.lanOpen', 'Turn on')}
        disabled={busy}
        onConfirm={() => {
          setOpeningLan(false)
          setLan(true)
        }}
        onDeny={() => setOpeningLan(false)}
      >
        <Typography variant="body2" gutterBottom>
          {lanDevices.length
            ? t(
                'exitPage.lanOpenSays',
                'Everyone who can use {{exit}} can then reach printers and files on the networks of {{devices}}.',
                {
                  exit: exit.name,
                  devices: lanDevices.join(', '),
                }
              )
            : t(
                'exitPage.lanOpenSaysNone',
                'Everyone who can use {{exit}} can then reach printers and files on its devices’ networks.',
                {
                  exit: exit.name,
                }
              )}
        </Typography>
        <Typography variant="body2">
          {t('exitPage.lanOpenMachines', 'An administrator of each device can still turn this off there.')}
        </Typography>
      </Confirm>
      <Confirm
        open={leaving}
        title={t('exitPage.leaveTitle', 'Leave {{exit}}?', { exit: exit.name })}
        action={t('exitPage.leaveButton', 'Leave')}
        color="error"
        disabled={busy}
        onConfirm={leave}
        onDeny={() => setLeaving(false)}
      >
        <Typography variant="body2">
          {t('exitPage.leaveBody', 'You can no longer route through it. Your devices routing through it go direct.')}
        </Typography>
      </Confirm>
    </Container>
  )
}

// One of Remote.It's exits: where it is, and that Remote.It runs it.
export const RemoteitExit: React.FC<{ exit: OfferedExit }> = ({ exit }) => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{exit.name}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t('exitPage.remoteitSummary', 'Run by Remote.It')}
            </Typography>
          </Gutters>
        </>
      }
    >
      <List data-remoteit-exit>
        {exit.location && (
          <ListItemSetting icon="location-dot" label={exit.location} subLabel={t('exitPage.location', 'Location')} />
        )}
        {exit.provider && exit.provider !== exit.location && (
          <ListItemSetting icon="cloud" label={exit.provider} subLabel={t('exitPage.provider', 'Hosted on')} />
        )}
        <ListItemSetting
          icon="shield-check"
          label={t('exitPage.remoteitRuns', 'Remote.It runs and looks after this exit')}
          subLabel={t(
            'exitPage.remoteitPlan',
            'Included in your plan. Traffic through it counts toward your monthly transfer.'
          )}
        />
        <ListItemSetting
          icon="arrow-right-from-bracket"
          label={t('exitPage.remoteitHow', 'To use it, choose it under Route through on a device')}
        />
      </List>
    </Container>
  )
}

const MoveExitUsers: React.FC<{ exit: Exit; onClose: () => void; onMoved: () => void }> = ({
  exit,
  onClose,
  onMoved,
}) => {
  const { t } = useTranslation()
  const [targets, setTargets] = useState<Exit[] | 'ERROR'>()
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState<number>()
  const [refusal, setRefusal] = useState<string>()
  const [busy, setBusy] = useState(false)
  const chosen = useRef('')

  useEffect(() => {
    if (!exit.owner) return
    graphQLAccountExits(exit.owner.id).then(read =>
      setTargets(
        read && typeof read === 'object' ? read.own.filter(each => each.id !== exit.id && !each.dormant) : 'ERROR'
      )
    )
  }, [exit.id, exit.owner?.id])

  const choose = async (target: string) => {
    chosen.current = target
    setTo(target)
    setPreview(undefined)
    setRefusal(undefined)
    const said = await graphQLMoveExitUsers(exit.id, target, false)
    if (chosen.current !== target) return
    if ('reason' in said) setRefusal(said.reason || t('exitPage.moveFailed', 'Couldn’t check the move. Try again.'))
    else setPreview(said.users)
  }

  const move = async () => {
    setBusy(true)
    const done = await graphQLMoveExitUsers(exit.id, to, true)
    setBusy(false)
    if ('reason' in done) return setRefusal(done.reason || t('exitPage.moveNotMade', 'Couldn’t move them. Try again.'))
    onMoved()
  }

  const target = Array.isArray(targets) ? targets.find(each => each.id === to) : undefined
  return (
    <Confirm
      open
      title={t('exitPage.moveTitle', 'Move the devices routing through {{exit}}', { exit: exit.name })}
      action={t('exitPage.moveButton', 'Move')}
      disabled={busy || preview === undefined || !!refusal}
      onConfirm={move}
      onDeny={onClose}
    >
      {targets === undefined ? (
        <LoadingMessage />
      ) : targets === 'ERROR' ? (
        <Notice severity="error" fullWidth>
          {t('exitPage.moveUnread', 'Couldn’t load your other exits. Try again.')}
        </Notice>
      ) : !targets.length ? (
        <Typography variant="body2">{t('exitPage.moveNone', 'You have no other exit that is ready.')}</Typography>
      ) : (
        <TextField
          select
          fullWidth
          size="small"
          label={t('exitPage.moveTo', 'To')}
          value={to}
          onChange={event => choose(String(event.target.value))}
        >
          {targets.map(each => (
            <MenuItem key={each.id} value={each.id}>
              {each.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      {preview !== undefined && target && (
        <Typography variant="body2" marginTop={2} data-move-preview>
          {t('exitPage.movePreview', {
            count: preview,
            exit: target.name,
            defaultValue_one: '{{count}} device will route through {{exit}}.',
            defaultValue_other: '{{count}} devices will route through {{exit}}.',
          })}
        </Typography>
      )}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}
