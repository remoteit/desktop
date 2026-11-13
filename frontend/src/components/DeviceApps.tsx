import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  Typography,
} from '@mui/material'
import { useHistory } from 'react-router-dom'
import { DeviceApp, DeviceAppRootConsent, needsNewer, SCREENVIEW } from '../services/graphQLDeviceApps'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useAppSwitch } from './AppRootConsent'
import { DeviceAppSetting } from './DeviceAppSetting'
import { AddDeviceApp, offered, publisherLine } from './AddDeviceApp'
import { firstPartyApp } from './firstPartyApps'
import { productLockNote } from '../helpers/productPolicyHelper'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'
import { Icon } from './Icon'
import { timeOptions } from './Timestamp'

/* A device's apps on its Configure page (presence-server docs/device-apps-design.md, "The portal's Apps section"): a
   row each, with its switch, its state as the device says, its version and channel, its publisher, and Runs as root
   where it does. Its settings are its options, inside its row with no icon of their own, so their labels line up
   under its name — only apps get a row of their own. remote.it's own apps add their part (components/firstPartyApps:
   the console's Open terminal and host key). Turning an app on runs code on the device, so it needs Scripting as well
   as Manage, and a root app the person's yes to its full control (components/AppRootConsent); turning one off, or
   changing its settings, needs Manage alone. An app its product turns on or off, as a setting its product sets, says
   so and is held: graphql refuses a change to it, naming the product. Nothing where the API has no apps.

   Root, shown: who consented and when. A release that newly runs as root waits for a new consent, the device on its
   last restricted release meanwhile — "A new version needs to run as root", with Consent… (its product's page asks,
   where its product holds it). An app its administrator refuses (apps_root_control off) says so in words.
   A deprecated setting with a value set says why, and offers Clear: back to the default, and then no longer shown. */
