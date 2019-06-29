import React, { useEffect } from 'react'
import { LoadingPage } from '../../pages/LoadingPage'
import { Props } from '../../controllers/AppController/AppController'
import { DevicePageController } from '../../controllers/DevicePageController'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { Icon } from '../Icon'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ConnectionsPage } from '../ConnectionsPage'
import classnames from 'classnames'
import styles from './App.module.css'

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

  if (checkSignInStarted) return <LoadingPage />
  if (!user) return <SignInPage />

  return (
    <>
      <div className={classnames(styles.titleBar, 'dragable')}>remote.it</div>
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
          icon={
            <ConnectionStateIcon
              state="connected"
              size="lg"
              className="pb-xs"
            />
          }
        />
        <BottomNavigationAction
          label="Devices"
          value="devices"
          icon={<Icon name="chart-network" size="lg" className="pb-xs" />}
        />
        <BottomNavigationAction
          label="Settings"
          value="settings"
          icon={<Icon name="cog" size="lg" className="pb-xs" />}
        />
      </BottomNavigation>
    </>
  )
}

/* signInStarted ? (
        <LoadingMessage message="Loading awesome!" />
      ) : (
        routeResult || <NotFoundPage />
      )*/
