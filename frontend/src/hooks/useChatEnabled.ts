import { useEffect, useState } from 'react'
import { useMediaQuery } from '@mui/material'
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

/* The widest the chat column may be dragged: what is left once the sidebar
   chrome and the two content panels keep their minimums. Bounding the drag
   here is also what keeps the column docked — a wider chat would fail the
   fit-check below and snap to a full-screen overlay mid-drag. */
export const useChatMaxWidth = (): number => {
  const viewport = useViewportWidth()
  const sidebarWidth = useSidebarWidth()
  return Math.max(CHAT_PANEL_WIDTH_MIN, viewport - sidebarWidth - HIDE_TWO_PANEL_WIDTH)
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

/* Width of the left chrome (sidebar + org bar) the layout reserves —
   shared by App's sidePanelWidth and the chat docking fit-check */
export const useSidebarWidth = (): number => {
  const showOrgs = useSelector((state: State) => !!state.accounts.membership.length)
  const hideSidebar = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  return hideSidebar ? 0 : SIDEBAR_WIDTH + (showOrgs ? ORGANIZATION_BAR_WIDTH : 0)
}

/* Whether the open chat reserves layout width (docked) or floats as a
   full-screen overlay. Docked only when the window still fits two content
   panels beside the sidebar chrome and the chat column — reserving width
   past that point drives the panel resize math below its minimums. */
export const useChatDocked = (): boolean => {
  const enabled = useChatEnabled()
  const open = useSelector((state: State) => state.chat.open)
  const required = useChatWidth() + HIDE_TWO_PANEL_WIDTH + useSidebarWidth()
  const fits = useMediaQuery(`(min-width:${required}px)`)
  return enabled && open && fits
}
