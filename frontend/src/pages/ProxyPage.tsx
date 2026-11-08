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
  NamesMove,
  Proxy,
  endpointAddress,
  graphQLAccountProxies,
  graphQLDeleteProxy,
  graphQLMoveProxyEndpoints,
  graphQLProxy,
  graphQLRenameProxy,
  graphQLSetProxyActivation,
  graphQLSetProxyDomain,
  graphQLSetProxyLabel,
  graphQLSetProxyPublicEndpoints,
} from '../services/graphQLProxy'
import { NAME_MAX, graphQLAccountSlug, validLabel } from '../services/subnetNames'
import { deleteProxyLine, endpointsLine, proxyKindLabel, stillRunsLine } from '../helpers/runsHelper'
import { useAccountProxies } from '../hooks/useAccountExits'
import { RunDevicePicker, addEach } from '../components/RunDevicePicker'
import { EndpointLocalAddresses } from '../components/EndpointLocalAddresses'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { SelectSetting } from '../components/SelectSetting'
import { RunListItem } from '../components/RunListItem'
import { ProxyAccessList } from '../components/ProxyAccessList'
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

/* One proxy (graphql-api docs/PROXY-GROUPS.md §13 and §14). Its kind, for everyone who sees it: Internet, or Local
   network only, with its network. For whoever manages it: its name; its host and its own domain — each change said
   first, every endpoint address that moves and the certificate after, then made — and, where the account's slug
   changed since, moving it onto the new one; its kind, chosen when it was made; whether it takes public endpoints; its
   certificate and activation; the devices it runs on — each with its state and checks, a local proxy's device's
   private address, whether an Internet proxy's device is reached from the internet, its actions in this proxy, and
   what the device still runs after one — and adding more; its endpoints — a local proxy's each at its public name
   first, then its .local name and each device's IP and port — and who visited them; and, once no device runs it,
   moving its endpoints to another proxy of its account and deleting it, saying what goes. */
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
  // A change of its names, said before it is made: its label (its host) or its own domain.
  const [naming, setNaming] = useState<{ label: string } | { domain: string | null }>()
  const [publicOff, setPublicOff] = useState<string>()
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
    const refused = refusalOf(await graphQLDeleteProxy(proxy.id, !!proxy.endpointCount))
    setBusy(false)
    setDeleting(false)
    if (refused !== undefined)
      return setNotice({ severity: 'error', text: refused || t('proxyPage.notDeleted', 'It was not deleted.') })
    reloadList()
    history.push('/proxies')
  }

  // A name saved as it was is no change, and is not sent.
  const rename = (name: string) => (name === proxy.name ? undefined : change(() => graphQLRenameProxy(proxy.id, name), failed))
  const label = proxy.label ?? labelOf(proxy.host)
  // Its host under a slug the account no longer has: the same label moves it onto the account's slug now.
  const slugMoved = !!slug && hostWith(proxy.host, label, slug) !== proxy.host
  // A label or domain saved as it stands — the host under the account's slug already — is no change: nothing is asked.
  const setLabel = (value: string) => (value === label && !slugMoved ? undefined : setNaming({ label: value }))
  const setDomain = (value: string) =>
    value === (proxy.domain ?? '') ? undefined : setNaming({ domain: value || null })

  // Public endpoints taken on at once; given up, refused while it has some — saying how many —, which are removed only
  // once that is confirmed.
  const setPublic = async (on: boolean, confirm = false) => {
    setBusy(true)
    const refused = refusalOf(await graphQLSetProxyPublicEndpoints(proxy.id, on, confirm))
    setBusy(false)
    if (refused !== undefined && !on && !confirm && refused) return setPublicOff(refused)
    setPublicOff(undefined)
    setNotice(refused === undefined ? undefined : { severity: 'error', text: refused || failed })
    await refresh()
  }

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
                : `${proxy.host} · ${proxyKindLabel(t, proxy)}`}
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
                onSave={name => rename(String(name).trim())}
              />
            )}
            {own ? (
              <InlineTextFieldSetting
                icon="globe"
                label={t('proxyPage.host', 'Host: its label before your account slug')}
                value={label}
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
                  value && (value !== label || slugMoved)
                    ? t('proxyPage.labelSays', 'Its host becomes {{host}}: what moves is said before anything does.', {
                        host: hostWith(proxy.host, value, slug),
                      })
                    : undefined
                }
                onSave={value => setLabel(String(value))}
              />
            ) : (
              <ListItemSetting icon="globe" label={proxy.host} subLabel={t('proxyPage.hostHint', 'Where it is reached')} />
            )}
            {own && slugMoved && (
              <ListItemSetting
                icon="arrow-right-arrow-left"
                iconColor="warning"
                label={t('proxyPage.oldSlug', 'Its host is under the account’s former slug')}
                subLabel={t('proxyPage.oldSlugHint', 'Moved onto the account’s slug now, it becomes {{host}}', {
                  host: hostWith(proxy.host, label, slug),
                })}
                button={t('proxyPage.oldSlugMove', 'Move')}
                disabled={busy}
                onButtonClick={() => setNaming({ label })}
              />
            )}
            {own && (
              <InlineTextFieldSetting
                icon="earth-americas"
                label={t('proxyPage.domain', 'Your own domain for its https names')}
                value={proxy.domain || ''}
                placeholder={t('proxyPage.domainNone', 'none: each https endpoint at a name of its own')}
                disabled={busy}
                onSave={value => setDomain(String(value).trim().toLowerCase())}
              />
            )}
            {own && (
              <ListItemSetting
                icon={proxy.local ? 'house-signal' : 'cloud'}
                label={proxyKindLabel(t, proxy)}
                subLabel={[
                  proxy.local
                    ? t(
                        'proxyKind.localHint',
                        'Reached only on its devices’ own network, for printers, PCs and anything without remote.it.'
                      )
                    : t('proxyKind.internetHint', 'Reached from anywhere its devices can be reached.'),
                  proxy.local && !proxy.localNetwork
                    ? t('proxyPage.localNetworkFirst', 'Its network is its first device’s.')
                    : '',
                  t('proxyPage.kindFixed', 'Chosen when it was made: it cannot be changed.'),
                ]
                  .filter(Boolean)
                  .join(' ')}
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
                label={t('proxyPage.publicEndpoints', 'Takes public endpoints')}
                subLabel={t(
                  'proxyPage.publicEndpointsHint',
                  'Public: anyone with the address; else only signed-in and address-locked ones'
                )}
                toggle={proxy.publicEndpoints}
                disabled={busy}
                onClick={() => setPublic(!proxy.publicEndpoints)}
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
          </List>
        )}
        <List data-endpoints>
          <ListSubheader>{t('proxyPage.endpointsTitle', 'Endpoints')}</ListSubheader>
          {(proxy.endpoints ?? []).map(endpoint => (
            <ListItem key={endpoint.id} data-endpoint={endpoint.id}>
              <ListItemText
                primary={endpointAddress(endpoint)}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    {[endpoint.kind, endpoint.access, endpoint.lifetime].join(' · ')}
                    <EndpointLocalAddresses endpoint={endpoint} />
                  </>
                }
              />
            </ListItem>
          ))}
          <ListItem>
            <ListItemText
              secondary={[
                proxy.endpointCount !== null ? endpointsLine(t, proxy.endpointCount) : '',
                t('proxyPage.endpointsHint', 'Made on it from a service’s page, under Proxy endpoints'),
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          </ListItem>
        </List>
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
                  target={proxy.id}
                  ownerId={proxy.owner.id}
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
                local={proxy.local}
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
                    proxy.endpointCount
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
            {!devices.length && !!proxy.endpointCount && (
              <ListItemSetting
                icon="arrow-right-arrow-left"
                label={t('proxyPage.move', 'Move its endpoints to another proxy')}
                subLabel={t(
                  'proxyPage.moveHint',
                  'Its tcp and udp endpoints move to the other proxy’s name; its https ones keep their own'
                )}
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
        {proxy.manage && (
          <List>
            <ListSubheader>{t('proxyAccess.title', 'Recent visitors')}</ListSubheader>
            <ProxyAccessList
              scope={{ proxy: proxy.id }}
              showEndpoint
              devices={Object.fromEntries(devices.map(device => [device.id, device.name || device.id]))}
            />
          </List>
        )}
      </Gutters>
      {naming && (
        <MoveNames
          proxy={proxy}
          change={naming}
          onClose={() => setNaming(undefined)}
          onMoved={async () => {
            setNaming(undefined)
            await refresh()
          }}
        />
      )}
      <Confirm
        open={!!publicOff}
        title={t('proxyPage.publicOffTitle', 'Stop {{proxy}} taking public endpoints?', { proxy: proxy.name })}
        action={t('proxyPage.publicOffAction', 'Remove them')}
        color="error"
        disabled={busy}
        onConfirm={() => setPublic(false, true)}
        onDeny={() => setPublicOff(undefined)}
      >
        <Typography variant="body2" gutterBottom data-public-off>
          {publicOff}
        </Typography>
        <Typography variant="body2">
          {t(
            'proxyPage.publicOffBody',
            'Confirmed, its public endpoints are removed, for everyone using one; the others stay.'
          )}
        </Typography>
      </Confirm>
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
        <Typography variant="body2">{deleteProxyLine(t, proxy.endpointCount)}</Typography>
      </Confirm>
    </Container>
  )
}

// An own proxy's certificate: its domain's, on its devices; or remote.it's for every proxy name, held or still to come.
export function certificateLine(t: TFunction, certificate: Proxy['certificate']): string {
  if (certificate === 'own') return t('proxyPage.certificateOwn', "Your domain's, on its devices (proxy_cert, proxy_key)")
  if (certificate === 'ready') return t('proxyPage.certificateReady', "remote.it's, for every proxy name")
  return t(
    'proxyPage.certificatePending',
    "remote.it's, not issued yet: until it is, its https endpoints are not served"
  )
}

/* Its label or its own domain changed: what moves said first — its host and domain after, every endpoint address before
   and after, and the certificate its https endpoints are served with after (its own domain's, or remote.it's for every
   proxy name) — then made. Refused in graphql's words: a host another proxy holds, a domain of remote.it's or another
   proxy's. */
const MoveNames: React.FC<{
  proxy: Proxy
  change: { label: string } | { domain: string | null }
  onClose: () => void
  onMoved: () => void
}> = ({ proxy, change, onClose, onMoved }) => {
  const { t } = useTranslation()
  const [said, setSaid] = useState<NamesMove | { reason: string }>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const ask = (apply: boolean) =>
    'label' in change
      ? graphQLSetProxyLabel(proxy.id, change.label, apply)
      : graphQLSetProxyDomain(proxy.id, change.domain, apply)

  useEffect(() => {
    ask(false).then(setSaid)
  }, [])

  const move = async () => {
    setBusy(true)
    const done = await ask(true)
    setBusy(false)
    if ('reason' in done) return setRefusal(done.reason || t('proxyPage.namesNotMoved', 'Nothing was moved: try again.'))
    onMoved()
  }

  const preview = said && !('reason' in said) ? said : undefined
  const nothing = !!preview && !preview.addresses.length && preview.host === proxy.host && preview.domain === proxy.domain
  return (
    <Confirm
      open
      maxWidth="sm"
      title={
        'label' in change
          ? t('proxyPage.labelTitle', 'Move {{proxy}} to {{host}}?', {
              proxy: proxy.name,
              host: preview?.host ?? hostWith(proxy.host, change.label),
            })
          : change.domain
          ? t('proxyPage.domainTitle', 'Give {{proxy}} the domain {{domain}}?', { proxy: proxy.name, domain: change.domain })
          : t('proxyPage.domainNoneTitle', 'Take {{proxy}}’s https names off {{domain}}?', {
              proxy: proxy.name,
              domain: proxy.domain,
            })
      }
      action={t('proxyPage.namesMove', 'Move')}
      color="error"
      disabled={busy || !preview || nothing || !!refusal}
      onConfirm={move}
      onDeny={onClose}
    >
      {said === undefined ? (
        <LoadingMessage />
      ) : 'reason' in said ? (
        <Notice severity="error" fullWidth>
          {said.reason || t('proxyPage.namesUnsaid', 'What it would do could not be said: try again.')}
        </Notice>
      ) : nothing ? (
        <Typography variant="body2">{t('proxyPage.namesNothing', 'Nothing moves: it is so already.')}</Typography>
      ) : (
        <>
          <Typography variant="body2" gutterBottom data-names-certificate>
            {namesCertificateLine(t, said)}
          </Typography>
          {said.addresses.length ? (
            <List dense data-names-addresses>
              {said.addresses.map(address => (
                <ListItem key={address.endpoint} disableGutters>
                  <ListItemText primary={address.to} secondary={t('proxyPage.moveFrom', 'was {{from}}', address)} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2">{t('proxyPage.namesNoAddresses', 'No endpoint address moves.')}</Typography>
          )}
        </>
      )}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}

// The certificate its https endpoints are served with after a names change.
export function namesCertificateLine(t: TFunction, said: Pick<NamesMove, 'certificate' | 'host' | 'domain'>): string {
  if (said.certificate === 'own')
    return t(
      'proxyPage.namesOwn',
      'Its https endpoints are served with {{domain}}’s certificate, which you put on its devices (proxy_cert, proxy_key).',
      { domain: said.domain }
    )
  if (said.certificate === 'ready')
    return t(
      'proxyPage.namesReady',
      'Its https endpoints are served with remote.it’s certificate for every proxy name.'
    )
  return t(
    'proxyPage.namesPending',
    'remote.it’s certificate for every proxy name is not issued yet: until it is, its https endpoints are not served.'
  )
}

/* The endpoints of a proxy no device runs, moved to another of its account's: each address before and after said
   first — a tcp or udp one moves to the other proxy's name, an https one keeps its own but onto or off an own domain
   —, then the move made. Refused on a name or port clash, in graphql's words. */
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
              {[each.name, each.host, each.local ? t('proxies.local', 'Local network') : '']
                .filter(Boolean)
                .join(' · ')}
            </MenuItem>
          ))}
        </TextField>
      )}
      {preview && (
        <List dense data-move-preview>
          {preview.addresses.map(address => (
            <ListItem key={address.endpoint} disableGutters>
              <ListItemText
                primary={address.to}
                secondary={
                  address.from === address.to
                    ? t('proxyPage.moveKept', 'keeps its address')
                    : t('proxyPage.moveFrom', 'was {{from}}', address)
                }
              />
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
