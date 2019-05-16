import React, { useEffect, useState } from 'react'
import { Page } from '../../pages/Page'
import { LoadingPage } from '../../pages/LoadingPage'
import { Props } from '../../controllers/AppController/AppController'
import { DevicePageController } from '../../controllers/DevicePageController'
import { DebugPage } from '../../pages/DebugPage'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { Icon } from '../Icon'

const routes: Route = {
  devices: <DevicePageController />,
  debug: <DebugPage />,
  settings: <SettingsPage />,
}

export function App({
  checkSignIn,
  page,
  setPage,
  signInStarted = false,
  user,
}: Props) {
  useEffect(() => {
    checkSignIn()
  }, [])

  if (signInStarted) return <LoadingPage />
  if (!user) return <SignInPage />

  return (
    <>
      {routes[page]}
      <BottomNavigation
        value={page}
        onChange={(_, newValue) => setPage(newValue)}
        showLabels
        className="fixed w-100"
        style={{ bottom: 0 }}
      >
        <BottomNavigationAction
          label="Devices"
          value="devices"
          icon={<Icon name="robot" size="lg" className="pb-xs" />}
        />
        <BottomNavigationAction
          label="Debug"
          value="debug"
          icon={<Icon name="bug" size="lg" className="pb-xs" />}
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
