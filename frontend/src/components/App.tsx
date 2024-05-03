import React, { useEffect } from 'react'
import browser from '../services/Browser'
import useSafeArea from '../hooks/useSafeArea'
import useCapacitor from '../hooks/useCapacitor'
import { persistor } from '../store'
import { useLocation } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { selectResellerRef } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import {
  HIDE_SIDEBAR_WIDTH,
  HIDE_TWO_PANEL_WIDTH,
  SIDEBAR_WIDTH,
  MOBILE_WIDTH,
  ORGANIZATION_BAR_WIDTH,
  REGEX_FIRST_PATH,
} from '../constants'
import { State, Dispatch } from '../store'
import { useMediaQuery, Box } from '@mui/material'
import { InstallationNotice } from './InstallationNotice'
import { LoadingMessage } from './LoadingMessage'
import { ResellerLogo } from './ResellerLogo'
import { SidebarMenu } from './SidebarMenu'
import { SignInPage } from '../pages/SignInPage'
import { BottomMenu } from './BottomMenu'
import { Sidebar } from './Sidebar'
import { Router } from '../routers/Router'
import { Page } from '../pages/Page'
import { Logo } from './Logo'

export const App: React.FC = () => {
  const { insets } = useSafeArea()
  const location = useLocation()
  const hideSplashScreen = useCapacitor()
  const authInitialized = useSelector((state: State) => state.auth.initialized)
  const installed = useSelector((state: State) => state.binaries.installed)
  const signedOut = useSelector((state: State) => !state.auth.initialized || !state.auth.authenticated)
  const waitMessage = useSelector((state: State) => state.ui.waitMessage)
  const showOrgs = useSelector((state: State) => !!state.accounts.membership.length)
  const reseller = useSelector(selectResellerRef)
  const dispatch = useDispatch<Dispatch>()
  const hideSidebar = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const singlePanel = useMediaQuery(`(max-width:${HIDE_TWO_PANEL_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const overlapHeader = hideSidebar && browser.isElectron && browser.isMac
  const sidePanelWidth = hideSidebar ? 0 : SIDEBAR_WIDTH + (showOrgs ? ORGANIZATION_BAR_WIDTH : 0)
  const isRootMenu = location.pathname.match(REGEX_FIRST_PATH)?.[0] === location.pathname
  const showBottomMenu = (mobile || browser.isMobile) && isRootMenu && hideSidebar

  const layout: ILayout = {
    insets,
    mobile,
    showOrgs,
    hideSidebar,
    showBottomMenu,
    singlePanel,
    sidePanelWidth,
  }

  useEffect(() => {
    hideSplashScreen()
  }, [])

  useEffect(() => {
    dispatch.ui.set({ layout })
  }, [insets, mobile, showOrgs, hideSidebar, showBottomMenu, singlePanel, sidePanelWidth])

  if (waitMessage)
    return (
      <Page>
        <LoadingMessage message={`Please wait, ${waitMessage}...`} />
      </Page>
    )

  if (!authInitialized)
    return (
      <Page>
        {reseller ? (
          <LoadingMessage logo={<ResellerLogo reseller={reseller} />} spinner />
        ) : (
          <LoadingMessage logo={<Logo color="alwaysWhite" />} invert spinner />
        )}
      </Page>
    )

  if (signedOut)
    return (
      <Page>
        <SignInPage layout={layout} />
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
      <PersistGate persistor={persistor} loading={<LoadingMessage message="Restoring state..." />}>
        <Box
          sx={{
            flexGrow: 1,
            position: 'relative',
            display: 'flex',
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'start',
            justifyContent: 'start',
            marginTop: overlapHeader ? 2 : 0,
          }}
        >
          {hideSidebar ? <SidebarMenu /> : <Sidebar layout={layout} />}
          <Router layout={layout} />
        </Box>
        {showBottomMenu && <BottomMenu layout={layout} />}
      </PersistGate>
    </Page>
  )
}
