import { useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'
import { State } from '../store'
import {
  MODE,
  CHAT_ALWAYS_ON,
  CHAT_PANEL_WIDTH,
  CHAT_PANEL_WIDTH_EXPANDED,
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

/* Width the docked chat column occupies — single source for the fits-check
   below, App's reserved layout width, and ChatPanel's rendered width */
export const useChatWidth = (): number => {
  const expanded = useSelector((state: State) => state.chat.expanded)
  return expanded ? CHAT_PANEL_WIDTH_EXPANDED : CHAT_PANEL_WIDTH
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
