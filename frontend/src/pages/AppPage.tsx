import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TextField,
  Typography,
} from '@mui/material'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import {
  CatalogApp,
  CatalogAppDevice,
  CatalogAppRelease,
  CatalogDeviceFilter,
  CatalogRead,
  graphQLCatalogApp,
  graphQLSetAccountAppChannel,
  UNSERVED,
} from '../services/graphQLAppCatalog'
import { DeviceAppChange, graphQLSetDeviceAppsRelease, refused } from '../services/graphQLDeviceApps'
import { AppChangeResults } from '../components/AppChangeResults'
import { firstPartyApp } from '../components/firstPartyApps'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Confirm } from '../components/Confirm'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { channelName, day, heldBackLine, stateWord } from '../helpers/appsHelper'

const RELEASES_PAGE = 20

/* The app in the catalogue (presence-server docs/device-apps-design.md, "The Apps pages", /apps/:appID), from
   catalogApp:

     its name and version, its publisher (Verified, Yours), Runs as root or Restricted, its description and platforms;
     Add… (/apps/:appID/add), and Manage releases for the account's own publisher (the Publisher page, where releases
     are published);
     Channels on this stage — each channel's release, its candidate and to how many of the devices — and the channel
     this account follows (setAccountAppChannel);
     Releases, newest first: each version, its date, where this stage's channels point at it, root, its platforms,
     withdrawn, and its notes opened in place; Show more;
     Your devices: how many enabled, disabled, up to date and held back; each device's version running, channel, state,
     and up to date or held back with the reason in words — filtered by held back and by version. A row opens the app
     on that device. Update selected moves each to its channel's release, unpinned (setDeviceAppsRelease with version
     ""), asking first for the yes to root where any is held for it; Pin selected… picks a release. Each device's
     result is listed after: a refusal is that device's. */
