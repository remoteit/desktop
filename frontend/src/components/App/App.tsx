import React, { useEffect } from 'react'
import styles from '../../styling'
import { LoadingPage } from '../../pages/LoadingPage'
import { SignInPage } from '../../pages/SignInPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { BottomNavigation, BottomNavigationAction, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import { ConnectionsPage } from '../ConnectionsPage'
import { Page } from '../../pages/Page'
import { SetupPage } from '../../pages/SetupPage'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { InstallationNotice } from '../InstallationNotice'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'

const routes: Route = {
  connections: <ConnectionsPage />,
  devices: <DevicesPage />,
  setup: <SetupPage />,
  settings: <SettingsPage />,
  network: <NetworkPage />,
}

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
        <SignInPage />
      </Page>
    )

  return (
    <Page>
      <div className={css.body}>{routes[page]}</div>
      <BottomNavigation className={css.footer} value={page} onChange={(_, newValue) => setPage(newValue)} showLabels>
        <BottomNavigationAction label="Connections" value="connections" icon={<Icon name="scrubber" size="lg" />} />
        <BottomNavigationAction label="Devices" value="devices" icon={<Icon name="chart-network" size="lg" />} />
        <BottomNavigationAction label="Setup" value="setup" icon={<Icon name="hdd" size="lg" />} />
        <BottomNavigationAction label="Network" value="network" icon={<Icon name="network-wired" size="lg" />} />
        <BottomNavigationAction label="Settings" value="settings" icon={<Icon name="cog" size="lg" />} />
      </BottomNavigation>
    </Page>
  )
})

const useStyles = makeStyles({
  body: {
    overflowY: 'auto',
    flexGrow: 1,
    position: 'relative',
    '-webkit-overflow-scrolling': 'touch',
    '&::-webkit-scrollbar': { display: 'none' },
    '& section': {
      display: 'flex',
      justifyContent: 'space-between',
      padding: `${styles.spacing.xl}px 0`,
      borderTop: `1px solid ${styles.colors.grayLighter}`,
    },
    '& h2': {
      textTransform: 'uppercase',
      fontSize: 12,
      letterSpacing: '0.6em',
      fontWeight: 500,
      color: styles.colors.gray,
      marginTop: styles.spacing.lg,
    },
  },
  footer: {
    borderTop: `1px solid ${styles.colors.grayLighter}`,
    minHeight: 62,
    '& .MuiButtonBase-root': { maxWidth: '18%' },
  },
})
