import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Divider, Box } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { makeStyles } from '@material-ui/core/styles'
import { SignInPage } from '../../pages/SignInPage'
import { FooterNav } from '../FooterNav'
import { Sidebar } from '../Sidebar'
import { Header } from '../Header'
import { Router } from '../Router'
import { Body } from '../Body'
import { Page } from '../../pages/Page'

export const App: React.FC = () => {
  const { authInitialized, backendAuthenticated, initialized, installed, signedOut, uninstalling } = useSelector(
    (state: ApplicationState) => ({
      authInitialized: state.auth.initialized,
      backendAuthenticated: state.auth.backendAuthenticated,
      initialized: state.devices.initialized,
      installed: state.binaries.installed,
      signedOut: state.auth.initialized && !state.auth.authenticated,
      uninstalling: state.ui.uninstalling,
    })
  )

  const css = useStyles()
  const [pageWidth, setPageWidth] = useState<number>(window.innerWidth)

  const updateWidth = () => setPageWidth(window.innerWidth)
  const largeWidth = pageWidth > 800

  useEffect(() => {
    window.addEventListener('resize', updateWidth)
    return function cleanup() {
      window.removeEventListener('resize', updateWidth)
    }
  })

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

  return (
    <Page>
      {largeWidth ? (
        <Box className={css.columns}>
          <Sidebar />
          <Box className={css.rows}>
            <Header />
            <Router /* panel={2}  */ />
          </Box>
        </Box>
      ) : (
        <>
          <Header menuOverlaps={true} />
          <Body>
            <Router />
          </Body>
          <FooterNav />
        </>
      )}
    </Page>
  )
}

const useStyles = makeStyles({
  main: {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  columns: {
    flexGrow: 1,
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'start',
    justifyContent: 'start',
    // '& > *:second-child:hover': {
    //   borderRight: `2px solid ${colors.primary}`,
    // },
  },
  rows: {
    flexGrow: 1,
    flexDirection: 'column',
    height: '100%',
  },
})
