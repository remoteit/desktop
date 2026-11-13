import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import type { AvailableApp, DeviceApp } from '../services/graphQLDeviceApps'
import { firstPartyApp } from './firstPartyApps'
import { Icon } from './Icon'

/* "Add an app" (presence-server docs/device-apps-design.md, "The portal's Apps section"): the catalogue's apps this
   device may take and does not have (graphql's Device.availableApps) — remote.it's and its own account's —, each with
   its publisher, Runs as root or Runs restricted, and why it cannot be added here where it cannot: its administrator
   refuses it, or its stage has no release of it yet; and where its remote.it is too old to run it yet. Adding one turns it on, as its
   switch would — a root app only with the person's yes (components/AppRootConsent), so `add` is the Apps section's
   flip. Turning one on runs code on the device: Scripting as well as Manage. */
type Props = {
  available: AvailableApp[]
  canRun: boolean // Scripting and Manage on the device
  busy?: boolean // a change under way
  add: (app: DeviceApp, on: boolean) => void
}

// An app offered as the row it will be once added: off, with nothing installed.
export const offered = (app: AvailableApp): DeviceApp => ({
  id: app.id,
  name: app.name,
  publisher: app.publisher,
  root: app.root,
  on: false,
  channel: null,
  version: null,
  state: 'off',
  detail: null,
  serviceId: null,
  settings: [],
})

export const AddDeviceApp: React.FC<Props> = ({ available, canRun, busy, add }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  if (!available.length) return null

  return (
    <>
      <ListItem component="div" disableGutters dense>
        <Button size="small" onClick={() => setOpen(true)} data-add-app>
          {t('deviceApps.add', 'Add an app')}
        </Button>
      </ListItem>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" data-add-app-dialog>
        <DialogTitle>{t('deviceApps.addTitle', 'Add an app')}</DialogTitle>
        <DialogContent>
          <List dense>
            {available.map(app => {
              const why = whyNot(t, app)
              return (
                <ListItem key={app.id} disableGutters data-available-app={app.id} sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon sx={{ marginTop: 0.5 }}>
                    <Icon name={firstPartyApp(app.id)?.icon ?? 'cube'} size="md" fixedWidth />
                  </ListItemIcon>
                  <ListItemText
                    primary={app.name}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <>
                        <Typography variant="caption" component="div" color="textSecondary">
                          {[t('deviceApps.publisher', 'By {{publisher}}', { publisher: app.publisher }), app.version]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                        {app.description && (
                          <Typography variant="caption" component="div" color="textSecondary">
                            {app.description}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          component="div"
                          color={app.root ? 'warning.main' : 'textSecondary'}
                          data-available-runs
                        >
                          {app.root
                            ? t('deviceApps.runsAsRoot', 'Runs as root: full control of this device')
                            : t('deviceApps.runsRestricted', 'Runs restricted: an account of its own on this device')}
                        </Typography>
                        {app.needsNewer && !why && (
                          <Typography variant="caption" component="div" color="warning.main" data-available-newer>
                            {t(
                              'deviceApps.needsNewerAdd',
                              'Needs a newer remote.it on this device: added now, it runs once remote.it is upgraded'
                            )}
                          </Typography>
                        )}
                        {why && (
                          <Typography variant="caption" component="div" color="error" data-available-why>
                            {why}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!!why || !canRun || busy}
                    onClick={() => {
                      setOpen(false)
                      add(offered(app), true)
                    }}
                    data-available-add={app.id}
                  >
                    {t('deviceApps.addOne', 'Add')}
                  </Button>
                </ListItem>
              )
            })}
          </List>
          {!canRun && (
            <Typography variant="caption" color="textSecondary" data-add-app-scripting>
              {t('deviceApps.addNeedsScripting', 'Adding an app runs code on this device: it needs Scripting there.')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('deviceApps.addClose', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Why an app cannot be added to this device now; none when it can: its administrator's refusal, or no release on its
// stage. One its remote.it is too old for can be added — graphql gives it the release once remote.it is upgraded.
function whyNot(t: TFunction, app: AvailableApp): string | undefined {
  if (app.refused) return app.refused
  if (!app.version) return t('deviceApps.noRelease', 'No release of it here yet')
}
