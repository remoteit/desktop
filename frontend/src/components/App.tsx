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
import { HIDE_TWO_PANEL_WIDTH, MOBILE_WIDTH, REGEX_FIRST_PATH, SHOW_TRIPLE_PANEL_WIDTH } from '../constants'
import { State, Dispatch } from '../store'
import { Box } from '@mui/material'
import { InstallationNotice } from './InstallationNotice'
import { LoadingMessage } from './LoadingMessage'
import { ResellerLogo } from './ResellerLogo'
import { SidebarMenu } from './SidebarMenu'
import { SignInPage } from '../pages/SignInPage'
import { BottomMenu } from './BottomMenu'
import { Sidebar } from './Sidebar'
import { useChatEnabled, useSidebarWidth, useEffectiveWidth, useHideSidebar } from '../hooks/useChatEnabled'
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
  const sidebarWidth = useSidebarWidth()
  const reseller = useSelector(selectResellerRef)
  const dispatch = useDispatch<Dispatch>()
  // Breakpoints measure the EFFECTIVE width — the window minus the docked chat
  // column — so opening or widening the chat reflows the app (sidebar → hamburger,
  // two panels → one) exactly the way shrinking the window does
  const effectiveWidth = useEffectiveWidth()
  const hideSidebar = useHideSidebar()
  const singlePanel = effectiveWidth <= HIDE_TWO_PANEL_WIDTH
  const triplePanel = effectiveWidth >= SHOW_TRIPLE_PANEL_WIDTH
  const mobile = effectiveWidth <= MOBILE_WIDTH
  /* Chrome the content panels have to share their row with. The chat is NOT in that
     row — it is a column beside the whole app side — so it must not be counted here:
     the panels' own parent already excludes it, and adding it back subtracted the chat
     twice, which drove their max width below their minimum and froze the drag. */
  const sidePanelWidth = sidebarWidth
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
              }}
            >
              {/* The app side owns its own chrome. The sidebar, the pages AND the bottom
                  menu stack in this column, so the docked chat is a full-height column
                  BESIDE all three rather than a panel the menu runs underneath. */}
              <Box
                sx={{
                  flexGrow: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    flexGrow: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'start',
                    justifyContent: 'start',
                  }}
                >
                  {hideSidebar ? <SidebarMenu /> : <Sidebar layout={layout} />}
                  <Router layout={layout} />
                </Box>
                {showBottomMenu && <BottomMenu layout={layout} />}
              </Box>
              {chatEnabled && (
                <React.Suspense fallback={null}>
                  <ChatPanel />
                </React.Suspense>
              )}
            </Box>
          </>
        )}
        <AnnouncementDialog />
      </PersistGate>
    </Page>
  )
}
