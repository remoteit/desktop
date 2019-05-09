import React, { useEffect, useState } from 'react'
// import { useRoutes } from 'hookrouter'
// import { NotFoundPage } from '../../pages/NotFoundPage'
// import { routes } from '../../routes'
// import { AppPageRouter } from '../AppPageRouter'
import { Page } from '../../pages/Page'
import { LoadingPage } from '../../pages/LoadingPage'
import { Props } from '../../controllers/AppController/AppController'
import { DevicePageController } from '../../controllers/DevicePageController'
import { DebugPage } from '../../pages/DebugPage'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { Icon } from '../Icon'

type Page = 'devices' | 'debug' | 'settings' // | 'signin' | 'config'

type Route = { [key in Page]: React.ReactNode }

const routes: Route = {
  devices: <DevicePageController />,
  debug: <DebugPage />,
  settings: <SettingsPage />,
  // signin: <SignInPage />,
  // config: <SplashScreenPage />,
}

export function App({ checkSignIn, signInStarted = false, user }: Props) {
  // const routeResult = useRoutes(routes)
  const [page, setPage] = useState<Page>('devices' as Page)

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
