import { useSelector } from 'react-redux'
import { State } from '../store'
import browser from '../services/browser'
import { useViewportWidth } from './useViewportWidth'
import {
  MODE,
  CHAT_ALWAYS_ON,
  CHAT_PANEL_WIDTH,
  CHAT_PANEL_WIDTH_MIN,
  CHAT_MIN_CONTENT_WIDTH,
  HIDE_SIDEBAR_WIDTH,
  HIDE_TWO_PANEL_WIDTH,
  SHOW_TRIPLE_PANEL_WIDTH,
  MOBILE_WIDTH,
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

/* The widest the chat column may be dragged: whatever the window holds once the
   content keeps CHAT_MIN_CONTENT_WIDTH. The sidebar does not cap the drag — the layout
   breakpoints below measure the REMAINING width, so a chat dragged wide collapses the
   sidebar into the hamburger exactly as narrowing the window would. This is also what
   keeps the column docked as the WINDOW shrinks: the chat gives up its own width first,
   down to CHAT_PANEL_WIDTH_MIN, rather than the app flipping to a full-screen chat. */
export const useChatMaxWidth = (): number => {
  const viewport = useViewportWidth()
  return Math.max(CHAT_PANEL_WIDTH_MIN, viewport - CHAT_MIN_CONTENT_WIDTH)
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

/* Whether the open chat reserves layout width (docked) or covers the app as an
   overlay. Taking the whole screen is a PHONE behaviour, not a small-window one:
   a narrow desktop window keeps the column and lets the chat and the content share
   what there is. On a real screen the chat is always a column — it is resized by
   dragging its edge, not by a maximize toggle. The threshold is DERIVED — the window must hold the column at its minimum and the
   content at its minimum — rather than borrowed from the two-panel breakpoint, which
   is what used to un-dock the chat on windows as wide as 1150px. Deliberately
   independent of the chat's CURRENT width: gating docking on the width that docking
   determines is what let the panel flip out from under a drag. */
export const useChatDocked = (): boolean => {
  const enabled = useChatEnabled()
  const open = useSelector((state: State) => state.chat.open)
  const viewport = useViewportWidth()
  const fits = viewport >= CHAT_PANEL_WIDTH_MIN + CHAT_MIN_CONTENT_WIDTH
  return enabled && open && !browser.isMobile && fits
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

/* The app reads the chat's width ONLY through these thresholds — the sidebar collapsing,
   one panel or two or three, phone size. Nothing downstream wants the pixel value, so a
   drag has to publish once per threshold it crosses rather than once per frame. Packed
   into one number purely so two widths can be compared for "same layout" in a line. */
export const layoutBreakpoints = (effectiveWidth: number): number =>
  (effectiveWidth <= HIDE_SIDEBAR_WIDTH ? 1 : 0) +
  (effectiveWidth <= HIDE_TWO_PANEL_WIDTH ? 2 : 0) +
  (effectiveWidth >= SHOW_TRIPLE_PANEL_WIDTH ? 4 : 0) +
  (effectiveWidth <= MOBILE_WIDTH ? 8 : 0)
