import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { List, ListItem, ListItemText, ListSubheader, MenuItem, TextField, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { refusalOf } from '../services/graphQL'
import { graphQLAddExitDevice } from '../services/graphQLDeviceRuns'
import {
  Exit,
  graphQLAccountExits,
  graphQLAddExitTag,
  graphQLDeleteExit,
  graphQLExit,
  graphQLLeaveExitShare,
  graphQLMoveExitUsers,
  graphQLRemoveExitTag,
  graphQLRenameExit,
  graphQLSetExitActivation,
  graphQLSetNetworkExit,
} from '../services/graphQLExits'
import { availabilityLine, deleteExitLines, stillRunsLine, usersLine } from '../helpers/runsHelper'
import { useAccountExits } from '../hooks/useAccountExits'
import { RunDevicePicker, addEach } from '../components/RunDevicePicker'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemLocation } from '../components/ListItemLocation'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { ExitShareDialog } from '../components/ExitShareDialog'
import { ExitTagEditor } from '../components/ExitTagEditor'
import { SelectSetting } from '../components/SelectSetting'
import { RunListItem } from '../components/RunListItem'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* One exit (graphql-api docs/PROXY-GROUPS.md §13). For whoever manages it: its name and activation, the devices it runs
   on — each with its state and checks, its actions in this exit, and what the device still runs after one — and adding
   more, the devices using it, who it is shared with, its tags, the networks it is offered on, and, once no device runs
   it, moving its users to another exit and deleting it, saying what goes. With no device in service it has no device
   available: those using it go their usual way until one is. For someone it is shared with: whose it is, whether a
   device may choose it now, and leaving it. */
