import React, { useContext, useEffect, useState } from 'react'
import { AppIcon } from '../components/AppIcon'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useHistory, useParams } from 'react-router-dom'
import { Box, Button, ButtonBase, Collapse, FormControlLabel, List, Switch, TextField, Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { DeviceApp, DeviceAppService } from '../services/graphQLDeviceApps'
import { firstPortOf, formatPorts } from '../services/multiPortServices'
import { CatalogApp, graphQLCatalogApp } from '../services/graphQLAppCatalog'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useAppSwitch, RootConsent } from '../components/AppRootConsent'
import { DeviceAppSetting } from '../components/DeviceAppSetting'
import { AppOpen } from '../components/DeviceApps'
import { AppTerminalAction } from '../components/AppTerminal'
import { Container } from '../components/Container'
import { ExpandIcon } from '../components/ExpandIcon'
import { LoadingMessage } from '../components/LoadingMessage'
import { Confirm } from '../components/Confirm'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import {
  addAsks,
  adminLine,
  appName,
  appPurpose,
  appStatus,
  adminRefuses,
  asksConsent,
  capabilitiesLine,
  channelName,
  consentCovers,
  consentLine,
  day,
  heldBackLine,
  heldConsentWords,
  managedLine,
  needsLine,
  publisherLine,
  when,
} from '../helpers/appsHelper'
import { opensTerminal } from '../helpers/sshHelper'
import { LIST_ITEM_ICON_WIDTH, radius, spacing } from '../styling'

type Move = { channel?: string; version?: string } // a channel ("" its account's) or a pin ("" none)

// The setting that lets AI run commands through an app that declares ssh-exec (the terminal app's).
const AI_COMMANDS = 'ai_commands'

/* The app on this device (presence-server docs/device-apps-design.md, "The Apps pages",
   /devices/:deviceID/apps/:appID), from the device's apps (Device.apps), in the order people need it:

     What it does   its description from the catalogue (else a line from its name and how it opens), who publishes it,
                    and what it needs (full control where it runs as root, its capabilities)
     Status         an On/Off switch and its state in a word or two, with what the device says beside where it says
                    more; an update waiting for a consent (Update now…) or held by a pin (Unpin)
     Service        each of its services, the primary first, opened by its protocol — Open terminal for one that is ssh
                    where the app signs people in by certificate (components/AppTerminal), a page for http and https, a
                    viewer for vnc and rdp, a connection alone for udp —; a multi-port service's ports, and the ports
                    its owner chooses, edited there and not again under Settings
     Sessions       how many it serves now; each, as whom and since when, for those who manage it
     Settings       its options in its release's words — "AI can run commands on this device" for an app that lets AI
                    run commands —, all but numbers, which sit under Advanced
     Version        expandable: the version it runs, its channel, the version it is kept on (a pin), its root consent and
                    its delivery grant
     Advanced       expandable: its numeric limits and the key its service presents
     Problems       what the device says is wrong with its settings
     Remove app…    which asks first: its files and data on the device are deleted.

   Turning it on, updating, the channel and the pin run code on the device: Scripting as well as Manage. Without Manage
   nothing changes. An app its product holds is greyed, "Managed by its product <name>": graphql refuses a change. One
   its machine's administrator keeps local says so up front, its switch and Remove greyed (its channel and pin stay);
   one turned off there, its switch greyed while off (Remove stays). One being removed shows its state and version,
   and nothing to change. The releases offered for a pin are the catalogue's (catalogApp); where the API has no
   catalogue, only the pin it has. */