export const DeviceApps: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { apps, available, switching, turn, setSetting } = useDeviceApps(device.id)
  const { flip, reconsent, consent } = useAppSwitch(turn)
  const [saving, setSaving] = useState<string>()
  const canManage = !!device.permissions?.includes('MANAGE')
  const canRun = canManage && !!device.permissions?.includes('SCRIPTING')

  if (!apps || (!apps.length && !available?.length)) return null
  // ScreenView installed the old way (build step 9): offered as the app, turned on only with the person's yes to its
  // running as root — the old install is no consent.
  const oldScreenView =
    apps.find(app => app.id === SCREENVIEW && !app.on && app.oldInstall) ??
    available?.filter(app => app.id === SCREENVIEW && app.oldInstall && app.version && !app.refused).map(offered)[0]

  return (
    <List dense sx={{ paddingBottom: 1 }} data-device-apps>
      <ListSubheader disableGutters>{t('deviceApps.title', 'Apps')}</ListSubheader>
      {oldScreenView && (
        <ListItem component="div" disableGutters data-screenview-switch>
          <ListItemIcon>
            <Icon name="android-screenview" size="md" platformIcon fixedWidth />
          </ListItemIcon>
          <ListItemText
            primary={t('deviceApps.screenviewOld', 'ScreenView was installed the old way.')}
            secondary={t(
              'deviceApps.screenviewOldHelp',
              'Switch to the ScreenView app: kept up to date by remote.it, with its settings here. It runs as root, so it asks first.'
            )}
          />
          <Button
            size="small"
            variant="contained"
            disabled={switching !== undefined || !canRun}
            onClick={() => flip(oldScreenView, true)}
            data-screenview-switch-action
          >
            {t('deviceApps.screenviewSwitch', 'Switch to the app')}
          </Button>
        </ListItem>
      )}
      {apps.map(app => {
        const own = firstPartyApp(app.id)
        const words = own?.settings?.(t) ?? {}
        const on = switching === app.id ? !app.on : app.on
        const settings = app.settings.filter(setting => !setting.deprecated || setting.at)
        return (
          <Box component="li" key={app.id} data-app={app.id} sx={{ listStyle: 'none' }}>
            <ListItem component="div" disableGutters sx={{ alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ marginTop: 0.5 }}>
                <Icon name={own?.icon ?? 'cube'} size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText
                primary={app.name}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    <Typography variant="caption" component="div" color="textSecondary" data-app-about>
                      {about(t, app)}
                    </Typography>
                    {app.root ? (
                      <Typography variant="caption" component="div" color="warning.main" data-app-root>
                        {t('deviceApps.runsAsRoot', 'Runs as root: full control of this device')}
                      </Typography>
                    ) : (
                      <Typography variant="caption" component="div" color="textSecondary" data-app-restricted>
                        {t('deviceApps.runsRestricted', 'Runs restricted: an account of its own on this device')}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      component="div"
                      color={app.state === 'unavailable' && switching !== app.id ? 'error' : 'textSecondary'}
                      data-app-state
                    >
                      {switching === app.id
                        ? t('deviceApps.switching', 'Waiting for the device…')
                        : own?.state?.(t, app) ?? stateLine(t, app)}
                    </Typography>
                    {app.locked && (
                      <Typography variant="caption" component="div" color="textSecondary" data-app-locked>
                        {productLockNote(t, app.locked)}
                      </Typography>
                    )}
                    {app.root && app.rootConsent && !app.awaitingRoot && (
                      <Typography variant="caption" component="div" color="textSecondary" data-app-consent>
                        {consentLine(t, app.rootConsent)}
                      </Typography>
                    )}
                    {app.on && app.awaitingRoot && (
                      <Typography variant="caption" component="div" color="warning.main" data-app-needs-consent>
                        {app.locked
                          ? t(
                              'deviceApps.needsConsentProduct',
                              'A new version ({{version}}) needs to run as root: its product’s page asks for consent',
                              { version: app.awaitingRoot }
                            )
                          : t(
                              'deviceApps.needsConsent',
                              'A new version ({{version}}) needs to run as root: this device stays on the version it runs until you consent',
                              { version: app.awaitingRoot }
                            )}
                      </Typography>
                    )}
                    {app.problems?.map(problem => (
                      <Typography key={problem.name} variant="caption" component="div" color="warning.main" data-app-problem={problem.name}>
                        {problem.detail || `${problem.name}: ${problem.error}`}
                      </Typography>
                    ))}
                    {own?.Lines && <own.Lines device={device} app={app} />}
                  </>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {app.on && app.awaitingRoot && !app.locked && (
                  <Button
                    size="small"
                    color="warning"
                    disabled={switching !== undefined || !canRun}
                    onClick={() => reconsent(app)}
                    data-app-consent-action
                  >
                    {t('deviceApps.consent', 'Consent…')}
                  </Button>
                )}
                {own?.Actions ? <own.Actions device={device} app={app} /> : <AppOpen device={device} app={app} />}
                <Switch
                  checked={on}
                  disabled={switching !== undefined || !!app.locked || (app.on ? !canManage : !canRun)}
                  onChange={e => flip(app, e.target.checked)}
                  inputProps={{ 'aria-label': t('deviceApps.switch', '{{app}} on', { app: app.name }) }}
                />
              </Box>
            </ListItem>
            {!!settings.length && (
              <List
                dense
                disablePadding
                data-app-settings={app.id}
                // Under the app's name: past its icon, less the gap a setting's row keeps for the icon it has not.
                sx={{ paddingLeft: `${LIST_ITEM_ICON_WIDTH - spacing.sm}px` }}
              >
                {settings.map(setting => (
                  <DeviceAppSetting
                    key={setting.name}
                    setting={setting}
                    label={words[setting.name]?.label ?? setting.label}
                    help={words[setting.name]?.help ?? setting.help}
                    disabled={!canManage || saving === `${app.id}.${setting.name}`}
                    onChange={async value => {
                      setSaving(`${app.id}.${setting.name}`)
                      await setSetting(app, setting.name, value)
                      setSaving(undefined)
                    }}
                    onClear={
                      setting.deprecated !== null && setting.at
                        ? async () => {
                            setSaving(`${app.id}.${setting.name}`)
                            await setSetting(app, setting.name, null)
                            setSaving(undefined)
                          }
                        : undefined
                    }
                  />
                ))}
              </List>
            )}
          </Box>
        )
      })}
      <AddDeviceApp available={available ?? []} canRun={canRun} busy={switching !== undefined} add={flip} />
      {consent}
    </List>
  )
}

/* Open, for any app reached as a service (serviceId) while it runs: its service's connection, started and launched as its
   application type launches — HTTP opens in the browser —, as any service's Connect page does. remote.it's own apps
   with a part of their own (components/firstPartyApps: the console's Open terminal) have theirs instead. */
export const AppOpen: React.FC<{ device: IDevice; app: DeviceApp }> = ({ device, app }) => {
  const { t } = useTranslation()
  const history = useHistory()
  if (!app.on || app.state !== 'running' || !app.serviceId) return null
  return (
    <Button
      size="small"
      variant="contained"
      data-app-open
      onClick={() =>
        history.push({
          pathname: `/devices/${device.id}/${app.serviceId}/connect`,
          state: { autoConnect: true, autoLaunch: true },
        })
      }
    >
      {t('deviceApps.open', 'Open')}
    </Button>
  )
}

// Who publishes it, and the version installed there on its channel.
function about(t: TFunction, app: DeviceApp) {
  const channel =
    app.channel === 'beta'
      ? t('deviceApps.beta', 'Beta')
      : app.channel === 'stable'
      ? t('deviceApps.stable', 'Stable')
      : app.channel
  return [publisherLine(t, app), app.version, channel]
    .filter(Boolean)
    .join(' · ')
}

// Who consented to its running as root, and when — or how it came to run as root without a person's word here.
export function consentLine(t: TFunction, consent: DeviceAppRootConsent): string {
  const words = { by: consent.email || consent.by, when: when(consent.at) }
  switch (consent.via) {
    case 'product':
      return t('deviceApps.consentedProduct', 'Runs as root by its product’s consent: {{by}}, {{when}}', words)
    case 'registration':
      return t('deviceApps.consentedRegistration', 'Runs as root since this device registered, {{when}}', words)
    case 'device':
      return t('deviceApps.consentedDevice', 'Turned on as root on the device by {{by}}, {{when}}', words)
    case 'carried':
      return t('deviceApps.consentedCarried', 'Runs as root, as it did before consents were kept')
    default:
      return t('deviceApps.consented', 'Consented to run as root by {{by}}, {{when}}', words)
  }
}

// A time as the person reads it.
function when(at: string) {
  const date = new Date(at)
  return isNaN(date.getTime()) ? at : date.toLocaleDateString(navigator.language, timeOptions.minutes)
}

// The machine's administrator refusing root apps (apps_root_control off), as graphql or the device says it.
const ROOT_REFUSED = /apps_root_control off|no apps that run as root/

export function stateLine(t: TFunction, app: DeviceApp): string {
  if (needsNewer(app)) return t('deviceApps.needsNewer', 'Needs a newer remote.it on this device')
  if (app.state === 'unavailable' && app.root && ROOT_REFUSED.test(app.detail ?? ''))
    return t(
      'deviceApps.rootRefused',
      'Not allowed here: this device’s administrator does not allow apps that run as root (apps_root_control off)'
    )
  switch (app.state) {
    case 'running':
      return t('deviceApps.running', 'Running')
    case 'starting':
      return app.detail
        ? t('deviceApps.startingDetail', 'Starting — {{detail}}', { detail: app.detail })
        : t('deviceApps.starting', 'Starting — waiting for the device to say so')
    case 'unavailable':
      return app.detail
        ? t('deviceApps.unavailable', 'Not available here: {{detail}}', { detail: app.detail })
        : t('deviceApps.unavailableNoDetail', 'Not available here')
    default:
      return t('deviceApps.off', 'Off')
  }
}
