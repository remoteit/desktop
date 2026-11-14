import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  Typography,
} from '@mui/material'
import { useHistory } from 'react-router-dom'
import { DeviceApp, SCREENVIEW } from '../services/graphQLDeviceApps'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useAppSwitch } from './AppRootConsent'
import { firstPartyApp } from './firstPartyApps'
import { adminLine, adminRefuses, heldBackLine, managedLine, offered, runsAsWord, stateWord } from '../helpers/appsHelper'
import { Notice } from './Notice'
import { Icon } from './Icon'

/* A device's apps on its Configure page (presence-server docs/device-apps-design.md, "The Apps pages", the device's Apps
   section): the device's own apps, a row each — its publisher, Runs as root or Restricted, the version it runs, its
   state in a word, held back where it is —, its Enabled switch, and the row opening the app on this device
   (/devices/:deviceID/apps/:appID), where its settings, channel, pin and Remove are. The console's Open terminal stays
   in its row. Add opens the catalogue for this device (/devices/:deviceID/apps/add), offered only where there is
   something it can add.

   Enabling runs code on the device, so it needs Scripting as well as Manage, and a root release no consent covers asks
   first (components/AppRootConsent); disabling needs Manage alone. An app its product holds says "Managed by its
   product" and its switch is held: graphql refuses a change to it. One its machine's administrator keeps local, or
   turned off, says so, and its switch is held where graphql refuses the change (adminRefuses). One being removed is
   listed until the device says it is gone, with no switch and no page. Nothing where the API has no apps.

   ScreenView installed the old way converts by itself once its daemon can run the app; where it will not, why; where
   nothing refuses it but it did not, the switch to the app, after the yes to root. */