export const DeviceAppPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { appID } = useParams<{ appID: string }>()
  const { device } = useContext(DeviceContext)
  const deviceApps = useDeviceApps(device?.id, { accountId: device?.accountId })
  const { apps, switching, setRelease, remove, setSetting } = deviceApps
  const [refusal, setRefusal] = useState<string>()
  const [saving, setSaving] = useState<string>()
  const [removing, setRemoving] = useState(false)
  // A channel or pin whose release asks for a consent, asked first: the change, and the releases the yes is to.
  const [moving, setMoving] = useState<{ key: string; values: Move; releases: string[] }>()
  const [catalog, setCatalog] = useState<CatalogApp | null>()
  const failed = (reason: string) => setRefusal(reason || t('apps.notChangedRetry', 'Couldn’t change the app. Try again.'))
  const { flip, reconsent, consent } = useAppSwitch(deviceApps, failed, undefined, device?.accountId)

  const accountId = device?.accountId
  useEffect(() => {
    let current = true
    setCatalog(undefined)
    graphQLCatalogApp(appID, { accountId, releases: 100 }).then(
      answer => current && setCatalog(typeof answer === 'object' ? answer : null)
    )
    return () => {
      current = false
    }
  }, [appID, accountId])

  if (!device || apps === undefined) return <LoadingMessage />
  const app = apps?.find(a => a.id === appID)
  const back = `/devices/${device.id}/services`

  const header = (
    <>
      <Gutters bottom={null}>
        <Link to={back} data-app-back>
          <Icon name="angle-left" size="sm" inlineLeft />
          {device.name}
        </Link>
      </Gutters>
      <Typography variant="h1">
        <Title>{app ? appName(t, app) : appID}</Title>
      </Typography>
    </>
  )

  if (!app)
    return (
      <Container gutterBottom header={header}>
        <Box data-app-missing>
          <Notice gutterTop>
            {apps === null
              ? t('apps.unserved', 'This server does not have apps.')
              : t('apps.notOnDevice', 'This app is not on this device.')}
          </Notice>
        </Box>
      </Container>
    )

  const name = appName(t, app)
  const canManage = !!device.permissions?.includes('MANAGE')
  const canRun = canManage && !!device.permissions?.includes('SCRIPTING')
  const gone = app.state === 'removing'
  const held = !!app.locked
  const busy = switching !== undefined
  const runLocked = !canRun || held || gone || busy
  const enabled = switching === app.id ? !app.enabled : app.enabled
  // The machine's administrator refuses the switch either way (local), or enabling it (off); and its removal (local).
  const adminHeld = adminRefuses(app, app.enabled ? 'disable' : 'enable')
  const admin = adminLine(t, app)
  // Its services, the primary first, each shown while it is served. A setting that is a shown service's port, or one
  // of its listeners', is edited in one place: under that service, labelled so; in Settings otherwise (disabled, its
  // services stopped).
  const shown = gone ? [] : app.services.filter(served => !!served.serviceId)
  const ports = new Map(shown.flatMap(served => portSettingsOf(t, served)))
  const settings = app.settings.filter(setting => (!setting.deprecated || setting.at) && !ports.has(setting.name))
  const accountChannel = catalog?.accountChannel ?? 'stable'
  const channel = app.channel || accountChannel
  const waitingRoot = app.heldBack?.reason === 'consent' || (!app.heldBack && !!app.awaitingRoot)
  // Held back for what its state already says (graphql gives both the same words: a withdrawal, one kept though
  // withdrawn, the device's refusal): said once, in State.
  const heldSaid = app.heldBack?.reason === 'unavailable' && app.heldBack.detail === app.detail

  const change = async (key: string, work: () => Promise<unknown>) => {
    setSaving(key)
    setRefusal(undefined)
    await work()
    setSaving(undefined)
  }
  const release = (key: string, values: Parameters<typeof setRelease>[1]) =>
    change(key, async () => {
      const answer = await setRelease(app, values)
      if (answer !== true) failed(answer.reason)
    })

  const pins = (catalog?.releases ?? []).filter(r => !r.withdrawn).map(r => r.version)
  if (app.pinned && !pins.includes(app.pinned)) pins.unshift(app.pinned)
  /* A channel or a pin (or none): the releases it gives the device (helpers/appsHelper addAsks — a channel's candidate
     or current, by its bucket). While the app is enabled, one that asks for a consent the one kept with the app does
     not cover is asked first, as graphql refuses it without — every such release named, as which of them the device
     is given is its bucket's, graphql's to say; a disabled app is given no release, and asks nothing until it is
     enabled. */
  const move = (key: string, values: Move) => {
    const releases = catalog?.releases ?? []
    const given =
      app.enabled && catalog
        ? addAsks(catalog, values.channel ?? app.channel, values.version ?? app.pinned).versions
        : []
    // One not among the releases read is not known: asked, and the yes waits (RootConsent says so).
    const asking = given.filter(version => {
      const named = releases.find(r => r.version === version)
      return !named || (asksConsent(named) && !consentCovers(app.rootConsent, named, releases))
    })
    if (asking.length) return setMoving({ key, values, releases: asking })
    release(key, values)
  }
  // Whether the release waiting for a consent runs as root, where the catalogue lists it; else as the app's own does.
  const awaitingRoot = catalog?.releases.find(r => r.version === app.awaitingRoot)?.root ?? app.root
  // A disabled app's service is stopped (graphql names none): said where its release serves one.
  const stopped = !app.serviceId && !app.enabled && !gone && !!catalog?.protocol

  const status = appStatus(t, app)
  const word = switching === app.id ? t('deviceApps.switching', 'Waiting for the device…') : status.word
  const purpose = appPurpose(t, { id: app.id, name: app.name, description: catalog?.description, protocol: app.protocol })
  const needs = needsLine(t, app.root)
  const aiSetting = (setting: { name: string }) => app.capabilities.includes('ssh-exec') && setting.name === AI_COMMANDS
  // Numbers are limits people rarely change, under Advanced; a port is not one of them.
  const portNames = new Set(app.services.flatMap(served => portSettingsOf(t, served).map(([name]) => name)))
  const limit = (setting: { name: string; type: string }) => setting.type === 'int' && !portNames.has(setting.name)
  const everyday = settings.filter(setting => !limit(setting)).sort((a, b) => +aiSetting(b) - +aiSetting(a))
  const limits = settings.filter(limit)
  const settingRow = (setting: (typeof settings)[number]) => (
    <DeviceAppSetting
      key={setting.name}
      setting={setting}
      label={aiSetting(setting) ? t('apps.aiCommandsLabel', 'AI can run commands on this device') : setting.label}
      help={
        aiSetting(setting)
          ? t('apps.aiCommandsHelp', 'AI tools you connect run commands as the people you allow.')
          : setting.help
      }
      disabled={!canManage || saving === setting.name}
      onChange={value => change(setting.name, () => setSetting(app, setting.name, value))}
      onClear={
        setting.deprecated !== null && setting.at
          ? () => change(setting.name, () => setSetting(app, setting.name, null))
          : undefined
      }
    />
  )

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header}>
      <Gutters top="sm" data-device-app={app.id}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <AppIcon icon={app.icon} protocol={app.protocol} size="xl" />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {catalog !== undefined && (
              <Typography variant="body1" data-app-purpose>
                {purpose}
              </Typography>
            )}
            <Typography variant="caption" component="div" color="textSecondary" sx={{ marginTop: 0.5 }}>
              <span data-app-publisher>{publisherLine(t, app)}</span>
              {needs && (
                <>
                  {' · '}
                  <Box component="span" color="warning.main" data-app-runs>
                    {needs}
                  </Box>
                </>
              )}
            </Typography>
            {!!app.capabilities.length && (
              <Typography variant="caption" component="div" color="textSecondary" data-app-asks>
                {capabilitiesLine(t, app.capabilities)}
              </Typography>
            )}
            {held && app.locked && (
              <Typography variant="caption" component="div" color="textSecondary" data-app-managed>
                {managedLine(t, app.locked)}
              </Typography>
            )}
            {!gone && admin && (
              <Typography variant="caption" component="div" color="textSecondary" data-app-admin={app.adminControl}>
                {admin}
              </Typography>
            )}
          </Box>
        </Box>
        {refusal && (
          <Notice severity="error" fullWidth gutterTop onClose={() => setRefusal(undefined)}>
            {refusal}
          </Notice>
        )}
      </Gutters>
      <Gutters>
        <Box
          sx={{ bgcolor: 'grayLightest.main', borderRadius: `${radius.lg}px`, paddingX: 3, paddingY: 2 }}
          data-app-row-state
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="h3"
                color={status.problem && app.enabled && !busy ? 'error' : undefined}
                data-app-state
              >
                {word}
              </Typography>
              {status.detail && switching !== app.id && (
                <Typography variant="caption" component="div" color="textSecondary" data-app-state-detail>
                  {status.detail}
                </Typography>
              )}
            </Box>
            {!gone && (
              <FormControlLabel
                labelPlacement="start"
                sx={{ marginRight: 0, gap: 1 }}
                label={
                  <Typography variant="body2" color="textSecondary">
                    {enabled ? t('apps.on', 'On') : t('apps.off', 'Off')}
                  </Typography>
                }
                control={
                  <Switch
                    checked={enabled}
                    disabled={busy || held || adminHeld || (app.enabled ? !canManage : !canRun)}
                    onChange={e => flip(app, e.target.checked)}
                    inputProps={{ 'aria-label': t('apps.onSwitch', 'Turn {{app}} on or off', { app: name }) }}
                    data-app-enabled
                  />
                }
              />
            )}
          </Box>
          {app.enabled && !gone && ((app.heldBack && !heldSaid) || (!app.heldBack && app.awaitingRoot)) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', marginTop: 1 }}>
              <Typography
                variant="body2"
                color={waitingRoot ? 'warning.main' : 'textSecondary'}
                sx={{ flexGrow: 1 }}
                data-app-held-back={app.heldBack?.reason ?? 'consent'}
              >
                {app.heldBack
                  ? heldBackLine(t, app.heldBack, app.pinned)
                  : t('apps.heldBack', 'Not updated: {{reason}}', { reason: heldConsentWords(t, awaitingRoot) })}
              </Typography>
              {waitingRoot && !held && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  disabled={runLocked}
                  onClick={() => reconsent(app)}
                  data-app-update-now
                >
                  {t('apps.updateNow', 'Update now…')}
                </Button>
              )}
              {app.heldBack?.reason === 'pinned' && !held && (
                <Button
                  size="small"
                  disabled={runLocked || !!saving}
                  onClick={() => move('pin', { version: '' })}
                  data-app-unpin
                >
                  {t('apps.unpinLatest', 'Use latest version')}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Gutters>
      {(!!shown.length || (app.enabled && !gone && app.sessionsOpen > 0) || stopped) && (
        <Gutters top={null}>
          {shown.map(served => {
            const service = device.services?.find(s => s.id === served.serviceId)
            // Its ports as the device's service has them, as every connection to it reads them (a port setting's change
            // reads the device again: hooks/useDeviceApps).
            const list = service?.ports ?? (service ? [String(service.port)] : [])
            const several = served.multiPort || list.length > 1 || !!list[0]?.includes('-')
            const own = [...ports].filter(([, port]) => port.service === served)
            return (
              <Row key={served.key ?? ''} label={t('apps.service', 'Service')} data="service">
                <Box sx={{ flexGrow: 1, minWidth: 0 }} data-app-service={served.key ?? ''}>
                  <Typography variant="body2">
                    {several
                      ? t('apps.serviceLinePorts', '{{name}} · ports {{ports}}', {
                          name: service?.name ?? served.name,
                          ports: formatPorts(list),
                        })
                      : !list.length
                      ? served.name
                      : served.protocol === 'udp'
                      ? t('apps.serviceLineUdp', '{{name}} · UDP port {{port}}', {
                          name: service?.name ?? served.name,
                          port: list[0],
                        })
                      : t('apps.serviceLine', '{{name}} · port {{port}}', { name: service?.name ?? served.name, port: list[0] })}
                  </Typography>
                  {/* A connection reaches its first port, the launch port; the rest by name on the device's address
                      (graphql-api docs/MULTI-PORT-SERVICES.md, "Clients: address mode only"). */}
                  {several && list.length > 0 && (
                    <Typography variant="caption" component="div" color="textSecondary" data-app-service-ports>
                      {t('multiPort.firstPortOnly', 'This connection reaches port {{port}} only.', {
                        port: firstPortOf(list[0]),
                      })}{' '}
                      {t('apps.portsByAddress', 'Reach all its ports, {{ports}}, at the device’s address.', {
                        ports: formatPorts(list),
                      })}
                    </Typography>
                  )}
                  {own.map(([name, port]) => {
                    const setting = app.settings.find(s => s.name === name)
                    if (!setting) return null
                    return (
                      <List key={name} dense disablePadding data-app-port-setting={name} sx={{ marginLeft: `-${spacing.sm}px` }}>
                        <DeviceAppSetting
                          setting={setting}
                          label={port.label}
                          help={setting.help}
                          disabled={!canManage || saving === name}
                          onChange={value => change(name, () => setSetting(app, name, value))}
                        />
                      </List>
                    )
                  })}
                </Box>
                {app.enabled &&
                  (opensTerminal(app, served) ? (
                    <AppTerminalAction device={device} app={app} service={served} />
                  ) : (
                    <AppOpen device={device} app={app} service={served} />
                  ))}
              </Row>
            )
          })}
          {stopped && (
            <Row label={t('apps.service', 'Service')} data="service">
              <Typography variant="body2" color="textSecondary" data-app-service-stopped>
                {t('apps.serviceStoppedOff', 'Stopped while the app is off. Turn it on to open it.')}
              </Typography>
            </Row>
          )}
          {app.enabled && !gone && app.sessionsOpen > 0 && (
            <Row label={t('apps.sessions', 'Sessions')} data="sessions" top>
              <Box sx={{ paddingTop: 1 }}>
                <Typography variant="body2" data-app-sessions-open>
                  {t('apps.sessionsOpen', '{{number}} open now', { number: app.sessionsOpen })}
                </Typography>
                {canManage &&
                  app.sessions.map(session => (
                    <Typography
                      key={session.session}
                      variant="caption"
                      component="div"
                      color="textSecondary"
                      data-app-session={session.session}
                    >
                      {sessionLine(t, session)}
                    </Typography>
                  ))}
                {canManage && app.sessions.length > 0 && app.sessionsOpen > app.sessions.length && (
                  <Typography variant="caption" component="div" color="textSecondary" data-app-sessions-more>
                    {t('apps.sessionsMore', '{{number}} more not listed', {
                      number: app.sessionsOpen - app.sessions.length,
                    })}
                  </Typography>
                )}
              </Box>
            </Row>
          )}
        </Gutters>
      )}
      {!!everyday.length && !gone && (
        <Box data-app-row-settings>
          <Typography variant="subtitle1">
            <Title>{t('apps.settings', 'Settings')}</Title>
          </Typography>
          <Gutters top={null}>
            <List dense disablePadding data-app-settings={app.id} sx={{ marginLeft: `-${spacing.sm}px` }}>
              {everyday.map(settingRow)}
            </List>
          </Gutters>
        </Box>
      )}
      {!!app.problems?.length && (
        <Gutters top={null}>
          <Notice severity="warning" fullWidth>
            <Box data-app-row-problems>
              {app.problems.map(problem => (
                <Box key={problem.name} data-app-problem={problem.name}>
                  {problem.detail || `${problem.name}: ${problem.error}`}
                </Box>
              ))}
            </Box>
          </Notice>
        </Gutters>
      )}
      <Expandable title={t('apps.versionSection', 'Version')}>
        <Box data-app-version-section>
          <Row label={t('apps.version', 'Version')} data="version">
            <Typography variant="body2" data-app-version-line>
              {versionLine(t, app, channel)}
            </Typography>
          </Row>
          {!gone && (
            <Row label={t('apps.channel', 'Channel')} data="channel">
              <TextField
                select
                size="small"
                variant="standard"
                value={app.channel ?? ''}
                disabled={runLocked || !!saving}
                onChange={e => e.target.value !== (app.channel ?? '') && move('channel', { channel: e.target.value })}
                SelectProps={{ native: true }}
                inputProps={{ 'data-app-channel': true, 'aria-label': t('apps.channel', 'Channel') }}
              >
                <option value="">
                  {t('apps.accountDefaultChannel', 'Account default ({{channel}})', {
                    channel: channelName(t, accountChannel),
                  })}
                </option>
                <option value="stable">{channelName(t, 'stable')}</option>
                <option value="beta">{channelName(t, 'beta')}</option>
              </TextField>
            </Row>
          )}
          {!gone && (
            <Row label={t('apps.keepOn', 'Keep on')} data="pin">
              <TextField
                select
                size="small"
                variant="standard"
                value={app.pinned ?? ''}
                disabled={runLocked || !!saving}
                onChange={e => e.target.value !== (app.pinned ?? '') && move('pin', { version: e.target.value })}
                SelectProps={{ native: true }}
                inputProps={{ 'data-app-pin': true, 'aria-label': t('apps.keepOnVersion', 'Keep on version') }}
              >
                <option value="">{t('apps.latestVersion', 'Latest version')}</option>
                {pins.map(version => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </TextField>
            </Row>
          )}
          {app.root && app.rootConsent && (
            <Row label={t('apps.fullControl', 'Full control')} data="root">
              <Typography variant="body2" data-app-consent>
                {consentLine(t, app.rootConsent)}
                {app.rootConsent.version &&
                  ' · ' + t('apps.consentedTo', 'to {{version}}', { version: app.rootConsent.version })}
              </Typography>
            </Row>
          )}
          {!gone && (
            <Row label={t('apps.delivery', 'Delivery')} data="delivery">
              <Typography variant="body2" color="textSecondary">
                {app.grantUntil
                  ? t('apps.allowedUntil', 'Allowed until {{day}}, renewed automatically', { day: day(app.grantUntil) })
                  : app.enabled
                  ? t('apps.notAllowedYet', 'Not allowed yet')
                  : t('apps.noneWhileOff', 'None while off')}
              </Typography>
            </Row>
          )}
        </Box>
      </Expandable>
      {(!!limits.length || app.hostKey) && !gone && (
        <Expandable title={t('apps.advanced', 'Advanced')}>
          <Box data-app-advanced>
            {!!limits.length && (
              <List dense disablePadding data-app-limits={app.id} sx={{ marginLeft: `-${spacing.sm}px` }}>
                {limits.map(settingRow)}
              </List>
            )}
            {app.hostKey && (
              <Row label={t('apps.hostKey', 'Host key')} data="host-key">
                <Typography variant="caption" color="textSecondary" sx={{ wordBreak: 'break-all' }} data-host-key>
                  {app.hostKey}
                </Typography>
              </Row>
            )}
          </Box>
        </Expandable>
      )}
      {!gone && canManage && (
        <Gutters>
          <Button
            variant="outlined"
            size="small"
            color="error"
            disabled={busy || held || adminRefuses(app, 'remove')}
            onClick={() => setRemoving(true)}
            data-app-remove
          >
            {t('apps.removeApp', 'Remove app…')}
          </Button>
          {!canRun && (
            <Typography variant="caption" color="textSecondary" component="p" sx={{ marginTop: 1 }} data-app-scripting>
              {t(
                'apps.needsScriptingPermission',
                'Turning this app on or changing its version runs code on the device. You need the Scripting permission there.'
              )}
            </Typography>
          )}
        </Gutters>
      )}
      {consent}
      <RootConsent
        app={moving ? app : undefined}
        release={moving?.releases}
        accountId={device.accountId}
        action={root =>
          moving?.values.version
            ? root
              ? t('apps.pinRootAction', 'Pin with full control')
              : t('apps.pinAsksAction', 'Allow and pin')
            : t('deviceApps.rootUpdateAction', 'Consent and update')
        }
        onConfirm={() => {
          const move = moving
          setMoving(undefined)
          if (move) release(move.key, { ...move.values, consentRoot: true })
        }}
        onDeny={() => setMoving(undefined)}
      />
      <Confirm
        open={removing}
        color="error"
        title={t('apps.removeTitle', 'Remove {{app}} from {{device}}?', { app: name, device: device.name })}
        action={t('apps.removeAppAction', 'Remove app')}
        onConfirm={() => {
          setRemoving(false)
          change('remove', async () => {
            const answer = await remove(app)
            if (answer !== true) failed(answer.reason)
            else history.push(back)
          })
        }}
        onDeny={() => setRemoving(false)}
      >
        <Typography variant="body2" data-app-remove-words>
          {t('apps.removeAppBody', 'This deletes the app’s files and data on the device. You can’t undo this.')}
        </Typography>
      </Confirm>
    </Container>
  )
}

// One line of the page: its label, then what it says and its controls.
/* The settings that are a service's ports, each with the words it is edited under there: a service of one port's
   (portSetting), the port people connect to; a listener's, where it listens — a multi-port service's ports are its
   listeners' own, so each is named by its listener. */
function portSettingsOf(t: TFunction, service: DeviceAppService): [string, { service: DeviceAppService; label: string }][] {
  const out: [string, { service: DeviceAppService; label: string }][] = []
  if (service.portSetting) out.push([service.portSetting, { service, label: t('apps.servicePort', 'Port people connect to') }])
  for (const listener of service.listeners) {
    if (!listener.portSetting || out.some(([name]) => name === listener.portSetting)) continue
    const label = listener.name
      ? t('apps.listenerPort', 'Port of {{listener}}', { listener: listener.name })
      : t('apps.listenPort', 'Port it listens on')
    out.push([listener.portSetting, { service, label }])
  }
  return out
}

const Row: React.FC<{ label: string; data: string; top?: boolean; children: React.ReactNode }> = ({
  label,
  data,
  top,
  children,
}) => (
  <Box
    sx={{ display: 'flex', alignItems: top ? 'flex-start' : 'center', gap: 1, minHeight: 40, paddingY: 0.5 }}
    {...{ [`data-app-row-${data}`]: true }}
  >
    <Typography
      variant="body2"
      color="textSecondary"
      sx={{ width: LIST_ITEM_ICON_WIDTH + 40, flexShrink: 0, paddingTop: top ? 1 : 0 }}
    >
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, flexWrap: 'wrap' }}>{children}</Box>
  </Box>
)

