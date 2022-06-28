import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { HIDE_SIDEBAR_WIDTH, HIDE_TWO_PANEL_WIDTH, SIDEBAR_WIDTH, ORGANIZATION_BAR_WIDTH } from '../../shared/constants'
import { makeStyles } from '@mui/styles'
import { useMediaQuery, Box } from '@mui/material'
import { ApplicationState, Dispatch } from '../../store'
import { isElectron, isMac } from '../../services/Browser'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { SignInPage } from '../../pages/SignInPage'
import { SidebarMenu } from '../SidebarMenu'
import { Sidebar } from '../Sidebar'
import { Router } from '../../routers/Router'
import { Page } from '../../pages/Page'

export const App: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { authInitialized, installed, signedOut, uninstalling, showOrgs } = useSelector((state: ApplicationState) => ({
    authInitialized: state.auth.initialized,
    installed: state.binaries.installed,
    signedOut: state.auth.initialized && !state.auth.authenticated,
    uninstalling: state.ui.uninstalling,
    showOrgs: !!state.accounts.membership.length,
  }))
  const hideSidebar = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const singlePanel = useMediaQuery(`(max-width:${HIDE_TWO_PANEL_WIDTH}px)`)
  const layout = {
    showOrgs,
    hideSidebar,
    singlePanel,
    sidePanelWidth: hideSidebar ? 0 : SIDEBAR_WIDTH + (showOrgs ? ORGANIZATION_BAR_WIDTH : 0),
  }

  useEffect(() => {
    dispatch.ui.set({ layout })
  }, [hideSidebar, singlePanel, showOrgs])

  const css = useStyles({ overlapHeader: hideSidebar && isElectron() && isMac() })

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
        {hideSidebar ? <SidebarMenu /> : <Sidebar layout={layout} />}
        <Router />
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
