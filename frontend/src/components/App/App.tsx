import React, { useEffect } from 'react'
import { LoadingPage } from '../../pages/LoadingPage'
import { Props } from '../../controllers/AppController/AppController'
import { DevicePageController } from '../../controllers/DevicePageController'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { Icon } from '../Icon'
import { ConnectionsPage } from '../ConnectionsPage'
import { Page } from '../../pages/Page'

const routes: Route = {
  connections: <ConnectionsPage />,
  devices: <DevicePageController />,
  settings: <SettingsPage />,
}

export function App({
  checkSignIn,
  page,
  setPage,
  checkSignInStarted = false,
  user,
}: Props) {
  useEffect(() => {
    checkSignIn()
  }, [])

  if (checkSignInStarted)
    return (
      <Page>
        <LoadingPage />
      </Page>
    )
  if (!user)
    return (
      <Page>
        <SignInPage />
      </Page>
    )

  return (
    <Page>
      {routes[page]}
      <BottomNavigation
        value={page}
        onChange={(_, newValue) => setPage(newValue)}
        showLabels
        className="fixed w-100 bt bc-secondary-lighter"
        style={{ bottom: 0 }}
      >
        <BottomNavigationAction
          label="Connections"
          value="connections"
          icon={<Icon name="scrubber" size="lg" />}
        />
        <BottomNavigationAction
          label="Devices"
          value="devices"
          icon={<Icon name="chart-network" size="lg" />}
        />
        <BottomNavigationAction
          label="Settings"
          value="settings"
          classes={{ selected: '' }}
          icon={<Icon name="cog" size="lg" />}
        />
      </BottomNavigation>
    </Page>
  )
}

/* signInStarted ? (
        <LoadingMessage message="Loading awesome!" />
      ) : (
        routeResult || <NotFoundPage />
      )*/
