import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useHistory, useParams } from 'react-router-dom'
import { Box, Button, Divider, List, Switch, TextField, Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { DeviceApp } from '../services/graphQLDeviceApps'
import { CatalogApp, graphQLCatalogApp } from '../services/graphQLAppCatalog'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useAppSwitch, RootConsent } from '../components/AppRootConsent'
import { DeviceAppSetting } from '../components/DeviceAppSetting'
import { AppOpen } from '../components/DeviceApps'
import { firstPartyApp } from '../components/firstPartyApps'
import { Container } from '../components/Container'
import { LoadingMessage } from '../components/LoadingMessage'
import { Confirm } from '../components/Confirm'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import {
  channelName,
  consentLine,
  day,
  heldBackLine,
  managedLine,
  publisherLine,
  runsAsLine,
  stateLine,
} from '../helpers/appsHelper'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'

/* The app on this device (presence-server docs/device-apps-design.md, "The Apps pages",
   /devices/:deviceID/apps/:appID), from the device's apps (Device.apps):

     State      enabled or disabled, and starting, running or unavailable with its detail — the Enabled switch beside it
     Version    the version it runs against the one offered on its channel: up to date, or held back with why and what
                would release it (Update now… for a release waiting for root consent, Unpin for a pin, none for the rest)
     Channel    its channel (the account's, stable, beta) and its pin (none, or a release of it)
     Service    its service, opened as any service opens; the console's Open terminal and host key
     Settings   the app's options, the setting rows the device's settings use
     Root       who consented, when, to which release and how (root apps only)
     Delivery   when the delivery grant last given lapses; none while disabled
     Problems   what the device says is wrong with its settings
     Disable or Enable, and Remove… — which asks first: its files and data on the device are deleted.

   Enabling, updating, the channel and the pin run code on the device: Scripting as well as Manage. Without Manage
   nothing changes. An app its product holds is greyed, "Managed by its product <name>": graphql refuses a change. One
   being removed shows its state and version, and nothing to change. The releases offered for a pin are the
   catalogue's (catalogApp); where the API has no catalogue, only the pin it has. */
