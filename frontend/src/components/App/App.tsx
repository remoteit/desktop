import React, { useEffect, useState } from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Switch, Route, Redirect, useHistory, useLocation } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Header } from '../jump/Header'
import { Page } from '../../pages/Page'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { LoadingPage } from '../../pages/LoadingPage'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { SetupPage } from '../../pages/SetupPage'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { ServicePage } from '../../pages/ServicePage'
import { LanSharePage } from '../../pages/LanSharePage'
import { InstallationNotice } from '../InstallationNotice'
import { REGEX_FIRST_PATH } from '../../constants'
import styles from '../../styling'

const mapState = (state: ApplicationState) => ({
  user: state.auth.user,
  checkSignInStarted: state.auth.checkSignInStarted,
  installed:
    state.binaries.connectdInstalled &&
    state.binaries.muxerInstalled &&
    state.binaries.demuxerInstalled &&
    state.binaries.remoteitInstalled,
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
  const [navigation, setNavigation] = useState<{ [menu: string]: string }>({})

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const menu = match ? match[0] : '/'

  const changeNavigation = (_: any, selected: string) => {
    const stored = navigation[selected]
    if (!stored || stored === location.pathname) history.push(selected)
    else history.push(stored)
  }

  useEffect(() => {
    checkSignIn()
    BackendAdaptor.emit('init')
  }, [checkSignIn])

  useEffect(() => {
    if (navigation[menu] !== location.pathname) {
      setNavigation({ ...navigation, [menu]: location.pathname })
    }
  }, [navigation, location, menu])

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
      <Body>
        <Switch>
          <Route path="/connections/:serviceID/lan">
            <LanSharePage />
          </Route>
          <Route path="/connections/:serviceID">
            <ServicePage />
          </Route>
          <Route path="/connections">
            <ConnectionsPage />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/lan">
            <LanSharePage />
          </Route>
          <Route path="/devices/:deviceID/:serviceID">
            <ServicePage />
          </Route>
          <Route path="/devices/:deviceID">
            <ServicesPage />
          </Route>
          <Route path="/devices">
            <DevicesPage />
          </Route>
          <Route path="/setup">
            <SetupPage />
          </Route>
          <Route path="/network">
            <NetworkPage />
          </Route>
          <Route path="/settings">
            <SettingsPage />
          </Route>
          <Route exact path="/">
            <Redirect to="/devices" />
          </Route>
        </Switch>
      </Body>
      <BottomNavigation className={css.footer} value={menu} onChange={changeNavigation} showLabels>
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
    borderTop: `1px solid ${styles.colors.grayLight}`,
    minHeight: 62,
    '& .MuiButtonBase-root': { maxWidth: '18%' },
  },
})
