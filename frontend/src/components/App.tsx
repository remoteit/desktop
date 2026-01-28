import React, { useEffect } from 'react'
import browser from '../services/browser'
import useSafeArea from '../hooks/useSafeArea'
import useCapacitor from '../hooks/useCapacitor'
import { persistor } from '../store'
import { useLocation, useHistory } from 'react-router-dom'
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
import { Logo } from '@common/brand/Logo'
import { ViewAsBanner } from './ViewAsBanner'

export const App: React.FC = () => {
  const { insets } = useSafeArea()
  const location = useLocation()
  const history = useHistory()
  const hideSplashScreen = useCapacitor()
  const authInitialized = useSelector((state: State) => state.auth.initialized)
  const installed = useSelector((state: State) => state.binaries.installed)
  const signedOut = useSelector((state: State) => !state.auth.initialized || !state.auth.authenticated)
  const waitMessage = useSelector((state: State) => state.ui.waitMessage)
  const showOrgs = useSelector((state: State) => !!state.accounts.membership.length)
  const reseller = useSelector(selectResellerRef)
  const viewAsUser = useSelector((state: State) => state.ui.viewAsUser)
  const dispatch = useDispatch<Dispatch>()
  const hideSidebar = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const singlePanel = useMediaQuery(`(max-width:${HIDE_TWO_PANEL_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
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

  // Handle viewAs URL parameter and restore from sessionStorage
  useEffect(() => {
    // First, try to restore from sessionStorage (survives refresh)
    const savedViewAs = window.sessionStorage.getItem('viewAsUser')
    if (savedViewAs) {
      try {
        const viewAsUser = JSON.parse(savedViewAs)
        dispatch.ui.set({ viewAsUser })
        console.log('Restored viewAs from sessionStorage:', viewAsUser)
      } catch (e) {
        console.error('Failed to parse viewAsUser from sessionStorage:', e)
      }
    }
    
    // Then check URL parameter (for initial open)
    const params = new URLSearchParams(location.search)
    const viewAsParam = params.get('viewAs')
    
    if (viewAsParam) {
      const [userId, email] = viewAsParam.split(',')
      if (userId && email) {
        const viewAsUser = { id: userId, email: decodeURIComponent(email) }
        dispatch.ui.set({ viewAsUser })
        // Save to sessionStorage for persistence across refreshes
        window.sessionStorage.setItem('viewAsUser', JSON.stringify(viewAsUser))
        console.log('Set viewAs from URL:', viewAsUser)
        
        // Remove the parameter from URL
        params.delete('viewAs')
        const newSearch = params.toString()
        history.replace({
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : '',
        })
      }
    }
  }, [location.search])

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
      <ViewAsBanner />
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
            marginTop: viewAsUser ? '33px' : 0,
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
