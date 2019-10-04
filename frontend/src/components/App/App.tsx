import React, { useEffect } from 'react'
import { LoadingPage } from '../../pages/LoadingPage'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { Icon } from '../Icon'
import { ConnectionsPage } from '../ConnectionsPage'
import { Page } from '../../pages/Page'
import { DevicesPage } from '../DevicesPage'
import { InstallationNotice } from '../InstallationNotice'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'

const routes: Route = {
  connections: <ConnectionsPage />,
  devices: <DevicesPage />,
  settings: <SettingsPage />,
}

export type AppProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  checkSignInStarted: state.auth.checkSignInStarted,
  user: state.auth.user,
  page: state.navigation.page,
  installed:
    state.binaries.connectdInstalled &&
    state.binaries.muxerInstalled &&
    state.binaries.demuxerInstalled,
})
const mapDispatch = (dispatch: any) => ({
  checkSignIn: dispatch.auth.checkSignIn,
  setPage: dispatch.navigation.setPage,
})

export const App = connect(
  mapState,
  mapDispatch
)(
  ({
    checkSignIn,
    installed,
    page,
    setPage,
    checkSignInStarted = false,
    user,
  }: AppProps) => {
    useEffect(() => {
      checkSignIn()
    }, [])

    if (checkSignInStarted)
      return (
        <Page>
          <LoadingPage />
        </Page>
      )

    if (!installed)
      return (
        <Page>
          <InstallationNotice />
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
        <div
          className="w-100 h-100 df ai-stretch"
          style={{ flexFlow: 'column' }}
        >
          <div className="df ai-center jc-center py-xs center dragable primary txt-md bg-gray-lighter">
            remote.it
          </div>
          <div className="of-auto fg-1 relative">{routes[page]}</div>
          <BottomNavigation
            value={page}
            onChange={(_, newValue) => setPage(newValue)}
            showLabels
            className="bt bc-secondary-lighter"
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
        </div>
      </Page>
    )
  }

  /* signInStarted ? (
        <LoadingMessage message="Loading awesome!" />
      ) : (
        routeResult || <NotFoundPage />
      )*/
)
