import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useHistory, useParams } from 'react-router-dom'
import { List, ListItem, ListItemText, ListSubheader, MenuItem, TextField, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { refusalOf } from '../services/graphQL'
import { graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import {
  EndpointsMove,
  Proxy,
  graphQLAccountProxies,
  graphQLDeleteProxy,
  graphQLMoveProxyEndpoints,
  graphQLProxy,
  graphQLRenameProxy,
  graphQLSetProxyActivation,
} from '../services/graphQLProxy'
import { NAME_MAX, graphQLAccountSlug, validLabel } from '../services/subnetNames'
import { deleteProxyLine, endpointsLine, stillRunsLine } from '../helpers/runsHelper'
import { useAccountProxies } from '../hooks/useAccountExits'
import { RunDevicePicker, addEach } from '../components/RunDevicePicker'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { SelectSetting } from '../components/SelectSetting'
import { RunListItem } from '../components/RunListItem'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

// An own proxy's host is <label>-<slug>.<proxy domain>: its label, letters and digits, before the account's slug.
export const labelOf = (host: string) => host.split('.')[0].split('-')[0]

// The host a new label gives it, as graphql makes it: under the account's slug as it is now — which may differ from the
// one in its host, changed since —, or, where that cannot be read, the one in its host; the proxy domain kept.
export const hostWith = (host: string, label: string, slug?: string | null) =>
  slug ? `${label}-${slug}${host.slice(host.indexOf('.'))}` : `${label}${host.slice(labelOf(host).length)}`

/* One proxy (graphql-api docs/PROXY-GROUPS.md §13). For whoever manages it: its name, its host — its label renamed
   moves every endpoint's address, and its certificate is issued again —, its own domain and whether it takes public
   endpoints, its certificate, its activation, the devices it runs on — each with its state and checks, its actions in
   this proxy, and what the device still runs after one — and adding more, its endpoints (made on it from a service's
   page), and, once no device runs it, moving its endpoints to another proxy of its account and deleting it, saying
   what goes. */
export const ProxyPage: React.FC = () => {
  const { proxyID } = useParams<{ proxyID: string }>()
  // All the page holds is one proxy's — its dialogs, its picker, its answers —: another proxy's address starts afresh,
  // so a dialog opened on one never acts on the next.
  return <OneProxy key={proxyID} proxyID={proxyID} />
}

const OneProxy: React.FC<{ proxyID: string }> = ({ proxyID }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const [proxy, setProxy] = useState<Proxy | null | 'ERROR' | typeof UNSUPPORTED>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ severity: 'error' | 'info'; text: string }>()
  const [adding, setAdding] = useState(false)
  const [refusals, setRefusals] = useState<ILookup<string>>({})
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)
  const [slug, setSlug] = useState<string | null>()
  const { reload: reloadList } = useAccountProxies()
  const reads = useRef(0)
  const ownerId = proxy && typeof proxy === 'object' && !proxy.remoteit ? proxy.owner?.id : undefined

  // Only the last read asked for is shown: one answered late never overwrites a newer one.
  const load = useCallback(async () => {
    const read = ++reads.current
    const answer = await graphQLProxy(proxyID)
    if (read === reads.current) setProxy(answer)
  }, [proxyID])
  // The proxy read again after a change, and the list beside it.
  const refresh = async () => {
    reloadList()
    await load()
  }

  useEffect(() => {
    load()
  }, [load])

  // The account's slug as it is now: a new label's host is made under it.
  useEffect(() => {
    if (!ownerId) return
    graphQLAccountSlug(ownerId)
      .then(answer => setSlug(typeof answer === 'string' && answer !== 'ERROR' && answer !== UNSUPPORTED ? answer : null))
      .catch(() => setSlug(null))
  }, [ownerId])

  if (proxy === undefined) return <LoadingMessage />
  if (proxy === UNSUPPORTED || proxy === 'ERROR' || proxy === null)
    return (
      <Gutters>
        <Notice severity={proxy === 'ERROR' ? 'error' : 'info'} fullWidth>
          {proxy === 'ERROR'
            ? t('proxyPage.failed', 'The proxy could not be read.')
            : t('proxyPage.none', 'No such proxy, or not one you may see.')}
        </Notice>
      </Gutters>
    )

  const own = !proxy.remoteit
  const devices = proxy.devices ?? []

  const failed = t('proxyPage.notChanged', 'It was not changed: try again.')

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
    const refused = await addEach(ids, id => graphQLAddProxyDevice(proxy.id, id))
    setRefusals(refused)
    if (!Object.keys(refused).length) setAdding(false)
    await refresh()
    setBusy(false)
  }

  // Deleted, it is gone from here: the list opens, read again, and the proxy is not.
  const remove = async () => {
    setBusy(true)
    const refused = refusalOf(await graphQLDeleteProxy(proxy.id, !!proxy.endpoints))
    setBusy(false)
    setDeleting(false)
    if (refused !== undefined)
      return setNotice({ severity: 'error', text: refused || t('proxyPage.notDeleted', 'It was not deleted.') })
    reloadList()
    history.push('/proxies')
  }

  // A field saved as it was is no change: never sent — a label sent again would move its host to the account's slug.
  const rename = (set: { name?: string; label?: string }) =>
    (set.name !== undefined && set.name === proxy.name) || (set.label !== undefined && set.label === labelOf(proxy.host))
      ? undefined
      : change(() => graphQLRenameProxy(proxy.id, set), failed)

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{proxy.name}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {proxy.remoteit
                ? t('proxyPage.remoteit', 'One of remote.it’s proxies · {{host}}', { host: proxy.host })
                : proxy.host}
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
        {proxy.manage && (
          <List>
            {own && (
              <InlineTextFieldSetting
                icon="tag"
                label={t('proxyPage.name', 'Name')}
                value={proxy.name}
                maxLength={255}
                disabled={busy}
                onSave={name => rename({ name: String(name).trim() })}
              />
            )}
            {own ? (
              <InlineTextFieldSetting
                icon="globe"
                label={t('proxyPage.host', 'Host: its label before your account slug')}
                value={labelOf(proxy.host)}
                displayValue={proxy.host}
                filter={/[^a-z0-9]/g}
                maxLength={NAME_MAX}
                disabled={busy}
                validate={value =>
                  validLabel(value)
                    ? undefined
                    : t('proxyPage.labelProblem', 'Lower case letters and digits, at most {{max}}', { max: NAME_MAX })
                }
                helper={value =>
                  value && value !== labelOf(proxy.host)
                    ? t(
                        'proxyPage.labelMoves',
                        'Its host becomes {{host}}: every endpoint’s address moves to it, and its certificate is issued again — https names fail until then.',
                        { host: hostWith(proxy.host, value, slug) }
                      )
                    : undefined
                }
                onSave={label => rename({ label: String(label) })}
              />
            ) : (
              <ListItemSetting icon="globe" label={proxy.host} subLabel={t('proxyPage.hostHint', 'Where it is reached')} />
            )}
            {own && (
              <ListItemSetting
                icon="earth-americas"
                label={proxy.domain || t('proxyPage.domainNone', 'remote.it’s names')}
                subLabel={t('proxyPage.domain', 'Its https names: your own domain, or remote.it’s')}
              />
            )}
            {own && proxy.certificate && (
              <ListItemSetting
                icon="certificate"
                iconColor={proxy.certificate === 'pending' ? 'warning' : 'success'}
                label={certificateLine(t, proxy.certificate)}
                subLabel={t('proxyPage.certificate', 'Its https certificate')}
              />
            )}
            {own && (
              <ListItemSetting
                icon="users"
                label={
                  proxy.publicEndpoints
                    ? t('proxyPage.publicEndpoints', 'Takes public endpoints')
                    : t('proxyPage.publicEndpointsNot', 'Takes no public endpoints')
                }
                subLabel={t(
                  'proxyPage.publicEndpointsHint',
                  'Public: anyone with the address; else only signed-in and address-locked ones'
                )}
              />
            )}
            <SelectSetting
              icon="right-to-bracket"
              label={t('proxyPage.activation', 'A device added goes into service')}
              value={proxy.activation}
              values={[
                { key: 'auto', name: t('proxyPage.activationAuto', 'By itself, once its checks pass') },
                { key: 'admin', name: t('proxyPage.activationAdmin', 'When an admin puts it in service') },
              ]}
              disabled={busy}
              onChange={activation =>
                change(() => graphQLSetProxyActivation(proxy.id, activation as Proxy['activation']), failed)
              }
            />
            <ListItemSetting
              icon="plug"
              label={endpointsLine(t, proxy.endpoints)}
              subLabel={t('proxyPage.endpointsHint', 'Made on it from a service’s page, under Proxy endpoints')}
            />
          </List>
        )}
        {proxy.manage && (
          <List data-runs-on>
            <ListSubheader>
              {t('proxyPage.runsOn', 'Runs on')}
              {own && (
                <IconButton
                  icon={adding ? 'times' : 'plus'}
                  title={adding ? t('proxyPage.cancelAdd', 'Cancel') : t('proxyPage.add', 'Add devices')}
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setRefusals({})
                    setAdding(!adding)
                  }}
                />
              )}
            </ListSubheader>
            {adding && proxy.owner && (
              <Gutters>
                <RunDevicePicker
                  kind="proxy"
                  ownerId={proxy.owner.id}
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
                kind="proxy"
                run={device}
                name={proxy.name}
                activation={proxy.activation}
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
                  secondary={
                    proxy.endpoints
                      ? t(
                          'proxyPage.runsOnNoneEndpoints',
                          'No device runs it: its endpoints keep their addresses, and work again once a device added is in service.'
                        )
                      : t('proxyPage.runsOnNone', 'No device runs it: add one to serve its endpoints.')
                  }
                />
              </ListItem>
            )}
          </List>
        )}
        {proxy.manage && own && (
          <List>
            {!devices.length && !!proxy.endpoints && (
              <ListItemSetting
                icon="arrow-right-arrow-left"
                label={t('proxyPage.move', 'Move its endpoints to another proxy')}
                subLabel={t('proxyPage.moveHint', 'Each endpoint’s address moves to the other proxy’s names')}
                button={t('proxyPage.moveButton', 'Move')}
                disabled={busy}
                onButtonClick={() => setMoving(true)}
              />
            )}
            <ListItemSetting
              icon="trash"
              label={t('proxyPage.delete', 'Delete this proxy')}
              subLabel={
                devices.length
                  ? t('proxyPage.deleteRunning', 'Take its devices out of it first')
                  : t('proxyPage.deleteHint', 'It is kept until it is deleted, with no device running it too')
              }
              button={t('proxyPage.deleteButton', 'Delete')}
              disabled={busy || !!devices.length}
              onButtonClick={() => setDeleting(true)}
            />
          </List>
        )}
      </Gutters>
      {moving && (
        <MoveProxyEndpoints
          proxy={proxy}
          onClose={() => setMoving(false)}
          onMoved={async () => {
            setMoving(false)
            await refresh()
          }}
        />
      )}
      <Confirm
        open={deleting}
        title={t('proxyPage.deleteTitle', 'Delete {{proxy}}?', { proxy: proxy.name })}
        action={t('proxyPage.deleteButton', 'Delete')}
        color="error"
        disabled={busy}
        onConfirm={remove}
        onDeny={() => setDeleting(false)}
      >
        <Typography variant="body2">{deleteProxyLine(t, proxy.endpoints)}</Typography>
      </Confirm>
    </Container>
  )
}

