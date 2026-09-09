import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Theme } from '@mui/material'
import { State, Dispatch } from '../../store'
import { CHAT_PANEL_WIDTH_MIN } from '../../constants'
import { radius } from '../../styling'
import {
  useChatDocked,
  useChatWidth,
  useChatMaxWidth,
  useSidebarWidth,
  layoutBreakpoints,
} from '../../hooks/useChatEnabled'
import { useViewportWidth } from '../../hooks/useViewportWidth'
import { useChatMainSync } from '../../hooks/useChatSync'
import { usePanelDrag } from '../../hooks/usePanelDrag'
import { PanelHandle } from '../PanelHandle'
import { IconButton } from '../../buttons/IconButton'
import { ChatHeader, NewChatButton } from './ChatHeader'
import { ChatBody } from './ChatBody'
import browser from '../../services/browser'

/* How far the docked column floats off the window edges, in theme spacing units.
   One knob: the margins and the size subtractions below both derive from it, so a
   change here can't leave the box and its margins disagreeing. */
const INSET = 1

/* Display-only: lifecycle, popout protocol, and org mirroring live in
   useChatMainSync; user actions dispatch chat model effects */
export const ChatPanel: React.FC = () => {
  const { t } = useTranslation()
  const open = useSelector((state: State) => state.chat.open)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const layout = useSelector((state: State) => state.ui.layout)
  const docked = useChatDocked()
  const chatWidth = useChatWidth()
  const maxWidth = useChatMaxWidth()
  const sidebarWidth = useSidebarWidth()
  const viewport = useViewportWidth()
  const panelRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<Dispatch>()

  useChatMainSync()

  // Drag-to-resize, same mechanism as the content panels — anchored right, so
  // pulling the handle left widens the chat. Unlike those panels the width has
  // to publish on every frame, not just on release: App reserves this column's
  // width in the layout and DoublePanel sizes the content area from it, so a
  // width held back until mouseup leaves the content on a stale minWidth that
  // will not shrink — the column then overflows the window until it snaps.
  const getMaxWidth = useCallback(() => maxWidth, [maxWidth])

  /* Publishing every pixel put a redux write — and with it a re-render of the whole app
     — on every frame of the drag, which measured ~36ms a frame against ~8ms for the
     content divider. The column itself is drawn from the drag's own local state, and
     the only thing the app wants this width for is its breakpoints, so publish when one
     is actually crossed and once more on release. */
  const published = useRef(chatWidth)
  const setWidth = useCallback(
    (width: number) => {
      published.current = width
      dispatch.chat.set({ width })
    },
    [dispatch]
  )
  const publishIfLayoutChanges = useCallback(
    (width: number) => {
      if (layoutBreakpoints(viewport - width) === layoutBreakpoints(viewport - published.current)) return
      setWidth(width)
    },
    [setWidth, viewport]
  )
  const drag = usePanelDrag(chatWidth, {
    panelRef,
    minWidth: CHAT_PANEL_WIDTH_MIN,
    getMaxWidth,
    onChange: publishIfLayoutChanges,
    onPersist: setWidth,
    layoutDep: layout,
    anchor: 'right',
  })
  if (!open) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        flexShrink: 0,
        // Docked column beside the panels when it fits, otherwise an overlay over the
        // CONTENT area — a phone, or a window too narrow to hold both. The overlay's
        // left edge stops at the sidebar chrome so it never covers the left nav; when
        // the sidebar is hidden it spans the window
        ...(docked
          ? {
              position: 'relative',
              /* Floating inset column. The margins come OUT of the width App already
                 reserves for the chat (chatWidth), rather than being added to it — so
                 the footprint still measures drag.width and the content area's math,
                 the drag clamp and the effective-width breakpoints all stay honest.
                 Hence subtracting one inset horizontally (right margin only) and two
                 vertically (top and bottom). */
              marginY: INSET,
              marginRight: INSET,
              height: (theme: Theme) => `calc(100% - ${theme.spacing(INSET * 2)})`,
              width: (theme: Theme) => `calc(${drag.width}px - ${theme.spacing(INSET)})`,
              borderRadius: `${radius.lg}px`,
            }
          : {
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              left: sidebarWidth,
              zIndex: 15,
              paddingLeft: sidebarWidth ? undefined : insets?.leftPx,
            }),
        // Match the page panels' safe-area handling (Panel.tsx): keep the
        // header clear of the notch and the input clear of the home
        // indicator on mobile; the bottom menu carries its own inset
        paddingTop: insets?.topPx,
        paddingRight: insets?.rightPx,
        bgcolor: 'grayLightest.main',
        // Only the overlay needs a drawn edge — the floating column is separated by
        // its shadow, and a left-only border would run out mid-way around the radius
        borderLeft: !docked && sidebarWidth ? 1 : 0,
        borderColor: 'grayLighter.main',
        boxShadow: docked || sidebarWidth ? 3 : 0,
        // The chat reaches the window's bottom edge in both modes now — a full-height
        // column beside the bottom menu when docked, over it when it overlays — so it
        // owns its safe-area inset rather than leaving it to the menu below it
        paddingBottom: insets?.bottomPx || 1.5,
      }}
      ref={panelRef}
    >
      {docked && <PanelHandle inset onMouseDown={drag.onDown} grab={drag.grab} />}
      <ChatHeader>
        {!browser.isMobile && !layout.mobile && (
          <IconButton
            icon="arrow-up-right-from-square"
            title={t('chat.popOut', 'Pop out')}
            onClick={() => dispatch.chat.popOut()}
          />
        )}
        <NewChatButton />
        <IconButton icon="times" title={t('chat.close', 'Close')} onClick={() => dispatch.chat.set({ open: false })} />
      </ChatHeader>
      <ChatBody />
    </Box>
  )
}
