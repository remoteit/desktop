import React, { useEffect } from 'react'
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
import { InstallationNotice } from '../InstallationNotice'
import { ApplicationState } from '../../store'

const mapState = (state: ApplicationState) => ({
  checkSignInStarted: state.auth.checkSignInStarted,
  user: state.auth.user,
  page: state.navigation.page,
  installed: state.binaries.connectdInstalled && state.binaries.muxerInstalled && state.binaries.demuxerInstalled,
})
const mapDispatch = (dispatch: any) => ({
  checkSignIn: dispatch.auth.checkSignIn,
  setPage: dispatch.navigation.setPage,
})

export type AppProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const App = connect(
  mapState,
  mapDispatch
)(({ checkSignIn, installed, page, setPage, checkSignInStarted = false, user }: AppProps) => {
  const css = useStyles()

  useEffect(() => {
    checkSignIn()
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
      <Body show={page === 'connections'}>
        <ConnectionsPage />
      </Body>
      <Body show={page === 'devices'}>
        <DevicesPage />
      </Body>
      <Body show={page === 'setup'} inset>
        <SetupPage />
      </Body>
      <Body show={page === 'network'} inset>
        <NetworkPage />
      </Body>
      <Body show={page === 'settings'} inset>
        <SettingsPage />
      </Body>
      <BottomNavigation className={css.footer} value={page} onChange={(_, newValue) => setPage(newValue)} showLabels>
        <BottomNavigationAction label="Connections" value="connections" icon={<Icon name="scrubber" size="lg" />} />
        <BottomNavigationAction label="Remote" value="devices" icon={<Icon name="chart-network" size="lg" />} />
        <BottomNavigationAction label="Local" value="setup" icon={<Icon name="hdd" size="lg" />} />
        <BottomNavigationAction label="Network" value="network" icon={<Icon name="network-wired" size="lg" />} />
        <BottomNavigationAction label="Settings" value="settings" icon={<Icon name="cog" size="lg" />} />
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