export const ExitPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { exitID } = useParams<{ exitID: string }>()
  const [exit, setExit] = useState<Exit | null | 'ERROR' | typeof UNSUPPORTED>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ severity: 'error' | 'info'; text: string }>()
  const [adding, setAdding] = useState(false)
  const [refusals, setRefusals] = useState<ILookup<string>>({})
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [moving, setMoving] = useState(false)

  const { reload: reloadList } = useAccountExits()

  const load = useCallback(async () => setExit(await graphQLExit(exitID)), [exitID])
  // The exit read again after a change, and the list beside it.
  const refresh = async () => {
    reloadList()
    await load()
  }

  useEffect(() => {
    setExit(undefined)
    setNotice(undefined)
    setAdding(false)
    load()
  }, [load])

  if (exit === undefined) return <LoadingMessage />
  if (exit === UNSUPPORTED || exit === 'ERROR' || exit === null)
    return (
      <Gutters>
        <Notice severity={exit === 'ERROR' ? 'error' : 'info'} fullWidth>
          {exit === 'ERROR'
            ? t('exitPage.failed', 'The exit could not be read.')
            : t('exitPage.none', 'No such exit, or not one you may see.')}
        </Notice>
      </Gutters>
    )

  const manage = exit.devices !== null
  const own = !exit.remoteit
  const devices = exit.devices ?? []
  const shared = !manage && !!exit.access.length

  // A change through graphql, then the exit read again: a refusal is said above, in graphql's words.
  const change = async (run: () => Promise<Parameters<typeof refusalOf>[0]>, failed: string) => {
    setBusy(true)
    const refused = refusalOf(await run())
    setNotice(refused === undefined ? undefined : { severity: 'error', text: refused || failed })
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

  const remove = async () => {
    if (await change(() => graphQLDeleteExit(exit.id, !!exit.users), t('exitPage.notDeleted', 'It was not deleted.')))
      history.push('/exits')
    setDeleting(false)
  }

  const leave = async () => {
    if (await change(() => graphQLLeaveExitShare(exit.id), t('exitPage.notLeft', 'It was not left.'))) history.push('/exits')
    setLeaving(false)
  }

  const failed = t('exitPage.notChanged', 'It was not changed: try again.')

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
              {exit.remoteit
                ? t('exitPage.remoteit', 'One of remote.it’s exits · {{provider}}', { provider: exit.provider })
                : shared && exit.owner?.email
                ? t('exitPage.sharedBy', 'Shared with you by {{email}}', { email: exit.owner.email })
                : usersLine(t, exit.users)}
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
        {availabilityLine(t, exit) && (
          <Gutters>
            <Notice severity="warning" fullWidth>
              {availabilityLine(t, exit)}
            </Notice>
          </Gutters>
        )}
        {manage && (
          <List>
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
              label={t('exitPage.activation', 'A device added goes into service')}
              value={exit.activation}
              values={[
                { key: 'auto', name: t('exitPage.activationAuto', 'By itself, once its checks pass') },
                { key: 'admin', name: t('exitPage.activationAdmin', 'When an admin puts it in service') },
              ]}
              disabled={busy}
              onChange={activation =>
                change(() => graphQLSetExitActivation(exit.id, activation as Exit['activation']), failed)
              }
            />
          </List>
        )}
        {manage && (
          <List data-runs-on>
            <ListSubheader>
              {t('exitPage.runsOn', 'Runs on')}
              {own && (
                <IconButton
                  icon={adding ? 'times' : 'plus'}
                  title={adding ? t('exitPage.cancelAdd', 'Cancel') : t('exitPage.add', 'Add devices')}
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setRefusals({})
                    setAdding(!adding)
                  }}
                />
              )}
            </ListSubheader>
            {adding && exit.owner && (
              <Gutters>
                <RunDevicePicker
                  kind="exit"
                  ownerId={exit.owner.id}
                  exclude={devices.map(device => device.id)}
                  busy={busy}
                  refusals={refusals}
                  onAdd={add}
                />
              </Gutters>
            )}
            {devices.map(device => (
              <RunListItem
                key={device.id}
                kind="exit"
                run={device}
                name={exit.name}
                activation={exit.activation}
                to={`/devices/${device.id}/runs`}
                manage
                onChanged={async (runs, which) => {
                  setNotice({ severity: 'info', text: stillRunsLine(t, which.name, runs) })
                  await refresh()
                }}
              />
            ))}
            {!devices.length && (
              <ListItem>
                <ListItemText
                  secondary={t('exitPage.runsOnNone', 'No device runs it: add one to carry its traffic.')}
                />
              </ListItem>
            )}
          </List>
        )}
        {manage && own && (
          <List>
            <ListSubheader>{t('exitPage.sharing', 'Sharing')}</ListSubheader>
            <ListItemSetting
              icon="user-group"
              label={
                exit.access.length
                  ? t('exitPage.sharedWith', 'Shared with {{emails}}', {
                      emails: exit.access.map(share => share.user.email || share.user.id).join(', '),
                    })
                  : t('exitPage.sharedWithNone', 'Shared with no one')
              }
              subLabel={t('exitPage.sharingHint', 'Those it is shared with may send a device of theirs out through it')}
              button={t('exitPage.share', 'Share')}
              disabled={busy}
              onButtonClick={() => setSharing(true)}
            />
            <ListItem data-tags>
              <ListItemText
                primary={t('exitPage.tags', 'Tags')}
                secondary={t('exitPage.tagsHint', 'A role scoped by tags reaches the exit by them')}
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
        {manage && own && exit.networks && (
          <List data-networks>
            <ListSubheader>{t('exitPage.networks', 'Offered on networks')}</ListSubheader>
            {exit.networks.map(network => (
              <ListItemLocation
                key={network.id}
                to={`/networks/${network.id}`}
                icon="chart-network"
                title={network.name}
                dense
              >
                <IconButton
                  icon="times"
                  title={t('exitPage.networkRemove', 'Stop offering it on {{network}}', { network: network.name })}
                  size="sm"
                  disabled={busy}
                  onClick={event => {
                    event.stopPropagation()
                    change(() => graphQLSetNetworkExit(network.id, exit.id, false), failed)
                  }}
                />
              </ListItemLocation>
            ))}
            {!exit.networks.length && (
              <ListItem>
                <ListItemText
                  secondary={t(
                    'exitPage.networksNone',
                    'On no network: make it available from a network’s page, for the devices initiating there.'
                  )}
                />
              </ListItem>
            )}
          </List>
        )}
        {manage && own && (
          <List>
            {!devices.length && !!exit.users && (
              <ListItemSetting
                icon="arrow-right-arrow-left"
                label={t('exitPage.move', 'Move its users to another exit')}
                subLabel={usersLine(t, exit.users)}
                button={t('exitPage.moveButton', 'Move')}
                disabled={busy}
                onButtonClick={() => setMoving(true)}
              />
            )}
            <ListItemSetting
              icon="trash"
              label={t('exitPage.delete', 'Delete this exit')}
              subLabel={
                devices.length
                  ? t('exitPage.deleteRunning', 'Take its devices out of it first')
                  : t('exitPage.deleteHint', 'It is kept until it is deleted, with no device running it too')
              }
              button={t('exitPage.deleteButton', 'Delete')}
              disabled={busy || !!devices.length}
              onButtonClick={() => setDeleting(true)}
            />
          </List>
        )}
        {shared && (
          <List>
            <ListItemSetting
              icon="arrow-right-from-bracket"
              label={t('exitPage.leave', 'Leave this exit')}
              subLabel={t('exitPage.leaveHint', 'A device of yours using it goes its usual way')}
              button={t('exitPage.leaveButton', 'Leave')}
              disabled={busy}
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
        action={t('exitPage.deleteButton', 'Delete')}
        color="error"
        disabled={busy}
        onConfirm={remove}
        onDeny={() => setDeleting(false)}
      >
        {deleteExitLines(t, exit).map(line => (
          <Typography key={line} variant="body2" gutterBottom>
            {line}
          </Typography>
        ))}
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
          {t('exitPage.leaveBody', 'You can no longer use it as an exit: a device of yours using it goes its usual way.')}
        </Typography>
      </Confirm>
    </Container>
  )
}

/* The users of an exit no device runs, moved to another of its account's with a device in service: the move said
   first — how many devices — and then made. */
const MoveExitUsers: React.FC<{ exit: Exit; onClose: () => void; onMoved: () => void }> = ({
  exit,
  onClose,
  onMoved,
}) => {
  const { t } = useTranslation()
  const [targets, setTargets] = useState<Exit[]>()
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState<number>()
  const [refusal, setRefusal] = useState<string>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!exit.owner) return
    graphQLAccountExits(exit.owner.id).then(read =>
      setTargets(read && typeof read === 'object' ? read.own.filter(each => each.id !== exit.id && !each.dormant) : [])
    )
  }, [exit.id, exit.owner?.id])

  const choose = async (target: string) => {
    setTo(target)
    setPreview(undefined)
    setRefusal(undefined)
    const said = await graphQLMoveExitUsers(exit.id, target, false)
    if ('reason' in said) setRefusal(said.reason || t('exitPage.moveFailed', 'The move could not be said: try again.'))
    else setPreview(said.users)
  }

  const move = async () => {
    setBusy(true)
    const done = await graphQLMoveExitUsers(exit.id, to, true)
    setBusy(false)
    if ('reason' in done) return setRefusal(done.reason || t('exitPage.moveFailed', 'The move could not be said: try again.'))
    onMoved()
  }

  const target = targets?.find(each => each.id === to)
  return (
    <Confirm
      open
      title={t('exitPage.moveTitle', 'Move the users of {{exit}}', { exit: exit.name })}
      action={t('exitPage.moveButton', 'Move')}
      disabled={busy || preview === undefined || !!refusal}
      onConfirm={move}
      onDeny={onClose}
    >
      {targets === undefined ? (
        <LoadingMessage />
      ) : !targets.length ? (
        <Typography variant="body2">
          {t('exitPage.moveNone', 'No other exit of its account has a device in service to take them.')}
        </Typography>
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
            defaultValue_one: '{{count}} device goes out through {{exit}} from now on.',
            defaultValue_other: '{{count}} devices go out through {{exit}} from now on.',
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
