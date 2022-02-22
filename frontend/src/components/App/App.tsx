import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { makeStyles, Box } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { ApplicationState } from '../../store'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { SignInPage } from '../../pages/SignInPage'
import { FooterNav } from '../FooterNav'
import { Sidebar } from '../Sidebar'
import { Router } from '../../routers/Router'
import { Page } from '../../pages/Page'

export const App: React.FC = () => {
  const { authInitialized, installed, signedOut, uninstalling } = useSelector((state: ApplicationState) => ({
    authInitialized: state.auth.initialized,
    installed: state.binaries.installed,
    signedOut: state.auth.initialized && !state.auth.authenticated,
    uninstalling: state.ui.uninstalling,
  }))
  const [pageWidth, setPageWidth] = useState<number>(window.innerWidth)
  const updateWidth = () => setPageWidth(window.innerWidth)
  const singlePanel = pageWidth < 1000
  const css = useStyles(singlePanel && isElectron() && isMac())()

  useEffect(() => {
    window.addEventListener('resize', updateWidth)
    return function cleanup() {
      window.removeEventListener('resize', updateWidth)
    }
  })

  if (uninstalling)
    return (
      <Page>
        <LoadingMessage message="Please wait, uninstalling..." />
      </Page>
    )

  if (!authInitialized)
    return (
      <Page>
        <LoadingMessage message="Loading..." logo />
      </Page>
    )

  if (signedOut)
    return (
      <Page>
        <SignInPage />
      </Page>
    )

  if (!installed)
    return (
      <Page>
        <InstallationNotice />
      </Page>
    )

  return (
    <Page>
      {singlePanel ? (
        <>
          <Box className={css.columns}>
            <Router singlePanel />
          </Box>
          <FooterNav />
        </>
      ) : (
        <Box className={css.columns}>
          <Sidebar />
          <Router />
        </Box>
      )}
    </Page>
  )
}
// neuter
const useStyles = overlapHeader =>
  makeStyles({
    columns: {
      flexGrow: 1,
      position: 'relative',
      display: 'flex',
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'start',
      justifyContent: 'start',
      paddingTop: overlapHeader ? 30 : 0,
    },
  })