// An own proxy's certificate: its domain's, on its devices; remote.it's, ready; or remote.it's, still to come.
export function certificateLine(t: TFunction, certificate: Proxy['certificate']): string {
  if (certificate === 'own') return t('proxyPage.certificateOwn', "Your domain's, on its devices (proxy_cert, proxy_key)")
  if (certificate === 'ready') return t('proxyPage.certificateReady', "remote.it's, for its names")
  return t(
    'proxyPage.certificatePending',
    "remote.it's, issued within a day of its name: until then https names fail"
  )
}

/* The endpoints of a proxy no device runs, moved to another of its account's: each address before and after said
   first, then the move made. Refused on a name or port clash, in graphql's words. */
const MoveProxyEndpoints: React.FC<{ proxy: Proxy; onClose: () => void; onMoved: () => void }> = ({
  proxy,
  onClose,
  onMoved,
}) => {
  const { t } = useTranslation()
  const [targets, setTargets] = useState<Proxy[] | 'ERROR'>()
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState<EndpointsMove>()
  const [refusal, setRefusal] = useState<string>()
  const [busy, setBusy] = useState(false)
  // The proxy chosen last: what an earlier choice's answer says is not shown for it.
  const chosen = useRef('')

  useEffect(() => {
    if (!proxy.owner) return
    graphQLAccountProxies(proxy.owner.id).then(read =>
      setTargets(Array.isArray(read) ? read.filter(each => each.id !== proxy.id) : 'ERROR')
    )
  }, [proxy.id, proxy.owner?.id])

  const choose = async (target: string) => {
    chosen.current = target
    setTo(target)
    setPreview(undefined)
    setRefusal(undefined)
    const said = await graphQLMoveProxyEndpoints(proxy.id, target, false)
    if (chosen.current !== target) return
    if ('reason' in said) setRefusal(said.reason || t('proxyPage.moveFailed', 'The move could not be said: try again.'))
    else setPreview(said)
  }

  const move = async () => {
    setBusy(true)
    const done = await graphQLMoveProxyEndpoints(proxy.id, to, true)
    setBusy(false)
    if ('reason' in done)
      return setRefusal(done.reason || t('proxyPage.moveNotMade', 'The move was not made: try again.'))
    onMoved()
  }

  return (
    <Confirm
      open
      maxWidth="sm"
      title={t('proxyPage.moveTitle', 'Move the endpoints of {{proxy}}', { proxy: proxy.name })}
      action={t('proxyPage.moveButton', 'Move')}
      disabled={busy || !preview || !!refusal}
      onConfirm={move}
      onDeny={onClose}
    >
      {targets === undefined ? (
        <LoadingMessage />
      ) : targets === 'ERROR' ? (
        <Notice severity="error" fullWidth>
          {t('proxyPage.moveUnread', 'Its account’s proxies could not be read: try again.')}
        </Notice>
      ) : !targets.length ? (
        <Typography variant="body2">{t('proxyPage.moveNone', 'Its account has no other proxy to take them.')}</Typography>
      ) : (
        <TextField
          select
          fullWidth
          size="small"
          label={t('proxyPage.moveTo', 'To')}
          value={to}
          onChange={event => choose(String(event.target.value))}
        >
          {targets.map(each => (
            <MenuItem key={each.id} value={each.id}>
              {each.name} · {each.host}
            </MenuItem>
          ))}
        </TextField>
      )}
      {preview && (
        <List dense data-move-preview>
          {preview.addresses.map(address => (
            <ListItem key={address.endpoint} disableGutters>
              <ListItemText primary={address.to} secondary={t('proxyPage.moveFrom', 'was {{from}}', address)} />
            </ListItem>
          ))}
        </List>
      )}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}
