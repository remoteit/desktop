import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import browser from '../services/browser'
import useSafeArea from '../hooks/useSafeArea'
import useCapacitor from '../hooks/useCapacitor'
import { useViewAsUser } from '../hooks/useViewAsUser'
import { persistor } from '../store'
import { useLocation } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { selectResellerRef } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import {
  HIDE_SIDEBAR_WIDTH,
  HIDE_TWO_PANEL_WIDTH,
  MOBILE_WIDTH,
  REGEX_FIRST_PATH,
  SHOW_TRIPLE_PANEL_WIDTH,
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
import { useChatEnabled, useChatDocked, useChatWidth, useSidebarWidth } from '../hooks/useChatEnabled'
import { Router } from '../routers/Router'
import { Page } from '../pages/Page'
import { Logo } from '@common/brand/Logo'
import { ViewAsBanner } from './ViewAsBanner'
import { AnnouncementDialog } from './AnnouncementDialog'
import { AnnouncementBanner } from './AnnouncementBanner'
import { isChatPopout } from '../services/chatPopout'

// Lazy: keeps the chat surface (and its react-markdown dependency tree) out
// of the startup bundle — the feature is dev/Test-UI gated
const ChatPanel = React.lazy(() => import('./Chat/ChatPanel').then(m => ({ default: m.ChatPanel })))
const ChatWindow = React.lazy(() => import('./Chat/ChatWindow').then(m => ({ default: m.ChatWindow })))

export const App: React.FC = () => {
  // Subscribe the whole app to i18next language changes and lazy-locale loads, so
  // render-time translations resolved outside React (Attribute label getters,
  // value functions, date/duration helpers) re-render when the language switches
  // or a non-English catalog chunk finishes loading.
  useTranslation()
  const { insets } = useSafeArea()
  const location = useLocation()
  const hideSplashScreen = useCapacitor()
  const authInitialized = useSelector((state: State) => state.auth.initialized)
  const authenticated = useSelector((state: State) => state.auth.authenticated)
  const user = useSelector((state: State) => state.auth.user)
  const installed = useSelector((state: State) => state.binaries.installed)
  const waitMessage = useSelector((state: State) => state.ui.waitMessage)
  const showOrgs = useSelector((state: State) => !!state.accounts.membership.length)
  const chatEnabled = useChatEnabled()
  const chatDocked = useChatDocked()
  const chatWidth = useChatWidth()
  const sidebarWidth = useSidebarWidth()
  const reseller = useSelector(selectResellerRef)
  const dispatch = useDispatch<Dispatch>()
  const hideSidebar = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const singlePanel = useMediaQuery(`(max-width:${HIDE_TWO_PANEL_WIDTH}px)`)
  const triplePanel = useMediaQuery(`(min-width:${SHOW_TRIPLE_PANEL_WIDTH}px)`)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  // The docked chat column reserves layout space the same way the sidebar
  // does; useChatDocked only docks when the panels still fit beside it —
  // otherwise the chat renders as an overlay and reserves nothing
  const sidePanelWidth = sidebarWidth + (chatDocked ? chatWidth : 0)
  const isRootMenu = location.pathname.match(REGEX_FIRST_PATH)?.[0] === location.pathname
  const showBottomMenu = (mobile || browser.isMobile) && isRootMenu && hideSidebar
  const needsUserHydration = authenticated && !user
  const signedOut = !authInitialized || !authenticated

  const layout: ILayout = {
    insets,
    mobile,
    showOrgs,
    hideSidebar,
    showBottomMenu,
    singlePanel,
    triplePanel,
    sidePanelWidth,
  }

  useViewAsUser()

  useEffect(() => {
    hideSplashScreen()
  }, [])

  useEffect(() => {
    dispatch.ui.set({ layout })
  }, [insets, mobile, showOrgs, hideSidebar, showBottomMenu, singlePanel, triplePanel, sidePanelWidth])

  if (waitMessage)
    return (
      <Page>
        <LoadingMessage message={`Please wait, ${waitMessage}...`} />
      </Page>
    )

  if (!authInitialized || needsUserHydration)
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
      <AnnouncementBanner />
      <PersistGate persistor={persistor} loading={<LoadingMessage message="Restoring state..." />}>
        {/* isChatPopout is a boot constant — the window only exists because
            chat opened it, so no feature-flag gate (chatEnabled depends on
            async-restored testUI and would flash the full app in the popup) */}
        {isChatPopout ? (
          <React.Suspense fallback={null}>
            <ChatWindow />
          </React.Suspense>
        ) : (
          <>
            <Box
              sx={{
                flexGrow: 1,
                position: 'relative',
                display: 'flex',
                overflow: 'hidden',
                flexDirection: 'row',
                alignItems: 'start',
                justifyContent: 'start',
              }}
            >
              {hideSidebar ? <SidebarMenu /> : <Sidebar layout={layout} />}
              <Router layout={layout} />
              {chatEnabled && (
                <React.Suspense fallback={null}>
                  <ChatPanel />
                </React.Suspense>
              )}
            </Box>
            {showBottomMenu && <BottomMenu layout={layout} />}
          </>
        )}
        <AnnouncementDialog />
      </PersistGate>
    </Page>
  )
}