export const AppPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { appID } = useParams<{ appID: string }>()
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const userId = useSelector((state: State) => state.user.id)
  const account = accountId && accountId !== userId ? accountId : undefined
  const [app, setApp] = useState<CatalogRead<CatalogApp | null>>()
  const [releases, setReleases] = useState(RELEASES_PAGE)
  const [filter, setFilter] = useState<CatalogDeviceFilter>({})
  const [selected, setSelected] = useState<string[]>([])
  const [opened, setOpened] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const [results, setResults] = useState<DeviceAppChange[]>()
  const [asking, setAsking] = useState<'update' | 'pin'>()
  const [pinTo, setPinTo] = useState('')
  const [consented, setConsented] = useState(false)

  // Only the latest read lands: a filter changed while one was under way does not show the one before.
  const latest = useRef(0)
  const load = useCallback(async () => {
    const read = ++latest.current
    const answer = await graphQLCatalogApp(appID, { accountId: account, releases, ...filter })
    if (read === latest.current) setApp(answer)
  }, [appID, account, releases, filter.heldBack, filter.version])

  useEffect(() => {
    setSelected([])
    load()
  }, [load])

  // Another app, or another account's: read afresh.
  useEffect(() => {
    setApp(undefined)
    setResults(undefined)
    setReleases(RELEASES_PAGE)
    setFilter({})
  }, [appID, account])

  const header = (name?: string) => (
    <>
      <Gutters bottom={null}>
        <Link to="/apps" data-app-back>
          <Icon name="angle-left" size="sm" inlineLeft />
          {t('apps.title', 'Apps')}
        </Link>
      </Gutters>
      <Typography variant="h1">
        <Title>{name ?? appID}</Title>
      </Typography>
    </>
  )

  if (app === undefined) return <LoadingMessage />
  if (app === null || app === UNSERVED || app === 'ERROR')
    return (
      <Container gutterBottom header={header()}>
        <Box data-app-unavailable>
          <Notice gutterTop severity={app === 'ERROR' ? 'error' : 'info'}>
            {app === null
              ? t('apps.notInCatalog', 'This app is not one this account may use.')
              : app === UNSERVED
              ? t('apps.catalogUnserved', 'This server does not have the app catalogue yet.')
              : t('apps.catalogFailed', 'The apps could not be read.')}
          </Notice>
        </Box>
      </Container>
    )

  const devices = app.devices?.items ?? []
  const chosen = devices.filter(d => selected.includes(d.deviceId))
  const needsConsent = chosen.some(d => d.heldBack?.reason === 'consent')
  const standing = app.releases.filter(r => !r.withdrawn)
  const pinRelease = standing.find(r => r.version === pinTo)
  const pinNeedsConsent = !!pinRelease?.root

  const many = async (values: { version: string; consentRoot?: boolean }) => {
    setBusy(true)
    setRefusal(undefined)
    setResults(undefined)
    const answer = await graphQLSetDeviceAppsRelease(
      app.id,
      chosen.map(d => d.deviceId),
      values.consentRoot ? values : { version: values.version }
    )
    setBusy(false)
    if (refused(answer)) return setRefusal(answer.reason || t('apps.notChanged', 'The app was not changed.'))
    setResults(answer)
    setSelected([])
    load()
  }

  const follow = async (channel: string) => {
    setBusy(true)
    setRefusal(undefined)
    const answer = await graphQLSetAccountAppChannel(app.id, channel, account)
    setBusy(false)
    if (refused(answer)) return setRefusal(answer.reason || t('apps.channelNotChanged', 'The channel was not changed.'))
    setApp({ ...app, accountChannel: answer.accountChannel })
  }

  const toggle = (id: string) => setSelected(now => (now.includes(id) ? now.filter(s => s !== id) : [...now, id]))

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header(app.name)}>
      <Gutters top="sm" data-catalog-app-page={app.id}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Icon name={firstPartyApp(app.id)?.icon ?? 'cube'} size="xl" fixedWidth />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" data-app-about>
              {[
                app.version ?? t('apps.noRelease', 'No release here yet'),
                app.publisher.name,
                app.publisher.verifiedDomain &&
                  t('deviceApps.verified', 'Verified: {{domain}}', { domain: app.publisher.verifiedDomain }),
                app.publisher.own && t('apps.yours', 'Yours'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            <Typography variant="body2" color={app.root ? 'warning.main' : 'textSecondary'} data-app-runs>
              {app.root
                ? t('apps.runsAsRootFull', 'Runs as root: full control of the device')
                : t('apps.restricted', 'Restricted')}
            </Typography>
            {app.description && (
              <Typography variant="body2" color="textSecondary" data-app-description>
                {app.description}
              </Typography>
            )}
            {!!app.platforms.length && (
              <Typography variant="caption" color="textSecondary" data-app-platforms>
                {app.platforms.join(' · ')}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
              <Button
                size="small"
                variant="contained"
                disabled={!app.version}
                onClick={() => history.push(`/apps/${app.id}/add`)}
                data-app-add
              >
                {t('apps.addEllipsis', 'Add…')}
              </Button>
              {app.publisher.own && (
                <Button size="small" variant="outlined" onClick={() => history.push('/account/publisher')} data-app-manage>
                  {t('apps.manageReleases', 'Manage releases')}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        {refusal && (
          <Notice severity="error" fullWidth gutterTop onClose={() => setRefusal(undefined)}>
            {refusal}
          </Notice>
        )}
      </Gutters>

      <List dense data-app-channels>
        <ListSubheader sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('apps.channelsHere', 'Channels on this stage')}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {t('apps.accountFollows', 'This account follows')}
            </Typography>
            <TextField
              select
              size="small"
              variant="standard"
              value={app.accountChannel ?? 'stable'}
              disabled={busy}
              onChange={e => e.target.value !== (app.accountChannel ?? 'stable') && follow(e.target.value)}
              SelectProps={{ native: true }}
              inputProps={{ 'data-account-channel': true, 'aria-label': t('apps.accountFollows', 'This account follows') }}
            >
              <option value="stable">{channelName(t, 'stable')}</option>
              <option value="beta">{channelName(t, 'beta')}</option>
            </TextField>
          </Box>
        </ListSubheader>
        {app.channels.map(channel => (
          <ListItem key={channel.channel} data-app-channel={channel.channel}>
            <ListItemText
              primary={`${channelName(t, channel.channel)}  ${channel.current ?? '—'}`}
              secondary={
                channel.candidate
                  ? t('apps.candidate', 'Candidate {{version}} to {{share}}% of devices', {
                      version: channel.candidate,
                      share: channel.share,
                    })
                  : undefined
              }
            />
          </ListItem>
        ))}
      </List>

      <List dense data-app-releases>
        <ListSubheader>{t('apps.releases', 'Releases')}</ListSubheader>
        {app.releases.map(release => (
          <ReleaseRow
            key={release.version}
            release={release}
            open={opened === release.version}
            onToggle={() => setOpened(opened === release.version ? undefined : release.version)}
          />
        ))}
        {app.releases.length >= releases && (
          <ListItem>
            <Button size="small" onClick={() => setReleases(releases + RELEASES_PAGE)} data-app-more-releases>
              {t('apps.showMore', 'Show more')}
            </Button>
          </ListItem>
        )}
      </List>

      <List dense data-app-fleet>
        <ListSubheader sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {t('apps.yourDevices', 'Your devices')}
          <Typography variant="caption" color="textSecondary" data-app-fleet-counts>
            {[
              t('apps.fleetEnabled', '{{number}} enabled', { number: app.fleet.enabled }),
              t('apps.fleetDisabled', '{{number}} disabled', { number: app.fleet.disabled }),
              t('apps.fleetUpToDate', '{{number}} up to date', { number: app.fleet.upToDate }),
              t('apps.fleetHeldBack', '{{number}} held back', { number: app.fleet.heldBack }),
            ].join(' · ')}
          </Typography>
        </ListSubheader>
        <ListItem sx={{ gap: 1, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            variant="standard"
            value={filter.heldBack === undefined ? 'all' : filter.heldBack ? 'held' : 'current'}
            onChange={e =>
              setFilter({
                ...filter,
                heldBack: e.target.value === 'all' ? undefined : e.target.value === 'held',
              })
            }
            SelectProps={{ native: true }}
            inputProps={{ 'data-fleet-filter': true, 'aria-label': t('apps.filter', 'Which devices') }}
          >
            <option value="all">{t('apps.filterAll', 'All')}</option>
            <option value="held">{t('apps.filterHeldBack', 'Held back')}</option>
            <option value="current">{t('apps.filterUpToDate', 'Up to date')}</option>
          </TextField>
          <TextField
            select
            size="small"
            variant="standard"
            value={filter.version ?? ''}
            onChange={e => setFilter({ ...filter, version: e.target.value || undefined })}
            SelectProps={{ native: true }}
            inputProps={{ 'data-fleet-version': true, 'aria-label': t('apps.filterVersion', 'Version') }}
          >
            <option value="">{t('apps.anyVersion', 'Any version')}</option>
            {app.fleet.versions
              .filter(v => v.version)
              .map(v => (
                <option key={v.version!} value={v.version!}>
                  {v.version}
                </option>
              ))}
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            variant="outlined"
            disabled={!chosen.length || busy}
            onClick={() => (needsConsent ? setAsking('update') : many({ version: '' }))}
            data-fleet-update
          >
            {t('apps.updateSelected', 'Update selected')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!chosen.length || busy || !standing.length}
            onClick={() => {
              setPinTo(standing[0]?.version ?? '')
              setConsented(false)
              setAsking('pin')
            }}
            data-fleet-pin
          >
            {t('apps.pinSelected', 'Pin selected…')}
          </Button>
        </ListItem>
        {results && (
          <ListItem>
            <Box sx={{ width: '100%' }}>
              <Notice fullWidth onClose={() => setResults(undefined)}>
                <AppChangeResults changes={results} />
              </Notice>
            </Box>
          </ListItem>
        )}
        {!devices.length ? (
          <ListItem>
            <Typography variant="body2" color="textSecondary" data-fleet-empty>
              {t('apps.noDevices', 'None of your devices has it.')}
            </Typography>
          </ListItem>
        ) : (
          devices.map(device => (
            <FleetRow
              key={device.deviceId}
              device={device}
              checked={selected.includes(device.deviceId)}
              onCheck={() => toggle(device.deviceId)}
              onOpen={() => history.push(`/devices/${device.deviceId}/apps/${app.id}`)}
            />
          ))
        )}
        {app.devices?.next && (
          <ListItem>
            <Typography variant="caption" color="textSecondary">
              {t('apps.firstDevices', 'The first {{shown}} of {{total}}: filter to find the rest.', {
                shown: devices.length,
                total: app.devices.total,
              })}
            </Typography>
          </ListItem>
        )}
      </List>

      <Confirm
        open={asking === 'update'}
        color="error"
        title={t('apps.updateRootTitle', 'Update {{app}} to run as root?', { app: app.name })}
        action={t('apps.updateRootAction', 'Consent and update')}
        onConfirm={() => {
          setAsking(undefined)
          many({ version: '', consentRoot: true })
        }}
        onDeny={() => setAsking(undefined)}
      >
        <Typography variant="body2" data-fleet-consent>
          {t(
            'apps.updateRootBody',
            'A new version of {{app}}, published by {{publisher}}, runs as root: it gets full control of each device selected — every file, account and program on it. Update only if you trust {{publisher}} with them.',
            { app: app.name, publisher: app.publisher.name }
          )}
        </Typography>
      </Confirm>
      <Confirm
        open={asking === 'pin'}
        color={pinNeedsConsent ? 'error' : 'primary'}
        disabled={!pinTo || (pinNeedsConsent && !consented)}
        title={t('apps.pinTitle', 'Pin {{app}} on the devices selected', { app: app.name })}
        action={t('apps.pinAction', 'Pin')}
        onConfirm={() => {
          setAsking(undefined)
          many({ version: pinTo, consentRoot: pinNeedsConsent || undefined })
        }}
        onDeny={() => setAsking(undefined)}
      >
        <TextField
          select
          fullWidth
          size="small"
          label={t('apps.pinTo', 'To')}
          value={pinTo}
          onChange={e => {
            setPinTo(e.target.value)
            setConsented(false)
          }}
          SelectProps={{ native: true }}
          inputProps={{ 'data-fleet-pin-to': true }}
        >
          {standing.map(release => (
            <option key={release.version} value={release.version}>
              {release.version}
            </option>
          ))}
        </TextField>
        {pinNeedsConsent && (
          <FormControlLabel
            sx={{ marginTop: 1 }}
            control={
              <Checkbox
                checked={consented}
                onChange={e => setConsented(e.target.checked)}
                inputProps={{ 'data-fleet-pin-consent': true } as any}
              />
            }
            label={t('apps.allowRootDevices', 'I allow {{publisher}}’s {{app}} full control of these devices', {
              publisher: app.publisher.name,
              app: app.name,
            })}
          />
        )}
      </Confirm>
    </Container>
  )
}

/* A release: its version, date, where this stage's channels point at it or that it was withdrawn, the first line of
   its notes — opened in place to all of them, with root and its platforms. */
const ReleaseRow: React.FC<{ release: CatalogAppRelease; open: boolean; onToggle: () => void }> = ({
  release,
  open,
  onToggle,
}) => {
  const { t } = useTranslation()
  const where = release.withdrawn
    ? t('apps.withdrawn', 'withdrawn {{day}}', { day: day(release.withdrawn) })
    : release.channels.join(', ')
  return (
    <>
      <ListItemButton onClick={onToggle} data-app-release={release.version}>
        <ListItemText
          primary={[release.version, day(release.created), where].filter(Boolean).join('   ')}
          secondary={!open ? release.notes?.split('\n')[0] : undefined}
          primaryTypographyProps={{ color: release.withdrawn ? 'error' : undefined }}
        />
        <Icon name={open ? 'angle-down' : 'angle-right'} size="md" />
      </ListItemButton>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ paddingX: 4, paddingBottom: 1 }} data-app-release-notes={release.version}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {release.notes ?? t('apps.noNotes', 'No notes.')}
          </Typography>
          <Typography variant="caption" color={release.root ? 'warning.main' : 'textSecondary'} component="div">
            {[
              release.root
                ? t('apps.runsAsRootFull', 'Runs as root: full control of the device')
                : t('apps.restricted', 'Restricted'),
              release.platforms.join(' · '),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Box>
      </Collapse>
    </>
  )
}

/* A device with the app: its version running, channel, state, and up to date or held back with the reason in words. */
const FleetRow: React.FC<{ device: CatalogAppDevice; checked: boolean; onCheck: () => void; onOpen: () => void }> = ({
  device,
  checked,
  onCheck,
  onOpen,
}) => {
  const { t } = useTranslation()
  return (
    <ListItem disablePadding data-fleet-device={device.deviceId}>
      <ListItemButton onClick={onOpen}>
        <ListItemIcon onClick={event => event.stopPropagation()}>
          <Checkbox
            size="small"
            edge="start"
            checked={checked}
            onChange={onCheck}
            inputProps={{ 'aria-label': device.name, 'data-fleet-check': device.deviceId } as any}
          />
        </ListItemIcon>
        <ListItemText
          primary={device.name}
          secondary={[device.version ?? '—', channelName(t, device.channel), stateWord(t, device.state)].join(' · ')}
        />
        <Typography
          variant="caption"
          color={device.heldBack?.reason === 'consent' ? 'warning.main' : 'textSecondary'}
          sx={{ textAlign: 'right', maxWidth: '50%' }}
          data-fleet-status
        >
          {fleetStatus(t, device)}
        </Typography>
      </ListItemButton>
    </ListItem>
  )
}

function fleetStatus(t: TFunction, device: CatalogAppDevice): string {
  if (!device.enabled) return ''
  if (device.upToDate) return t('apps.upToDateWord', 'Up to date')
  if (device.heldBack?.reason === 'pinned' && device.pinned)
    return t('apps.pinnedTo', 'Pinned to {{version}}', { version: device.pinned })
  return device.heldBack ? heldBackLine(t, device.heldBack, device.pinned) : ''
}
