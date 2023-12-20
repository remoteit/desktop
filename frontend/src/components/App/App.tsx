import React, { useEffect } from 'react'
import browser from '../../services/Browser'
import useSafeArea from '../../hooks/useSafeArea'
import useCapacitor from '../../hooks/useCapacitor'
import { useSelector, useDispatch } from 'react-redux'
import {
  HIDE_SIDEBAR_WIDTH,
  HIDE_TWO_PANEL_WIDTH,
  SIDEBAR_WIDTH,
  MOBILE_WIDTH,
  ORGANIZATION_BAR_WIDTH,
} from '../../constants'
import { useMediaQuery, Box } from '@mui/material'
import { ApplicationState, Dispatch } from '../../store'
import { InstallationNotice } from '../InstallationNotice'
import { LoadingMessage } from '../LoadingMessage'
import { SignInPage } from '../../pages/SignInPage'
import { SidebarMenu } from '../SidebarMenu'
import { BottomMenu } from '../BottomMenu'
import { Sidebar } from '../Sidebar'
import { Router } from '../../routers/Router'
import { Page } from '../../pages/Page'

export const App: React.FC = () => {
  const hideSplashScreen = useCapacitor()
  const { authInitialized, installed, signedOut, waitMessage, showOrgs } = useSelector((state: ApplicationState) => ({
    authInitialized: state.auth.initialized,
    installed: state.binaries.installed,
    signedOut: !state.auth.initialized || !state.auth.authenticated,
    waitMessage: state.ui.waitMessage,
    showOrgs: !!state.accounts.membership.length,
  }))
  const { insets } = useSafeArea()
  const dispatch = useDispatch<Dispatch>()
  const hideSidebar = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const singlePanel = useMediaQuery(`(max-width:${HIDE_TWO_PANEL_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const overlapHeader = hideSidebar && browser.isElectron && browser.isMac
  const sidePanelWidth = hideSidebar ? 0 : SIDEBAR_WIDTH + (showOrgs ? ORGANIZATION_BAR_WIDTH : 0)
  const layout: ILayout = {
    insets,
    mobile,
    showOrgs,
    hideSidebar,
    singlePanel,
    sidePanelWidth,
  }

  useEffect(() => {
    hideSplashScreen()
  }, [])

  useEffect(() => {
    dispatch.ui.set({ layout })
  }, [hideSidebar, singlePanel, showOrgs, insets, mobile, sidePanelWidth])

  if (waitMessage)
    return (
      <Page>
        <LoadingMessage message={`Please wait, ${waitMessage}...`} />
      </Page>
    )

  if (!authInitialized)
    return (
      <Page noInsets>
        <LoadingMessage logo invert />
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
      <Box
        sx={{
          flexGrow: 1,
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'start',
          justifyContent: 'start',
          paddingTop: overlapHeader ? 2 : 0,
        }}
      >
        {hideSidebar ? <SidebarMenu /> : <Sidebar layout={layout} />}
        <Router layout={layout} />
      </Box>
      {mobile && <BottomMenu />}
    </Page>
  )
}
