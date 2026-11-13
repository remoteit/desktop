import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Switch, Typography } from '@mui/material'
import { DeviceApp } from '../services/graphQLDeviceApps'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useAppSwitch } from './AppRootConsent'
import { DeviceAppSetting } from './DeviceAppSetting'
import { firstPartyApp } from './firstPartyApps'
import { productLockNote } from '../helpers/productPolicyHelper'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'
import { Icon } from './Icon'

/* A device's apps on its Configure page (presence-server docs/device-apps-design.md, "The portal's Apps section"): a
   row each, with its switch, its state as the device says, its version and channel, its publisher, and Runs as root
   where it does. Its settings are its options, inside its row with no icon of their own, so their labels line up
   under its name — only apps get a row of their own. remote.it's own apps add their part (components/firstPartyApps:
   the console's Open terminal and host key). Turning an app on runs code on the device, so it needs Scripting as well
   as Manage, and a root app the person's yes to its full control (components/AppRootConsent); turning one off, or
   changing its settings, needs Manage alone. An app its product turns on or off, as a setting its product sets, says
   so and is held: graphql refuses a change to it, naming the product. Nothing where the API has no apps. */
export const DeviceApps: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { apps, switching, turn, setSetting } = useDeviceApps(device.id)
  const { flip, consent } = useAppSwitch(turn)
  const [saving, setSaving] = useState<string>()
  const canManage = !!device.permissions?.includes('MANAGE')
  const canRun = canManage && !!device.permissions?.includes('SCRIPTING')

  if (!apps?.length) return null

  return (
    <List dense sx={{ paddingBottom: 1 }} data-device-apps>
      <ListSubheader disableGutters>{t('deviceApps.title', 'Apps')}</ListSubheader>
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
                    {app.root && (
                      <Typography variant="caption" component="div" color="warning.main" data-app-root>
                        {t('deviceApps.runsAsRoot', 'Runs as root: full control of this device')}
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
                    {own?.Lines && <own.Lines device={device} app={app} />}
                  </>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {own?.Actions && <own.Actions device={device} app={app} />}
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
                  />
                ))}
              </List>
            )}
          </Box>
        )
      })}
      {consent}
    </List>
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
  return [t('deviceApps.publisher', 'By {{publisher}}', { publisher: app.publisher }), app.version, channel]
    .filter(Boolean)
    .join(' · ')
}

export function stateLine(t: TFunction, app: DeviceApp): string {
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
