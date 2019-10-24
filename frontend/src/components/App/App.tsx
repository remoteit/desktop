import React, { useEffect } from 'react'
import { Switch, Route, Redirect, useHistory, useLocation } from 'react-router-dom'
import styles from '../../styling'
import { connect } from 'react-redux'
import { makeStyles } from '@material-ui/styles'
import { Page } from '../../pages/Page'
import { Header } from '../jump/Header'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { LoadingPage } from '../../pages/LoadingPage'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { SetupPage } from '../../pages/SetupPage'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { InstallationNotice } from '../InstallationNotice'
import { ApplicationState } from '../../store'
import BackendAdaptor from '../../services/BackendAdapter'

const mapState = (state: ApplicationState) => ({
  checkSignInStarted: state.auth.checkSignInStarted,
  user: state.auth.user,
  installed: state.binaries.connectdInstalled && state.binaries.muxerInstalled && state.binaries.demuxerInstalled,
})
const mapDispatch = (dispatch: any) => ({
  checkSignIn: dispatch.auth.checkSignIn,
})

export type AppProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const App = connect(
  mapState,
  mapDispatch
)(({ checkSignIn, installed, checkSignInStarted, user }: AppProps) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()

  const match = location.pathname.match(/^\/(\w+)/g)
  const menu = match ? match[0] : '/'

  console.log('location', location)

  useEffect(() => {
    checkSignIn()
    BackendAdaptor.emit('jump/init')
  }, [checkSignIn])

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
        <Header />
        <SignInPage />
      </Page>
    )

  return (
    <Page>
      <Header />
      <Switch>
        <Route path="/connections">
          <Body>
            <ConnectionsPage />
          </Body>
        </Route>
        <Route path="/devices">
          <Body>
            <Switch>
              <Route path="/devices/:id">
                <ServicesPage />
              </Route>
              <Route>
                <DevicesPage />
              </Route>
            </Switch>
          </Body>
        </Route>
        <Route path="/setup">
          <Body>
            <SetupPage />
          </Body>
        </Route>
        <Route path="/network">
          <Body>
            <NetworkPage />
          </Body>
        </Route>
        <Route path="/settings">
          <Body>
            <SettingsPage />
          </Body>
        </Route>
        <Route exact path="/">
          <Redirect to="/devices" />
        </Route>
      </Switch>
      <BottomNavigation
        className={css.footer}
        value={menu}
        onChange={(_, newValue) => history.push(newValue)}
        showLabels
      >
        <BottomNavigationAction label="Connections" value="/connections" icon={<Icon name="scrubber" size="lg" />} />
        <BottomNavigationAction label="Remote" value="/devices" icon={<Icon name="chart-network" size="lg" />} />
        <BottomNavigationAction label="Local" value="/setup" icon={<Icon name="hdd" size="lg" />} />
        <BottomNavigationAction label="Network" value="/network" icon={<Icon name="network-wired" size="lg" />} />
        <BottomNavigationAction label="Settings" value="/settings" icon={<Icon name="cog" size="lg" />} />
      </BottomNavigation>
    </Page>
  )
})

const useStyles = makeStyles({
  footer: {
    borderTop: `1px solid ${styles.colors.grayLighter}`,
    minHeight: 62,
    '& .MuiButtonBase-root': { maxWidth: '18%' },
  },
})
