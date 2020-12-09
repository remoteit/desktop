import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { useHistory, useLocation } from 'react-router-dom'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { BottomNavigation, BottomNavigationAction, Badge } from '@material-ui/core'
import { selectLicenseIndicator } from '../../models/licensing'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { makeStyles } from '@material-ui/core/styles'
import { SignInPage } from '../../pages/SignInPage'
import { isRemoteUI } from '../../helpers/uiHelper'
import { Header } from '../Header/Header'
import { Router } from '../Router'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { Page } from '../../pages/Page'
import styles from '../../styling'

export const App: React.FC = () => {
  const {
    showReports,
    authInitialized,
    backendAuthenticated,
    initialized,
    installed,
    signedOut,
    uninstalling,
    remoteUI,
    noticeCount,
  } = useSelector((state: ApplicationState) => ({
    showReports: state.auth.user?.email.includes('@remote.it'),
    authInitialized: state.auth.initialized,
    backendAuthenticated: state.auth.backendAuthenticated,
    initialized: state.devices.initialized,
    installed: state.binaries.installed,
    signedOut: state.auth.initialized && !state.auth.authenticated,
    uninstalling: state.ui.uninstalling,
    remoteUI: isRemoteUI(state),
    noticeCount: selectLicenseIndicator(state),
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

  if (!authInitialized)
    return (
      <Page>
        <Header />
        <LoadingMessage message="Checking Authentication..." logo />
      </Page>
    )

  if (signedOut)
    return (
      <Page>
        <Header />
        <SignInPage />
      </Page>
    )

  if (!backendAuthenticated)
    return (
      <Page>
        <Header />
        <LoadingMessage message="Signing in..." logo />
      </Page>
    )

  if (!installed)
    return (
      <Page>
        <Header />
        <InstallationNotice />
      </Page>
    )

  if (!initialized)
    return (
      <Page>
        <Header />
        <LoadingMessage message="Starting up..." logo />
      </Page>
    )

  const menuItems = [
    { label: 'This Device', path: '/configure', icon: 'hdd', show: remoteUI },
    { label: 'Connections', path: '/connections', icon: 'scrubber', show: !remoteUI },
    { label: 'Devices', path: '/devices', icon: 'chart-network', show: !remoteUI },
    { label: 'Settings', path: '/settings', icon: 'cog', badge: noticeCount, show: true },
    { label: 'Analytics', path: '/reports', icon: 'chart-line', show: showReports },
  ]

  return (
    <Page>
      <Header />
      <Body>
        <Router />
      </Body>
      <BottomNavigation className={css.footer} value={menu} onChange={changeNavigation} showLabels>
        {menuItems.reduce((items: JSX.Element[], m) => {
          if (m.show)
            items.push(
              <BottomNavigationAction
                key={m.path}
                label={m.label}
                value={m.path}
                icon={
                  m.badge ? (
                    <Badge variant="dot" color="primary">
                      <Icon name={m.icon} size="lg" />
                    </Badge>
                  ) : (
                    <Icon name={m.icon} size="lg" />
                  )
                }
              />
            )
          return items
        }, [])}
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
