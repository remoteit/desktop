import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useHistory } from 'react-router-dom'
import { Box, Button, List, Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { AvailableApp, SCREENVIEW } from '../services/graphQLDeviceApps'
import { CatalogApp, graphQLAppCatalog } from '../services/graphQLAppCatalog'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useAppSwitch } from '../components/AppRootConsent'
import { AppCatalogRow } from '../components/AppCatalogRow'
import { Container } from '../components/Container'
import { LoadingMessage } from '../components/LoadingMessage'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { adminControlLine, offered } from '../helpers/appsHelper'

/* The catalogue for this device (presence-server docs/device-apps-design.md, "The Apps pages",
   /devices/:deviceID/apps/add): the apps it may take and does not have (graphql's Device.availableApps) — remote.it's
   and its own account's —, each with its publisher, Runs as root or Restricted and what else it asks of remote.it (its
   capabilities, as its account's catalogue gives them for the release its channel gives), its description, and why it
   cannot be added here where it cannot: its administrator refuses it, or its stage has no release of it yet; and where
   its remote.it is too old to run it yet. A row opens the app in the catalogue; Add adds it here and enabled — a root
   app only with the person's yes (components/AppRootConsent), which names its capabilities too —, then opens it on
   this device. Adding runs code on the device: Scripting as well as Manage. */
export const DeviceAppCatalogPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { device } = useContext(DeviceContext)
  const deviceApps = useDeviceApps(device?.id)
  const { apps, available, switching } = deviceApps
  const [refusal, setRefusal] = useState<string>()
  const [catalog, setCatalog] = useState<CatalogApp[]>()
  const { flip, consent } = useAppSwitch(
    deviceApps,
    reason => setRefusal(reason || t('apps.notAdded', 'The app was not added.')),
    app => device && history.push(`/devices/${device.id}/apps/${app.id}`)
  )

  const accountId = device?.accountId
  useEffect(() => {
    let current = true
    setCatalog(undefined)
    graphQLAppCatalog(accountId).then(answer => current && setCatalog(Array.isArray(answer) ? answer : []))
    return () => {
      current = false
    }
  }, [accountId])

  if (!device) return <LoadingMessage />
  const canRun = !!device.permissions?.includes('MANAGE') && !!device.permissions?.includes('SCRIPTING')
  // ScreenView's old install not converted is said on the device's Apps section, not offered here.
  const offers = (available ?? [])
    .filter(app => !(app.id === SCREENVIEW && app.oldInstall && app.conversion === 'refused'))
    .map(app => described(app, catalog))

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Gutters bottom={null}>
            <Link to={`/devices/${device.id}/edit`}>
              <Icon name="angle-left" size="sm" inlineLeft />
              {device.name}
            </Link>
          </Gutters>
          <Typography variant="h1">
            <Title>{t('apps.addToDevice', 'Add an app to {{device}}', { device: device.name })}</Title>
          </Typography>
        </>
      }
    >
      {refusal && (
        <Gutters>
          <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
            {refusal}
          </Notice>
        </Gutters>
      )}
      {apps === undefined || (apps && (available === undefined || catalog === undefined)) ? (
        <LoadingMessage />
      ) : !offers.length ? (
        <Gutters>
          <Typography variant="body2" color="textSecondary" data-catalog-empty>
            {apps === null
              ? t('apps.unserved', 'This server does not have apps.')
              : t('apps.nothingToAdd', 'There is no app this device does not have already.')}
          </Typography>
        </Gutters>
      ) : (
        <List data-device-catalog>
          {offers.map(app => {
            const why = whyNot(t, app)
            return (
              <AppCatalogRow
                key={app.id}
                id={app.id}
                name={app.name}
                publisher={app.publisher}
                verifiedDomain={app.publisherVerifiedDomain}
                root={app.root}
                capabilities={app.capabilities}
                protocol={app.protocol}
                description={app.description}
                aside={app.version}
                onOpen={() => history.push(`/apps/${app.id}`)}
                notes={
                  <>
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
                action={
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!!why || !canRun || switching !== undefined}
                    onClick={() => flip(offered(app), true)}
                    data-available-add={app.id}
                  >
                    {switching === app.id ? t('deviceApps.switching', 'Waiting for the device…') : t('apps.add', 'Add')}
                  </Button>
                }
              />
            )
          })}
        </List>
      )}
      {!canRun && (
        <Gutters>
          <Box data-add-app-scripting>
            <Typography variant="caption" color="textSecondary">
              {t('deviceApps.addNeedsScripting', 'Adding an app runs code on this device: it needs Scripting there.')}
            </Typography>
          </Box>
        </Gutters>
      )}
      {consent}
    </Container>
  )
}

// What it asks of remote.it and how its service opens, from its catalogue entry: where there is none, nothing said.
function described(app: AvailableApp, catalog: CatalogApp[] = []): AvailableApp {
  const entry = catalog.find(c => c.id === app.id)
  return entry ? { ...app, capabilities: entry.capabilities, protocol: entry.protocol } : app
}

// Why an app cannot be added to this device now; none when it can: its administrator's control of it (local or off,
// in this portal's words), the rest of what graphql refuses, or no release on its stage. One its remote.it is too old
// for can be added — graphql gives it the release once remote.it is upgraded.
function whyNot(t: TFunction, app: AvailableApp): string | undefined {
  const admin = adminControlLine(t, app)
  if (admin) return admin
  if (app.refused) return app.refused
  if (!app.version) return t('deviceApps.noRelease', 'No release of it here yet')
}
