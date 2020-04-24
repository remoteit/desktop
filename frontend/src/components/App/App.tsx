import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { isElectron } from '../../services/Browser'
import { Switch, Route, Redirect, useHistory, useLocation } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { LoadingMessage } from '../LoadingMessage'
import { makeStyles } from '@material-ui/styles'
import { Header } from '../Header/Header'
import { Page } from '../../pages/Page'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { SetupServices } from '../../pages/SetupServices'
import { SetupDevice } from '../../pages/SetupDevice'
import { SetupWaiting } from '../../pages/SetupWaiting'
import { SetupSuccess } from '../../pages/SetupSuccess'
import { SetupView } from '../../pages/SetupView'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { ServicePage } from '../../pages/ServicePage'
import { LanSharePage } from '../../pages/LanSharePage'
import { LogPage } from '../../pages/LogPage'
import { InstallationNotice } from '../InstallationNotice'
import { REGEX_FIRST_PATH } from '../../constants'
import styles from '../../styling'

export const App = () => {
  const { installed, signedOut, device, targets, dataReady, uninstalling, os } = useSelector(
    (state: ApplicationState) => ({
      installed:
        state.binaries.connectdInstalled &&
        state.binaries.muxerInstalled &&
        state.binaries.demuxerInstalled &&
        state.binaries.remoteitInstalled,
      signedOut: (!state.auth.user || !state.auth.authenticated) && !state.auth.loadingInitialState,
      device: state.backend.device,
      targets: state.backend.targets,
      dataReady: state.backend.dataReady,
      uninstalling: state.ui.uninstalling,
      os: state.backend.environment.os,
    })
  )

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
    if (navigation[menu] !== location.pathname) {
      setNavigation({ ...navigation, [menu]: location.pathname })
    }
  }, [navigation, location, menu])

  useEffect(() => {
    if (dataReady && !device.name && !isElectron()) history.push('/settings/setupDevice')
  }, [history, device, dataReady, os])

  if (uninstalling)
    return (
      <Page>
        <Header />
        <LoadingMessage message="Please wait, uninstalling..." />
      </Page>
    )

  if (signedOut)
    return (
      <Page>
        <Header />
        <SignInPage />
      </Page>
    )

  if (!installed)
    return (
      <Page>
        <Header />
        <InstallationNotice />
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
          <Route path="/connections/:serviceID/log">
            <LogPage />
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
          <Route path="/devices/:deviceID/:serviceID/log">
            <LogPage />
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
          <Route path="/settings/setupServices/network">
            <NetworkPage />
          </Route>
          <Route path="/settings/setupServices">
            <SetupServices os={os} device={device} targets={targets} />
          </Route>
          <Route path="/settings/setupSuccess">
            <SetupSuccess os={os} device={device} />
          </Route>
          <Route path="/settings/setupWaiting">
            <SetupWaiting os={os} device={device} />
          </Route>
          <Route path="/settings/setupDevice">
            <SetupDevice os={os} device={device} />
          </Route>
          <Route path="/settings/setupView">
            <SetupView device={device} targets={targets} />
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
        <BottomNavigationAction label="Devices" value="/devices" icon={<Icon name="chart-network" size="lg" />} />
        <BottomNavigationAction label="Settings" value="/settings" icon={<Icon name="cog" size="lg" />} />
      </BottomNavigation>
    </Page>
  )
}

const useStyles = makeStyles({
  footer: {
    borderTop: `1px solid ${styles.colors.grayLight}`,
    minHeight: 62,
    justifyContent: 'space-evenly',
    '& .MuiButtonBase-root': { maxWidth: '18%' },
  },
})
