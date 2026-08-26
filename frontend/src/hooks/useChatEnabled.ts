import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import {
  MODE,
  CHAT_ALWAYS_ON,
  CHAT_PANEL_WIDTH,
  CHAT_PANEL_WIDTH_MIN,
  HIDE_TWO_PANEL_WIDTH,
  HIDE_SIDEBAR_WIDTH,
  SIDEBAR_WIDTH,
  ORGANIZATION_BAR_WIDTH,
} from '../constants'

/* The Remote.It AI chat is always on in local dev builds and on the dedicated AI portal
   (CHAT_ALWAYS_ON, set for app.ai.remote.it); in every other deployed build it soft-launches
   behind the hidden Test UI (shift+option on the avatar menu → Test UI). */
export const useChatEnabled = (): boolean => {
  const testUI = useSelector((state: State) => state.ui.testUI)
  return MODE === 'development' || CHAT_ALWAYS_ON || !!testUI
}

/* Viewport width, tracked for the chat column's fit math — the content
   panels measure on the same event (see DoublePanel's resize listener) */
const useViewportWidth = (): number => {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/* The widest the chat column may be dragged: whatever the window holds once the
   content area keeps its single-panel minimum. The sidebar no longer caps the drag —
   the layout breakpoints below measure the REMAINING width, so a chat dragged wide
   collapses the sidebar into the hamburger menu exactly as narrowing the window would. */
export const useChatMaxWidth = (): number => {
  const viewport = useViewportWidth()
  return Math.max(CHAT_PANEL_WIDTH_MIN, viewport - HIDE_TWO_PANEL_WIDTH)
}

/* Width the docked chat column occupies — single source for the fit-check
   below, App's reserved layout width, and ChatPanel's rendered width. The
   stored width is clamped to what fits, so a column dragged wide on a large
   display still docks (narrower) on a small one instead of sticking as an
   overlay the user has no handle to resize. */
export const useChatWidth = (): number => {
  const stored = useSelector((state: State) => state.chat.width)
  const max = useChatMaxWidth()
  return Math.min(Math.max(stored || CHAT_PANEL_WIDTH, CHAT_PANEL_WIDTH_MIN), max)
}

/* Whether the open chat reserves layout width (docked) or floats as an
   overlay. Docked only when at least one content panel still fits beside the
   column, and never while maximized — the expanded chat covers the content
   area as an overlay so the layout underneath keeps its full width. */
export const useChatDocked = (): boolean => {
  const enabled = useChatEnabled()
  const open = useSelector((state: State) => state.chat.open)
  const expanded = useSelector((state: State) => state.chat.expanded)
  const viewport = useViewportWidth()
  const chatWidth = useChatWidth()
  return enabled && open && !expanded && viewport - chatWidth >= HIDE_TWO_PANEL_WIDTH
}

/* The width the app layout actually has left: the window minus the docked chat
   column. Every layout breakpoint (sidebar, single/triple panel, mobile) measures
   THIS instead of the raw window, so docking the chat reflows the app the same way
   shrinking the window does. Consistency is arithmetic, not luck: docked guarantees
   HIDE_TWO_PANEL_WIDTH remains, and a visible sidebar implies more than
   HIDE_SIDEBAR_WIDTH remains — which more than covers sidebar chrome plus a panel. */
export const useEffectiveWidth = (): number => {
  const viewport = useViewportWidth()
  const docked = useChatDocked()
  const chatWidth = useChatWidth()
  return docked ? viewport - chatWidth : viewport
}

/* max-width media query semantics (≤) against the effective width — shared by App
   and the components that mirror its sidebar breakpoint (Header, AvatarMenu…) */
export const useHideSidebar = (): boolean => useEffectiveWidth() <= HIDE_SIDEBAR_WIDTH

/* Width of the left chrome (sidebar + org bar) the layout reserves —
   shared by App's sidePanelWidth and the chat overlay's left edge */
export const useSidebarWidth = (): number => {
  const showOrgs = useSelector((state: State) => !!state.accounts.membership.length)
  const hideSidebar = useHideSidebar()
  return hideSidebar ? 0 : SIDEBAR_WIDTH + (showOrgs ? ORGANIZATION_BAR_WIDTH : 0)
}
