import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { State, Dispatch } from '../../store'
import { CHAT_PANEL_WIDTH, CHAT_PANEL_WIDTH_EXPANDED } from '../../constants'
import { IconButton } from '../../buttons/IconButton'
import { ChatBody } from './ChatBody'

export const ChatPanel: React.FC = () => {
  const chat = useSelector((state: State) => state.chat)
  const singlePanel = useSelector((state: State) => state.ui.layout.singlePanel)
  const dispatch = useDispatch<Dispatch>()

  // Completes a Hydra sign-in redirect if this page load carries ?code —
  // runs on mount regardless of whether the panel is open
  useEffect(() => {
    dispatch.chat.handleSignInCallback()
  }, [])

  useEffect(() => {
    if (chat.open) {
      dispatch.chat.resetTransient()
      dispatch.chat.syncOrg()
      dispatch.chat.checkHealth()
    }
  }, [chat.open])

  if (!chat.open) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        flexShrink: 0,
        // Docked column beside the panels; full-screen overlay below the
        // single-panel breakpoint, matching how pages collapse
        ...(singlePanel
          ? { position: 'absolute', inset: 0, width: '100%', zIndex: 15 }
          : {
              position: 'relative',
              height: '100%',
              width: chat.expanded ? CHAT_PANEL_WIDTH_EXPANDED : CHAT_PANEL_WIDTH,
            }),
        bgcolor: 'white.main',
        borderLeft: singlePanel ? 0 : 1,
        borderColor: 'grayLighter.main',
        paddingBottom: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', paddingX: 2, paddingY: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, padding: 0, margin: 0, minHeight: 0 }}>
          New Chat
        </Typography>
        {!singlePanel && (
          <IconButton
            icon="arrows-left-right"
            title={chat.expanded ? 'Collapse' : 'Expand'}
            onClick={() => dispatch.chat.set({ expanded: !chat.expanded })}
          />
        )}
        <IconButton icon="plus" title="New Chat" onClick={() => dispatch.chat.clearConversation()} />
        <IconButton icon="times" title="Close" onClick={() => dispatch.chat.set({ open: false })} />
      </Box>
      <ChatBody />
    </Box>
  )
}