export const DeviceApps: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const deviceApps = useDeviceApps(device.id)
  const { apps, available, switching } = deviceApps
  const [refusal, setRefusal] = useState<string>()
  const { flip, consent } = useAppSwitch(deviceApps, reason =>
    setRefusal(reason || t('apps.notChanged', 'The app was not changed.'))
  )
  const canManage = !!device.permissions?.includes('MANAGE')
  const canRun = canManage && !!device.permissions?.includes('SCRIPTING')

  if (!apps || (!apps.length && !available?.length)) return null
  // ScreenView installed the old way (build step 9; graphql's conversion): nothing shown while its daemon cannot run
  // the app yet (waiting), "Converting from the old install" on its row until the app runs, why where it will not
  // convert (refused), and where nothing refuses it but it did not convert by itself (switch), the switch to the app.
  const old =
    apps.find(app => app.id === SCREENVIEW && !app.enabled && app.oldInstall) ??
    available?.find(app => app.id === SCREENVIEW && app.oldInstall)
  const oldScreenView = old?.conversion === 'switch' ? ('settings' in old ? old : offered(old)) : undefined
  const notConverted = old?.conversion === 'refused' ? old.conversionDetail || '' : undefined
  // Something it can add: not refused by its administrator, with a release here — ScreenView's old install not
  // converted aside, said above.
  const addable = (available ?? []).some(
    app => !app.refused && app.version && !(app.id === SCREENVIEW && app.oldInstall && app.conversion === 'refused')
  )

  return (
    <List dense sx={{ paddingBottom: 1 }} data-device-apps>
      <ListSubheader disableGutters sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('deviceApps.title', 'Apps')}
        {addable && canManage && (
          <Button size="small" onClick={() => history.push(`/devices/${device.id}/apps/add`)} data-add-app>
            {t('apps.add', 'Add')}
          </Button>
        )}
      </ListSubheader>
      {refusal && (
        <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
          {refusal}
        </Notice>
      )}
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
      {notConverted !== undefined && (
        <ListItem component="div" disableGutters data-screenview-not-converted>
          <ListItemIcon>
            <Icon name="android-screenview" size="md" platformIcon fixedWidth />
          </ListItemIcon>
          <ListItemText
            primary={t('deviceApps.screenviewOld', 'ScreenView was installed the old way.')}
            secondary={
              notConverted
                ? t('deviceApps.screenviewNotConverted', 'It keeps running as it is, not switched to the app: {{why}}', { why: notConverted })
                : t('deviceApps.screenviewNotConvertedNoWhy', 'It keeps running as it is, not switched to the app')
            }
          />
        </ListItem>
      )}
      {apps.map(app => {
        const own = firstPartyApp(app.id)
        const removing = app.state === 'removing'
        const enabled = switching === app.id ? !app.enabled : app.enabled
        const row = (
          <>
            <ListItemIcon>
              <Icon name={own?.icon ?? 'cube'} size="md" fixedWidth />
            </ListItemIcon>
            <ListItemText
              primary={app.name}
              secondaryTypographyProps={{ component: 'div' }}
              secondary={
                <>
                  <Typography variant="caption" component="div" color="textSecondary" data-app-about>
                    {about(t, app, switching === app.id)}
                  </Typography>
                  {app.locked && !removing && (
                    <Typography variant="caption" component="div" color="textSecondary" data-app-locked>
                      {managedLine(t, app.locked)}
                    </Typography>
                  )}
                  {!removing && adminLine(t, app) && (
                    <Typography variant="caption" component="div" color="textSecondary" data-app-admin={app.adminControl}>
                      {adminLine(t, app)}
                    </Typography>
                  )}
                  {app.enabled && app.heldBack && app.heldBack.reason !== 'pending' && (
                    <Typography
                      variant="caption"
                      component="div"
                      color={app.heldBack.reason === 'consent' ? 'warning.main' : 'textSecondary'}
                      data-app-held-back={app.heldBack.reason}
                    >
                      {heldBackLine(t, app.heldBack, app.pinned)}
                    </Typography>
                  )}
                </>
              }
            />
          </>
        )
        // The switch and the console's Open terminal act alone: a click on them is not the row's.
        const actions = removing ? null : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={event => event.stopPropagation()}>
            {own?.Actions && <own.Actions device={device} app={app} />}
            <Switch
              checked={enabled}
              disabled={
                switching !== undefined ||
                !!app.locked ||
                adminRefuses(app, app.enabled ? 'disable' : 'enable') ||
                (app.enabled ? !canManage : !canRun)
              }
              onChange={e => flip(app, e.target.checked)}
              inputProps={{ 'aria-label': t('apps.enabledSwitch', '{{app}} enabled', { app: app.name }) }}
              data-app-switch={app.id}
            />
            <Icon name="angle-right" size="md" />
          </Box>
        )
        return (
          <ListItem key={app.id} component="div" disableGutters disablePadding data-app={app.id} data-app-state={app.state}>
            {removing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', paddingY: 0.5, width: '100%' }}>{row}</Box>
            ) : (
              <ListItemButton
                onClick={() => history.push(`/devices/${device.id}/apps/${app.id}`)}
                sx={{ paddingLeft: 0, paddingRight: 0 }}
                data-app-open-page={app.id}
              >
                {row}
                {actions}
              </ListItemButton>
            )}
          </ListItem>
        )
      })}
      {consent}
    </List>
  )
}

/* Open, for any app reached as a service (serviceId) while it runs: its service's connection, started and launched as
   its application type launches — HTTP opens in the browser —, as any service's Connect page does. remote.it's own apps
   with a part of their own (components/firstPartyApps: the console's Open terminal) have theirs instead. */
export const AppOpen: React.FC<{ device: IDevice; app: DeviceApp }> = ({ device, app }) => {
  const { t } = useTranslation()
  const history = useHistory()
  if (!app.enabled || app.state !== 'running' || !app.serviceId) return null
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

// One line: its publisher, how it runs, the version the device runs, its state in a word.
function about(t: TFunction, app: DeviceApp, switching: boolean) {
  const state = switching
    ? t('deviceApps.switching', 'Waiting for the device…')
    : app.conversion === 'converting'
    ? t('deviceApps.converting', 'Converting from the old install')
    : stateWord(t, app.state)
  return [app.publisher, runsAsWord(t, app.root), app.version ?? '—', state].join(' · ')
}