export const DeviceAppPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { appID } = useParams<{ appID: string }>()
  const { device } = useContext(DeviceContext)
  const deviceApps = useDeviceApps(device?.id)
  const { apps, switching, setRelease, remove, setSetting } = deviceApps
  const [refusal, setRefusal] = useState<string>()
  const [saving, setSaving] = useState<string>()
  const [removing, setRemoving] = useState(false)
  const [pinning, setPinning] = useState<string>() // a root release to pin, asking first
  const [catalog, setCatalog] = useState<CatalogApp | null>()
  const failed = (reason: string) => setRefusal(reason || t('apps.notChanged', 'The app was not changed.'))
  const { flip, reconsent, consent } = useAppSwitch(deviceApps, failed)

  const accountId = device?.accountId
  useEffect(() => {
    let current = true
    setCatalog(undefined)
    graphQLCatalogApp(appID, { accountId, releases: 50 }).then(
      answer => current && setCatalog(typeof answer === 'object' ? answer : null)
    )
    return () => {
      current = false
    }
  }, [appID, accountId])

  if (!device || apps === undefined) return <LoadingMessage />
  const app = apps?.find(a => a.id === appID)
  const back = `/devices/${device.id}/edit`

  const header = (
    <>
      <Gutters bottom={null}>
        <Link to={back} data-app-back>
          <Icon name="angle-left" size="sm" inlineLeft />
          {device.name}
        </Link>
      </Gutters>
      <Typography variant="h1">
        <Title>{app?.name ?? appID}</Title>
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

  const own = firstPartyApp(app.id)
  const words = own?.settings?.(t) ?? {}
  const canManage = !!device.permissions?.includes('MANAGE')
  const canRun = canManage && !!device.permissions?.includes('SCRIPTING')
  const gone = app.state === 'removing'
  const held = !!app.locked
  const busy = switching !== undefined
  const runLocked = !canRun || held || gone || busy
  const enabled = switching === app.id ? !app.enabled : app.enabled
  const settings = app.settings.filter(setting => !setting.deprecated || setting.at)
  const accountChannel = catalog?.accountChannel ?? 'stable'
  const channel = app.channel || accountChannel
  const service = device.services?.find(s => s.id === app.serviceId)
  const waitingRoot = app.heldBack?.reason === 'consent' || (!app.heldBack && !!app.awaitingRoot)

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
  const pin = (version: string) => {
    const root = catalog?.releases.find(r => r.version === version)?.root
    if (version && root && !app.rootConsent) return setPinning(version)
    release('pin', { version })
  }

  return (
    <Container gutterBottom bodyProps={{ verticalOverflow: true }} header={header}>
      <Gutters top="sm" data-device-app={app.id}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Icon name={own?.icon ?? 'cube'} size="xl" fixedWidth />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="textSecondary" data-app-publisher>
              {publisherLine(t, app)}
            </Typography>
            <Typography variant="body2" color={app.root ? 'warning.main' : 'textSecondary'} data-app-runs>
              {runsAsLine(t, app.root)}
            </Typography>
            {held && app.locked && (
              <Typography variant="body2" color="textSecondary" data-app-managed>
                {managedLine(t, app.locked)}
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
        <Row label={t('apps.state', 'State')} data="state">
          <Typography
            variant="body2"
            color={app.state === 'unavailable' && !busy ? 'error' : undefined}
            sx={{ flexGrow: 1 }}
          >
            {switching === app.id
              ? t('deviceApps.switching', 'Waiting for the device…')
              : own?.state?.(t, app) ?? stateLine(t, app)}
          </Typography>
          {!gone && (
            <>
              <Typography variant="body2" color="textSecondary">
                {t('apps.enabled', 'Enabled')}
              </Typography>
              <Switch
                checked={enabled}
                disabled={busy || held || (app.enabled ? !canManage : !canRun)}
                onChange={e => flip(app, e.target.checked)}
                inputProps={{ 'aria-label': t('apps.enabledSwitch', '{{app}} enabled', { app: app.name }) }}
                data-app-enabled
              />
            </>
          )}
        </Row>
        <Row label={t('apps.version', 'Version')} data="version">
          <Box>
            <Typography variant="body2" data-app-version-line>
              {versionLine(t, app, channel)}
            </Typography>
            {app.enabled && app.heldBack && (
              <Typography
                variant="body2"
                color={waitingRoot ? 'warning.main' : 'textSecondary'}
                data-app-held-back={app.heldBack.reason}
              >
                {heldBackLine(t, app.heldBack, app.pinned)}
              </Typography>
            )}
            {app.enabled && !app.heldBack && app.awaitingRoot && (
              <Typography variant="body2" color="warning.main" data-app-held-back="consent">
                {t('apps.heldBack', 'Held back: {{reason}}', {
                  reason: t('apps.heldConsent', 'A new version needs to run as root'),
                })}
              </Typography>
            )}
          </Box>
          {app.enabled && waitingRoot && !held && (
            <Button
              size="small"
              color="warning"
              disabled={runLocked}
              onClick={() => reconsent(app)}
              data-app-update-now
            >
              {t('apps.updateNow', 'Update now…')}
            </Button>
          )}
          {app.enabled && app.heldBack?.reason === 'pinned' && !held && (
            <Button size="small" disabled={runLocked || !!saving} onClick={() => release('pin', { version: '' })} data-app-unpin>
              {t('apps.unpin', 'Unpin')}
            </Button>
          )}
        </Row>
        {!gone && (
          <Row label={t('apps.channel', 'Channel')} data="channel">
            <TextField
              select
              size="small"
              variant="standard"
              value={app.channel ?? ''}
              disabled={runLocked || !!saving}
              onChange={e => e.target.value !== (app.channel ?? '') && release('channel', { channel: e.target.value })}
              SelectProps={{ native: true }}
              inputProps={{ 'data-app-channel': true, 'aria-label': t('apps.channel', 'Channel') }}
            >
              <option value="">
                {t('apps.accountChannelIs', 'Account’s ({{channel}})', { channel: channelName(t, accountChannel) })}
              </option>
              <option value="stable">{channelName(t, 'stable')}</option>
              <option value="beta">{channelName(t, 'beta')}</option>
            </TextField>
            <Typography variant="body2" color="textSecondary" sx={{ marginLeft: 3 }}>
              {t('apps.pin', 'Pin')}
            </Typography>
            <TextField
              select
              size="small"
              variant="standard"
              value={app.pinned ?? ''}
              disabled={runLocked || !!saving}
              onChange={e => e.target.value !== (app.pinned ?? '') && pin(e.target.value)}
              SelectProps={{ native: true }}
              inputProps={{ 'data-app-pin': true, 'aria-label': t('apps.pin', 'Pin') }}
            >
              <option value="">{t('apps.noPin', 'None')}</option>
              {pins.map(version => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </TextField>
          </Row>
        )}
        {app.serviceId && !gone && (
          <Row label={t('apps.service', 'Service')} data="service">
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                {service
                  ? t('apps.serviceLine', '{{name}} · port {{port}}', { name: service.name, port: service.port })
                  : app.name}
              </Typography>
              {own?.Lines && <own.Lines device={device} app={app} />}
            </Box>
            {own?.Actions ? <own.Actions device={device} app={app} /> : <AppOpen device={device} app={app} />}
          </Row>
        )}
        {!!settings.length && !gone && (
          <Row label={t('apps.settings', 'Settings')} data="settings" top>
            <List
              dense
              disablePadding
              data-app-settings={app.id}
              sx={{ flexGrow: 1, marginLeft: `-${spacing.sm}px` }}
            >
              {settings.map(setting => (
                <DeviceAppSetting
                  key={setting.name}
                  setting={setting}
                  label={words[setting.name]?.label ?? setting.label}
                  help={words[setting.name]?.help ?? setting.help}
                  disabled={!canManage || saving === setting.name}
                  onChange={value => change(setting.name, () => setSetting(app, setting.name, value))}
                  onClear={
                    setting.deprecated !== null && setting.at
                      ? () => change(setting.name, () => setSetting(app, setting.name, null))
                      : undefined
                  }
                />
              ))}
            </List>
          </Row>
        )}
        {app.root && app.rootConsent && (
          <Row label={t('apps.root', 'Root')} data="root">
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
                ? t('apps.grantUntil', 'Granted until {{day}}, renewed by itself', { day: day(app.grantUntil) })
                : app.enabled
                ? t('apps.noGrant', 'No delivery grant given yet')
                : t('apps.noGrantDisabled', 'None while disabled')}
            </Typography>
          </Row>
        )}
        {!!app.problems?.length && (
          <Row label={t('apps.problems', 'Problems')} data="problems" top>
            <Box>
              {app.problems.map(problem => (
                <Typography key={problem.name} variant="body2" color="warning.main" data-app-problem={problem.name}>
                  {problem.detail || `${problem.name}: ${problem.error}`}
                </Typography>
              ))}
            </Box>
          </Row>
        )}
      </Gutters>
      {!gone && canManage && (
        <Gutters>
          <Divider sx={{ marginBottom: 2 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={busy || held || (app.enabled ? !canManage : !canRun)}
              onClick={() => flip(app, !app.enabled)}
              data-app-toggle
            >
              {app.enabled ? t('apps.disable', 'Disable') : t('apps.enable', 'Enable')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              disabled={busy || held}
              onClick={() => setRemoving(true)}
              data-app-remove
            >
              {t('apps.remove', 'Remove…')}
            </Button>
          </Box>
          {!canRun && (
            <Typography variant="caption" color="textSecondary" component="p" sx={{ marginTop: 1 }} data-app-scripting>
              {t('apps.needsScripting', 'Enabling, updating, the channel and the pin run code on this device: they need Scripting there.')}
            </Typography>
          )}
        </Gutters>
      )}
      {consent}
      <RootConsent
        app={pinning ? app : undefined}
        action={t('apps.pinRootAction', 'Pin with full control')}
        onConfirm={() => {
          const version = pinning
          setPinning(undefined)
          if (version) release('pin', { version, consentRoot: true })
        }}
        onDeny={() => setPinning(undefined)}
      />
      <Confirm
        open={removing}
        color="error"
        title={t('apps.removeTitle', 'Remove {{app}} from {{device}}?', { app: app.name, device: device.name })}
        action={t('apps.removeAction', 'Remove')}
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
          {t('apps.removeBody', 'Its files and its data on the device are deleted. This cannot be undone.')}
        </Typography>
      </Confirm>
    </Container>
  )
}

// One line of the page: its label, then what it says and its controls.
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

// What it runs against what it is offered: "1.4.0 running · 1.4.0 offered on stable · up to date".
function versionLine(t: TFunction, app: DeviceApp, channel: string): string {
  const running = app.version
    ? t('apps.running', '{{version}} running', { version: app.version })
    : t('apps.notRunning', 'Nothing running yet')
  if (!app.enabled)
    return app.version
      ? t('apps.versionDisabled', '{{version}} on the device, disabled', { version: app.version })
      : t('apps.versionNone', 'Nothing on the device')
  const offered = app.release ?? app.latest
  return [
    running,
    offered &&
      t('apps.offeredOn', '{{version}} offered on {{channel}}', { version: offered, channel: channelName(t, channel) }),
    app.upToDate && t('apps.upToDate', 'up to date'),
  ]
    .filter(Boolean)
    .join(' · ')
}
