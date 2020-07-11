import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { useHistory, useLocation } from 'react-router-dom'
import { REGEX_FIRST_PATH, HEARTBEAT_INTERVAL } from '../../shared/constants'
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { useInterval } from '../../hooks/useInterval'
import { makeStyles } from '@material-ui/core/styles'
import { SignInPage } from '../../pages/SignInPage'
import { Header } from '../Header/Header'
import { Router } from '../Router'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { Page } from '../../pages/Page'
import { emit } from '../../services/Controller'
import styles from '../../styling'

export const App: React.FC = () => {
  const { installed, signedOut, uninstalling } = useSelector((state: ApplicationState) => ({
    installed: state.binaries.installed,
    signedOut: (!state.auth.user || !state.auth.authenticated) && !state.auth.loadingInitialState,
    uninstalling: state.ui.uninstalling,
  }))

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

  useInterval(() => {
    document.hasFocus() && emit('heartbeat')
  }, HEARTBEAT_INTERVAL)

  useEffect(() => {
    if (navigation[menu] !== location.pathname) {
      setNavigation({ ...navigation, [menu]: location.pathname })
    }
  }, [navigation, location, menu])

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
        <Router />
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
