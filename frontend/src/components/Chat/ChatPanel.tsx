import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Box } from '@mui/material'
import { State, Dispatch } from '../../store'
import { CHAT_PANEL_WIDTH, CHAT_PANEL_WIDTH_EXPANDED, CHAT_PANEL_WIDTH_MIN } from '../../constants'
import { useChatDocked, useChatWidth, useChatMaxWidth } from '../../hooks/useChatEnabled'
import { useChatMainSync } from '../../hooks/useChatSync'
import { usePanelDrag } from '../../hooks/usePanelDrag'
import { PanelHandle } from '../PanelHandle'
import { IconButton } from '../../buttons/IconButton'
import { ChatHeader, NewChatButton, HistoryButton } from './ChatHeader'
import { ChatBody } from './ChatBody'
import browser from '../../services/browser'

/* Display-only: lifecycle, popout protocol, and org mirroring live in
   useChatMainSync; user actions dispatch chat model effects */
export const ChatPanel: React.FC = () => {
  const { t } = useTranslation()
  const open = useSelector((state: State) => state.chat.open)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const showBottomMenu = useSelector((state: State) => state.ui.layout.showBottomMenu)
  const layout = useSelector((state: State) => state.ui.layout)
  const docked = useChatDocked()
  const chatWidth = useChatWidth()
  const maxWidth = useChatMaxWidth()
  const panelRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<Dispatch>()

  useChatMainSync()

  // Drag-to-resize, same mechanism as the content panels — anchored right, so
  // pulling the handle left widens the chat. The width persists on release.
  const getMaxWidth = useCallback(() => maxWidth, [maxWidth])
  const drag = usePanelDrag(chatWidth, {
    panelRef,
    minWidth: CHAT_PANEL_WIDTH_MIN,
    getMaxWidth,
    onPersist: width => dispatch.chat.set({ width }),
    layoutDep: layout,
    anchor: 'right',
  })
  const expanded = chatWidth >= CHAT_PANEL_WIDTH_EXPANDED

  if (!open) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        flexShrink: 0,
        // Docked column beside the panels when it fits; full-screen overlay
        // otherwise, matching how pages collapse on small windows
        ...(docked
          ? {
              position: 'relative',
              height: '100%',
              width: drag.width,
            }
          : { position: 'absolute', inset: 0, width: '100%', zIndex: 15, paddingLeft: insets?.leftPx }),
        // Match the page panels' safe-area handling (Panel.tsx): keep the
        // header clear of the notch and the input clear of the home
        // indicator on mobile; the bottom menu carries its own inset
        paddingTop: insets?.topPx,
        paddingRight: insets?.rightPx,
        bgcolor: 'white.main',
        borderLeft: docked ? 1 : 0,
        borderColor: 'grayLighter.main',
        paddingBottom: showBottomMenu ? 1 : insets?.bottomPx || 1,
      }}
      ref={panelRef}
    >
      {docked && <PanelHandle inset onMouseDown={drag.onDown} grab={drag.grab} />}
      <ChatHeader>
        {docked && (
          <IconButton
            icon="arrows-left-right"
            title={expanded ? t('chat.collapse', 'Collapse') : t('chat.expand', 'Expand')}
            onClick={() =>
              dispatch.chat.set({
                width: Math.min(expanded ? CHAT_PANEL_WIDTH : CHAT_PANEL_WIDTH_EXPANDED, maxWidth),
              })
            }
          />
        )}
        {!browser.isMobile && (
          <IconButton
            icon="arrow-up-right-from-square"
            title={t('chat.popOut', 'Pop out')}
            onClick={() => dispatch.chat.popOut()}
          />
        )}
        <HistoryButton />
        <NewChatButton />
        <IconButton icon="times" title={t('chat.close', 'Close')} onClick={() => dispatch.chat.set({ open: false })} />
      </ChatHeader>
      <ChatBody />
    </Box>
  )
}
