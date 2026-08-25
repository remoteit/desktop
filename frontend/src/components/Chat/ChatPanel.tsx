import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Box } from '@mui/material'
import { State, Dispatch } from '../../store'
import { useChatDocked, useChatWidth } from '../../hooks/useChatEnabled'
import { useChatMainSync } from '../../hooks/useChatSync'
import { IconButton } from '../../buttons/IconButton'
import { ChatHeader, NewChatButton, HistoryButton } from './ChatHeader'
import { ChatBody } from './ChatBody'
import browser from '../../services/browser'

/* Display-only: lifecycle, popout protocol, and org mirroring live in
   useChatMainSync; user actions dispatch chat model effects */
export const ChatPanel: React.FC = () => {
  const { t } = useTranslation()
  const open = useSelector((state: State) => state.chat.open)
  const expanded = useSelector((state: State) => state.chat.expanded)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const showBottomMenu = useSelector((state: State) => state.ui.layout.showBottomMenu)
  const docked = useChatDocked()
  const chatWidth = useChatWidth()
  const dispatch = useDispatch<Dispatch>()

  useChatMainSync()

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
              width: chatWidth,
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
    >
      <ChatHeader>
        {docked && (
          <IconButton
            icon="arrows-left-right"
            title={expanded ? t('chat.collapse', 'Collapse') : t('chat.expand', 'Expand')}
            onClick={() => dispatch.chat.set({ expanded: !expanded })}
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
