import React from 'react'
import { useSelector } from 'react-redux'
import { useMediaQuery, makeStyles, Box } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { ApplicationState } from '../../store'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { SignInPage } from '../../pages/SignInPage'
import { SidebarMenu } from '../SidebarMenu'
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
  const layout: ILayout = {
    hideSidebar: useMediaQuery('(max-width:1150px)'),
    singlePanel: useMediaQuery('(max-width:750px)'),
  }
  const css = useStyles({ overlapHeader: layout.hideSidebar && isElectron() && isMac() })

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
      <Box className={css.columns}>
        {layout.hideSidebar ? <SidebarMenu /> : <Sidebar />}
        <Router layout={layout} />
      </Box>
    </Page>
  )
}

// neuter
const useStyles = makeStyles({
  columns: ({ overlapHeader }: any) => ({
    flexGrow: 1,
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'start',
    justifyContent: 'start',
    paddingTop: overlapHeader ? 30 : 0,
  }),
})