// A session it serves, as the app reports it: the session (its id's first characters), as whom on the device, by an AI
// where one opened it, and since when. Never who: an app knows a session, not a person.
function sessionLine(t: TFunction, session: DeviceApp['sessions'][number]): string {
  return [
    t('apps.sessionId', 'Session {{id}}', { id: session.session.slice(0, 8) }),
    session.login && t('apps.sessionAs', 'as {{login}}', { login: session.login }),
    session.via === 'ai' && t('apps.sessionByAi', 'by an AI'),
    session.since && t('apps.sessionSince', 'since {{when}}', { when: when(session.since) }),
  ]
    .filter(Boolean)
    .join(' · ')
}

/* The version it runs, and the one its channel offers where that is newer: "1.4.0, up to date", "1.4.0 · 1.5.0 on
   Beta". Running only where the device says it runs: one it holds but does not run (turned off by its administrator,
   refused, withdrawn and kept) is on the device, not running. */
function versionLine(t: TFunction, app: DeviceApp, channel: string): string {
  if (!app.enabled)
    return app.version
      ? t('apps.versionKeptOff', '{{version}}, kept on the device while off', { version: app.version })
      : t('apps.versionNotInstalled', 'Not on the device yet')
  const runs = app.state === 'running' || app.state === 'starting'
  const have = app.version
    ? runs
      ? app.version
      : t('apps.versionNotRunning', '{{version}} on the device, not running', { version: app.version })
    : t('apps.versionNotInstalled', 'Not on the device yet')
  if (app.upToDate && runs) return t('apps.versionUpToDate', '{{version}}, up to date', { version: have })
  const offered = app.release ?? app.latest
  return offered && offered !== app.version
    ? t('apps.versionOffered', '{{version}} · {{offered}} on {{channel}}', {
        version: have,
        offered,
        channel: channelName(t, channel),
      })
    : have
}

// A section kept closed until asked for, titled as the page's other sections are.
const Expandable: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Typography variant="subtitle1">
        <Title>
          <ButtonBase
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            sx={{ font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: 'inherit' }}
          >
            {title}
            <ExpandIcon open={open} />
          </ButtonBase>
        </Title>
      </Typography>
      <Collapse in={open}>
        <Gutters top={null}>{children}</Gutters>
      </Collapse>
    </>
  )
}
